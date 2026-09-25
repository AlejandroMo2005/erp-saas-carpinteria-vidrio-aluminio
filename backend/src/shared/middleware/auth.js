'use strict';

const jwt = require('jsonwebtoken');
const { timingSafeEqual } = require('./security');
const logger = require('../../../utils/logger');

/**
 * Crea el middleware de protección con las dependencias proporcionadas.
 *
 * La inyección de dependencias permite realizar pruebas unitarias
 * sin inicializar MySQL, Redis ni el repositorio real de usuarios.
 */
function createProtect({
  Usuario,
  db,
  redis,
  jwtLib = jwt,
  timingSafeEqualFn = timingSafeEqual,
  loggerInstance = logger,
}) {
  return async (req, res, next) => {
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

      // ── 1. Verificar firma y expiración ───────────────────────────────
      let decoded;

      try {
        decoded = jwtLib.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        const esExpirado = jwtError.name === 'TokenExpiredError';

        loggerInstance.warn('JWT_VERIFY_FAIL', {
          event: 'auth.token_invalid',
          tipo: jwtError.name,
          ip: req.ip,
          path: req.path,
        });

        return res.status(401).json({
          success: false,
          message: esExpirado
            ? 'Sesión expirada. Inicia sesión nuevamente.'
            : 'Token inválido.',
          expired: esExpirado,
        });
      }

      // ── 2. Verificar blacklist (Redis O(1)) ───────────────────────────
      if (decoded.jti) {
        const blacklisted = await redis.get('bl:' + decoded.jti);

        if (blacklisted) {
          loggerInstance.warn('JWT_BLACKLISTED', {
            event: 'auth.token_blacklisted',
            userId: decoded.id,
            ip: req.ip,
          });

          return res.status(401).json({
            success: false,
            message: 'Sesión cerrada. Inicia sesión nuevamente.',
            expired: true,
          });
        }
      }

      // ── 3. Cargar usuario ─────────────────────────────────────────────
      const usuario = await Usuario.getById(decoded.id);

      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      if (!usuario.activo) {
        loggerInstance.warn('ACCESS_INACTIVE_USER', {
          event: 'auth.inactive_user',
          userId: decoded.id,
          ip: req.ip,
        });

        return res.status(401).json({
          success: false,
          message: 'Usuario desactivado',
        });
      }

      // ── 4. Query directa a BD: token_id + empresa_id ──────────────────
      const [userRows] = await db.query(
        'SELECT token_id, empresa_id FROM usuarios WHERE id = ? LIMIT 1',
        [decoded.id]
      );

      const dbTokenId = userRows[0]?.token_id ?? null;
      const dbEmpresaId = userRows[0]?.empresa_id ?? null;

      // ── 4a. Validar jti ───────────────────────────────────────────────
      if (decoded.jti) {
        if (!dbTokenId) {
          loggerInstance.warn('JWT_TOKEN_ID_NULL', {
            event: 'auth.token_id_null',
            userId: decoded.id,
            ip: req.ip,
          });

          return res.status(401).json({
            success: false,
            message: 'Sesión cerrada. Inicia sesión nuevamente.',
            expired: true,
          });
        }

        if (!timingSafeEqualFn(decoded.jti, dbTokenId)) {
          loggerInstance.warn('JWT_REVOKED', {
            event: 'auth.token_revoked',
            userId: decoded.id,
            ip: req.ip,
          });

          return res.status(401).json({
            success: false,
            message: 'Token revocado. Inicia sesión nuevamente.',
            expired: true,
          });
        }
      }

      // ── 4b. Validar empresa_id ───────────────────────────────────────
      if (!dbEmpresaId) {
        loggerInstance.warn('EMPRESA_ID_NULL', {
          event: 'auth.empresa_id_null',
          userId: decoded.id,
          ip: req.ip,
          note: 'Ejecutar migración Sprint 19: 02_agregar_empresa_id_safe.sql',
        });

        return res.status(401).json({
          success: false,
          message: 'Usuario sin empresa asignada. Contacta al administrador.',
        });
      }

      // ── 5. Poblar req.user ────────────────────────────────────────────
      req.user = {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresa_id: dbEmpresaId,
        jti: decoded.jti || null,
      };

      next();
    } catch (error) {
      loggerInstance.error('AUTH_MIDDLEWARE_ERROR', {
        event: 'auth.middleware_error',
        message: error.message,
        ip: req.ip,
        path: req.path,
      });

      return res.status(500).json({
        success: false,
        message: 'Error en la autenticación',
      });
    }
  };
}

/**
 * Crea el middleware de autorización por roles.
 */
function createAuthorize({
  loggerInstance = logger,
}) {
  return (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!roles.includes(req.user.rol)) {
        loggerInstance.accessDenied(
          req.user.rol,
          req.path,
          req.ip
        );

        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso',
        });
      }

      next();
    };
  };
}

// -------------------------------------------------------------------------
// Dependencias reales cargadas de forma diferida.
// Esto evita inicializar MySQL/Redis al importar el módulo en pruebas.
// -------------------------------------------------------------------------

let runtimeProtect;

function getRuntimeProtect() {
  if (!runtimeProtect) {
    const Usuario = require('../../modules/usuario/usuario.repository');
    const db = require('../../../config/database');
    const redis = require('../../../config/redis');

    runtimeProtect = createProtect({
      Usuario,
      db,
      redis,
      jwtLib: jwt,
      timingSafeEqualFn: timingSafeEqual,
      loggerInstance: logger,
    });
  }

  return runtimeProtect;
}

exports.createProtect = createProtect;

exports.protect = (req, res, next) => {
  return getRuntimeProtect()(req, res, next);
};

exports.createAuthorize = createAuthorize;

exports.authorize = (...roles) => {
  return createAuthorize({
    loggerInstance: logger,
  })(...roles);
};