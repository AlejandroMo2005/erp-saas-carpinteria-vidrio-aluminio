// src/modules/auth/handlers/login.js
// Sprint 12.5 — refreshToken como cookie httpOnly
// Sprint 19   — empresa_id incluido en generateAccessToken
// 📦 Sprint 20 — Migrado a src/modules/auth/handlers/
//                helpers  → ../auth.service
//                models   → ../../../../models/Usuario  (hasta migrar módulo usuario)
//                auditLog → ../../../shared/middleware/auditLog

'use strict';

// Módulo usuario migrado en Sprint 20
const Usuario = require('../../usuario/usuario.repository');
const db      = require('../../../config/database.js');
const logger  = require('../../../shared/utils/logger');
const { registrarAuditoria } = require('../../../shared/middleware/auditLog');
const {
  COOKIE_OPTIONS,
  generateAccessToken,
  generateRefreshToken,
  getIp,
  crearSesion,
} = require('../auth.service');

// ═══════════════════════════════════════════════════════
// POST /api/auth/login
// ═══════════════════════════════════════════════════════
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });

    const usuario = await Usuario.getByEmail(email);

    if (!usuario) {
      logger.loginFail(email, getIp(req), 'usuario_no_encontrado');
      await registrarAuditoria(req, 'LOGIN_FALLIDO', 'usuarios', null, { email, motivo: 'usuario_no_encontrado' });
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      logger.loginFail(email, getIp(req), 'usuario_desactivado');
      await registrarAuditoria(req, 'LOGIN_FALLIDO', 'usuarios', usuario.id, { email, motivo: 'usuario_desactivado' });
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const isValidPassword = await Usuario.validatePassword(password, usuario.password);

    if (!isValidPassword) {
      logger.loginFail(email, getIp(req), 'password_incorrecto');
      await registrarAuditoria(req, 'LOGIN_FALLIDO', 'usuarios', usuario.id, { email, motivo: 'password_incorrecto' });
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Sprint 19: leer empresa_id directo de BD (igual que auth.js)
    const [userRows] = await db.query(
      'SELECT empresa_id FROM usuarios WHERE id = ? LIMIT 1', [usuario.id]
    );
    const empresaId = userRows[0]?.empresa_id ?? null;

    // Sprint 19: empresa_id en el token
    const { token: accessToken, jti }        = generateAccessToken(usuario.id, usuario.rol, empresaId);
    const { token: refreshToken, tokenHash } = generateRefreshToken();

    await crearSesion(usuario.id, tokenHash, req);
    await db.query(
      'UPDATE usuarios SET token_id = ?, last_activity = NOW() WHERE id = ?',
      [jti, usuario.id]
    );
    await registrarAuditoria(req, 'LOGIN', 'usuarios', usuario.id, { email });

    logger.info('LOGIN_SUCCESS', {
      event: 'auth.login', userId: usuario.id, rol: usuario.rol,
      empresaId, ip: getIp(req),
    });

    delete usuario.password;
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Login exitoso',
      data: { user: usuario, accessToken, expiresIn: process.env.JWT_EXPIRE || '15m' },
    });
  } catch (error) {
    logger.error('LOGIN_ERROR', { event: 'auth.login_error', message: error.message, ip: getIp(req) });
    return res.status(500).json({ success: false, message: 'Error en el login' });
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/auth/register
// Sprint 19: nuevo CLIENTE hereda empresa_id=1 por defecto
// (registro público siempre crea usuario en la empresa base)
// ═══════════════════════════════════════════════════════
exports.register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password)
      return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son obligatorios' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });

    const usuarioExistente = await Usuario.getByEmail(email);
    if (usuarioExistente)
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });

    // Sprint 19: empresa_id=1 para registro público
    const usuarioId = await Usuario.create({ nombre, email, password, rol: 'CLIENTE', activo: 1, empresa_id: 1 });
    const usuario   = await Usuario.getById(usuarioId);

    const { token: accessToken, jti }        = generateAccessToken(usuario.id, usuario.rol, 1);
    const { token: refreshToken, tokenHash } = generateRefreshToken();

    await crearSesion(usuario.id, tokenHash, req);
    await db.query(
      'UPDATE usuarios SET token_id = ?, last_activity = NOW() WHERE id = ?',
      [jti, usuario.id]
    );

    logger.info('REGISTER_SUCCESS', { event: 'auth.register', userId: usuarioId, ip: getIp(req) });
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: { user: usuario, accessToken, expiresIn: process.env.JWT_EXPIRE || '15m' },
    });
  } catch (error) {
    logger.error('REGISTER_ERROR', { event: 'auth.register_error', message: error.message });
    return res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
};