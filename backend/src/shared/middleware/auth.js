// src/shared/middleware/auth.js
// ⭐ Sprint 10 — Security Hardening
// 🔧 Sprint 11 — Logger Winston + fix lógica de inactividad
// 🔒 Sprint 12 — Fix crítico jti NULL + token_blacklist check + jti en req.user
// 🐛 Sprint 12 Fix — token_id consultado directo a BD, no depende del modelo Usuario
// 🚀 Sprint 15 — DT-04: blacklist check migrado a Redis GET O(1)
// 🏢 Sprint 19 — Multi-empresa: empresa_id consultado directo a BD
// 📦 Sprint 20 — Migrado a src/shared/middleware/ (paths actualizados)
//
// POR QUÉ empresa_id SE CONSULTA DIRECTO A BD (no desde decoded ni desde Usuario.getById):
//   - Tokens emitidos ANTES de la migración no tienen empresa_id en el payload.
//   - Usuario.getById() puede no retornar empresa_id si su SELECT no lo incluye.
//   - El mismo patrón ya se aplicó para token_id en Sprint 12 Fix.
//   - Solución: query explícita SELECT empresa_id FROM usuarios WHERE id = ?
//     igual que la query de token_id — independiente del modelo y del token antiguo.

'use strict';

const jwt     = require('jsonwebtoken');
// Módulo usuario migrado en Sprint 20
const Usuario = require('../../modules/usuario/usuario.repository');
const db      = require('../../../config/database');
const redis   = require('../../../config/redis');
const { timingSafeEqual } = require('./security');   // proxy → middleware/security.js
const logger  = require('../../../utils/logger');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token no proporcionado',
      });
    }

    // ── 1. Verificar firma y expiración ───────────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      const esExpirado = jwtError.name === 'TokenExpiredError';
      logger.warn('JWT_VERIFY_FAIL', {
        event: 'auth.token_invalid',
        tipo:  jwtError.name,
        ip:    req.ip,
        path:  req.path,
      });
      return res.status(401).json({
        success:  false,
        message:  esExpirado
          ? 'Sesión expirada. Inicia sesión nuevamente.'
          : 'Token inválido.',
        expired: esExpirado,
      });
    }

    // ── 2. Verificar blacklist (Redis O(1)) ───────────────────────────────
    if (decoded.jti) {
      const blacklisted = await redis.get('bl:' + decoded.jti);
      if (blacklisted) {
        logger.warn('JWT_BLACKLISTED', {
          event:  'auth.token_blacklisted',
          userId: decoded.id,
          ip:     req.ip,
        });
        return res.status(401).json({
          success: false,
          message: 'Sesión cerrada. Inicia sesión nuevamente.',
          expired: true,
        });
      }
    }

    // ── 3. Cargar usuario ─────────────────────────────────────────────────
    const usuario = await Usuario.getById(decoded.id);

    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (!usuario.activo) {
      logger.warn('ACCESS_INACTIVE_USER', {
        event:  'auth.inactive_user',
        userId: decoded.id,
        ip:     req.ip,
      });
      return res.status(401).json({ success: false, message: 'Usuario desactivado' });
    }

    // ── 4. Query directa a BD: token_id + empresa_id ──────────────────────
    //
    // Se consultan ambas columnas en UNA sola query para no hacer 2 round-trips.
    //
    // FIX Sprint 12: token_id no lo devuelve Usuario.getById() → query explícita.
    // FIX Sprint 19: empresa_id igual — tokens viejos no lo traen en decoded,
    //   y Usuario.getById() puede no incluirlo en su SELECT.
    //   La query directa garantiza siempre el valor real de la BD.
    //
    const [userRows] = await db.query(
      'SELECT token_id, empresa_id FROM usuarios WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    const dbTokenId   = userRows[0]?.token_id  ?? null;
    const dbEmpresaId = userRows[0]?.empresa_id ?? null;  // ← Sprint 19

    // ── 4a. Validar jti ───────────────────────────────────────────────────
    if (decoded.jti) {
      if (!dbTokenId) {
        logger.warn('JWT_TOKEN_ID_NULL', {
          event:  'auth.token_id_null',
          userId: decoded.id,
          ip:     req.ip,
        });
        return res.status(401).json({
          success: false,
          message: 'Sesión cerrada. Inicia sesión nuevamente.',
          expired: true,
        });
      }

      if (!timingSafeEqual(decoded.jti, dbTokenId)) {
        logger.warn('JWT_REVOKED', {
          event:  'auth.token_revoked',
          userId: decoded.id,
          ip:     req.ip,
        });
        return res.status(401).json({
          success: false,
          message: 'Token revocado. Inicia sesión nuevamente.',
          expired: true,
        });
      }
    }

    // ── 4b. Validar empresa_id ────────────────────────────────────────────
    if (!dbEmpresaId) {
      logger.warn('EMPRESA_ID_NULL', {
        event:  'auth.empresa_id_null',
        userId: decoded.id,
        ip:     req.ip,
        note:   'Ejecutar migración Sprint 19: 02_agregar_empresa_id_safe.sql',
      });
      return res.status(401).json({
        success: false,
        message: 'Usuario sin empresa asignada. Contacta al administrador.',
      });
    }

    // ── 5. Poblar req.user ────────────────────────────────────────────────
    // empresa_id SIEMPRE desde la BD — nunca desde decoded (puede ser token viejo)
    req.user = {
      id:         usuario.id,
      nombre:     usuario.nombre,
      email:      usuario.email,
      rol:        usuario.rol,
      empresa_id: dbEmpresaId,   // ← Sprint 19: desde BD, no desde decoded
      jti:        decoded.jti || null,
    };

    next();
  } catch (error) {
    logger.error('AUTH_MIDDLEWARE_ERROR', {
      event:   'auth.middleware_error',
      message: error.message,
      ip:      req.ip,
      path:    req.path,
    });
    return res.status(500).json({ success: false, message: 'Error en la autenticación' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      logger.accessDenied(req.user.rol, req.path, req.ip);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
      });
    }
    next();
  };
};