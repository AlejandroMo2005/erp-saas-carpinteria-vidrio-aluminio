// backend/controllers/authController.js
// ⭐ Sprint 10 — Security Hardening
// 🔧 Sprint 11 — Reemplazar console.* por logger Winston
// 🔒 Sprint 12 — addToBlacklist + cleanupBlacklist + logout fix
// 🐛 Sprint 12 Fix — resetPassword: condición invertida + variable inexistente
//                  — refresh: espacio en "u. token_id" en la query SQL
// 🍪 Sprint 12.5 — refreshToken migrado a httpOnly Cookie
// 🚀 Sprint 15 — DT-04: addToBlacklist escribe en Redis (capa rápida) + MySQL (auditoría)

const Usuario  = require('../models/Usuario');
const jwt      = require('jsonwebtoken');
const db       = require('../config/database');
const redis    = require('../config/redis');            // 🚀 Sprint 15 — DT-04
const crypto   = require('crypto');
const { timingSafeEqual, timingNormalize } = require('../middleware/security');
const { registrarAuditoria }              = require('../middleware/auditLog');
const logger                              = require('../utils/logger');

const IS_PROD = process.env.NODE_ENV === 'production';

// ═══════════════════════════════════════════════════════════════════════════
// 🍪 COOKIE OPTIONS — Sprint 12.5
// Centralizado para consistencia entre login, register, refresh y logout
//
// httpOnly:  true  → JS del cliente NO puede leer la cookie (protege XSS)
// secure:    PROD  → solo se envía por HTTPS en producción
// sameSite: 'strict' → no se envía en requests cross-site (protege CSRF)
// maxAge:    7 días en ms → coincide con la vida del refreshToken en DB
// ═══════════════════════════════════════════════════════════════════════════
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,   // 7 días en milisegundos
};

// Opciones para clearCookie — deben coincidir con las de Set-Cookie
// (excepto maxAge/expires que no aplican al borrar)
const COOKIE_CLEAR_OPTIONS = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: 'strict',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const generateAccessToken = (userId, rol) => {
  const jti   = crypto.randomUUID();
  const token = jwt.sign(
    { id: userId, rol, jti },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
  return { token, jti };
};

const generateRefreshToken = () => {
  const token     = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
};

const getIp = (req) =>
  req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

const crearSesion = async (usuarioId, tokenHash, req, expireDays = 7) => {
  const expiresAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);
  await db.query(
    `INSERT INTO usuarios_sesiones (usuario_id, token_hash, ip, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      usuarioId,
      tokenHash,
      getIp(req),
      req.headers['user-agent']?.slice(0, 255) || null,
      expiresAt,
    ]
  );
};

// ── Sprint 12 + Sprint 15 DT-04: addToBlacklist ──────────────────────────
// Redis: capa rápida — O(1), TTL automático, sin tocar MySQL en cada request
// MySQL: respaldo y auditoría — token_blacklist se mantiene para trazabilidad
const addToBlacklist = async (jti) => {
  if (!jti) return;
  try {
    const expireMinutes = parseInt(process.env.JWT_EXPIRE_MINUTES || '15');
    const ttlSeconds    = expireMinutes * 60;

    // 🚀 Sprint 15 — Redis: escritura primaria con TTL automático
    await redis.set('bl:' + jti, '1', 'EX', ttlSeconds);

    // MySQL: respaldo para auditoría (token_blacklist NO se elimina)
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await db.query(
      'INSERT IGNORE INTO token_blacklist (jti, expires_at) VALUES (?, ?)',
      [jti, expiresAt]
    );
  } catch (err) {
    logger.warn('BLACKLIST_INSERT_FAIL', {
      event: 'auth.blacklist_insert_fail', jti, message: err.message,
    });
  }
};

// ── Sprint 12: limpieza automática de MySQL cada hora ────────────────────
// Redis expira solo por TTL — cleanupBlacklist solo actúa sobre MySQL
const cleanupBlacklist = async () => {
  try {
    const [result] = await db.query(
      'DELETE FROM token_blacklist WHERE expires_at < NOW()'
    );
    if (result.affectedRows > 0) {
      logger.info('BLACKLIST_CLEANUP', {
        event: 'auth.blacklist_cleanup', deleted: result.affectedRows,
      });
    }
  } catch (err) {
    logger.warn('BLACKLIST_CLEANUP_FAIL', {
      event: 'auth.blacklist_cleanup_fail', message: err.message,
    });
  }
};
setInterval(cleanupBlacklist, 60 * 60 * 1000);

const actualizarActividad = (usuarioId) => {
  db.query('UPDATE usuarios SET last_activity = NOW() WHERE id = ?', [usuarioId])
    .catch(err => logger.warn('ACTIVITY_UPDATE_FAIL', {
      event:   'auth.activity_update_fail',
      userId:  usuarioId,
      message: err.message,
    }));
};

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN
// POST /api/auth/login
// 🍪 Sprint 12.5 — refreshToken va a httpOnly cookie, no al body
// ═══════════════════════════════════════════════════════════════════════════
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios'
      });
    }

    const usuario = await Usuario.getByEmail(email);

    if (!usuario) {
      logger.loginFail(email, getIp(req), 'usuario_no_encontrado');
      await registrarAuditoria(req, 'LOGIN_FALLIDO', 'usuarios', null, {
        email, motivo: 'usuario_no_encontrado'
      });
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      logger.loginFail(email, getIp(req), 'usuario_desactivado');
      await registrarAuditoria(req, 'LOGIN_FALLIDO', 'usuarios', usuario.id, {
        email, motivo: 'usuario_desactivado'
      });
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const isValidPassword = await Usuario.validatePassword(password, usuario.password);

    if (!isValidPassword) {
      logger.loginFail(email, getIp(req), 'password_incorrecto');
      await registrarAuditoria(req, 'LOGIN_FALLIDO', 'usuarios', usuario.id, {
        email, motivo: 'password_incorrecto'
      });
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const { token: accessToken, jti }        = generateAccessToken(usuario.id, usuario.rol);
    const { token: refreshToken, tokenHash } = generateRefreshToken();

    await crearSesion(usuario.id, tokenHash, req);
    await db.query(
      'UPDATE usuarios SET token_id = ?, last_activity = NOW() WHERE id = ?',
      [jti, usuario.id]
    );

    await registrarAuditoria(req, 'LOGIN', 'usuarios', usuario.id, { email });

    logger.info('LOGIN_SUCCESS', {
      event:  'auth.login',
      userId: usuario.id,
      rol:    usuario.rol,
      ip:     getIp(req),
    });

    delete usuario.password;

    // 🍪 Sprint 12.5 — refreshToken se envía como cookie httpOnly
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user:      usuario,
        accessToken,
        expiresIn: process.env.JWT_EXPIRE || '15m'
        // refreshToken eliminado del body — viaja solo como cookie httpOnly
      }
    });

  } catch (error) {
    logger.error('LOGIN_ERROR', {
      event: 'auth.login_error', message: error.message, ip: getIp(req),
    });
    return res.status(500).json({ success: false, message: 'Error en el login' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// REFRESH TOKEN — Rotation
// POST /api/auth/refresh
// 🍪 Sprint 12.5 — lee req.cookies.refreshToken (ya no req.body.refreshToken)
//                  devuelve nuevo token como cookie httpOnly (no en body)
// ═══════════════════════════════════════════════════════════════════════════
exports.refresh = async (req, res) => {
  try {
    // 🍪 Sprint 12.5 — leer desde cookie httpOnly en lugar del body
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token requerido', expired: true });
    }

    const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const [rows] = await db.query(
      `SELECT s.*, u.rol, u.activo, u.token_id
       FROM   usuarios_sesiones s
       JOIN   usuarios u ON s.usuario_id = u.id
       WHERE  s.token_hash = ? AND s.expires_at > NOW()`,
      [incomingHash]
    );

    if (rows.length === 0) {
      logger.warn('REFRESH_TOKEN_INVALID', {
        event: 'auth.refresh_invalid',
        ip:    getIp(req),
      });
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido o expirado',
        expired: true
      });
    }

    const sesion  = rows[0];
    const usuario = { id: sesion.usuario_id, rol: sesion.rol, activo: sesion.activo };

    // Blacklistear el access token anterior antes de rotar
    // 🚀 Sprint 15 — addToBlacklist escribe en Redis + MySQL
    if (sesion.token_id) {
      await addToBlacklist(sesion.token_id);
    }

    if (!usuario.activo) {
      await db.query('DELETE FROM usuarios_sesiones WHERE usuario_id = ?', [usuario.id]);
      // 🍪 Limpiar cookie si el usuario fue desactivado
      res.clearCookie('refreshToken', COOKIE_CLEAR_OPTIONS);
      return res.status(401).json({ success: false, message: 'Usuario desactivado' });
    }

    // ROTATION: eliminar sesión anterior, crear nueva
    await db.query('DELETE FROM usuarios_sesiones WHERE id = ?', [sesion.id]);

    const { token: newAccessToken, jti }                 = generateAccessToken(usuario.id, usuario.rol);
    const { token: newRefreshToken, tokenHash: newHash } = generateRefreshToken();

    await crearSesion(usuario.id, newHash, req);
    await db.query(
      'UPDATE usuarios SET token_id = ?, last_activity = NOW() WHERE id = ?',
      [jti, usuario.id]
    );
    await db.query(
      `UPDATE usuarios_sesiones SET last_used_at = NOW()
       WHERE usuario_id = ? AND token_hash = ?`,
      [usuario.id, newHash]
    );

    await registrarAuditoria(req, 'REFRESH_TOKEN', 'usuarios_sesiones', usuario.id, {});

    // 🍪 Sprint 12.5 — nuevo refreshToken rotado como cookie httpOnly
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return res.json({
      success:     true,
      accessToken: newAccessToken,
      expiresIn:   process.env.JWT_EXPIRE || '15m'
      // refreshToken eliminado del body — viaja solo como cookie httpOnly
    });

  } catch (error) {
    logger.error('REFRESH_ERROR', {
      event: 'auth.refresh_error', message: error.message,
    });
    return res.status(500).json({ success: false, message: 'Error al renovar sesión' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LOGOUT HARD
// POST /api/auth/logout
// 🍪 Sprint 12.5 — lee req.cookies.refreshToken (ya no req.body.refreshToken)
//                  llama res.clearCookie('refreshToken') al finalizar
// ═══════════════════════════════════════════════════════════════════════════
exports.logout = async (req, res) => {
  try {
    // 🍪 Sprint 12.5 — leer desde cookie httpOnly en lugar del body
    const refreshToken = req.cookies?.refreshToken;
    let usuarioId = req.user?.id;

    if (refreshToken) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const [sessionRows] = await db.query(
        `SELECT s.usuario_id, u.token_id
         FROM   usuarios_sesiones s
         JOIN   usuarios u ON s.usuario_id = u.id
         WHERE  s.token_hash = ?`,
        [hash]
      );

      if (sessionRows.length > 0) {
        usuarioId = sessionRows[0].usuario_id;
        // 🚀 Sprint 15 — addToBlacklist escribe en Redis + MySQL
        await addToBlacklist(sessionRows[0].token_id);
        await db.query('DELETE FROM usuarios_sesiones WHERE token_hash = ?', [hash]);
        await db.query('UPDATE usuarios SET token_id = NULL WHERE id = ?', [usuarioId]);
      } else {
        await db.query('DELETE FROM usuarios_sesiones WHERE token_hash = ?', [hash]);
      }

    } else if (usuarioId) {
      const [userRows] = await db.query(
        'SELECT token_id FROM usuarios WHERE id = ?', [usuarioId]
      );
      if (userRows.length > 0 && userRows[0].token_id) {
        // 🚀 Sprint 15 — addToBlacklist escribe en Redis + MySQL
        await addToBlacklist(userRows[0].token_id);
      }
      await db.query('DELETE FROM usuarios_sesiones WHERE usuario_id = ?', [usuarioId]);
      await db.query('UPDATE usuarios SET token_id = NULL WHERE id = ?', [usuarioId]);
    }

    if (usuarioId) {
      await registrarAuditoria(req, 'LOGOUT', 'usuarios', usuarioId, {});
      logger.info('LOGOUT', {
        event: 'auth.logout', userId: usuarioId, ip: getIp(req),
      });
    }

    // 🍪 Sprint 12.5 — eliminar la cookie httpOnly del navegador
    res.clearCookie('refreshToken', COOKIE_CLEAR_OPTIONS);

    return res.json({ success: true, message: 'Sesión cerrada correctamente' });

  } catch (error) {
    logger.error('LOGOUT_ERROR', {
      event: 'auth.logout_error', message: error.message,
    });
    return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// REGISTER
// POST /api/auth/register
// 🍪 Sprint 12.5 — refreshToken va a httpOnly cookie, no al body
// ═══════════════════════════════════════════════════════════════════════════
exports.register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son obligatorios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const usuarioExistente = await Usuario.getByEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    const usuarioId = await Usuario.create({ nombre, email, password, rol: 'CLIENTE', activo: 1 });
    const usuario   = await Usuario.getById(usuarioId);

    const { token: accessToken, jti }        = generateAccessToken(usuario.id, usuario.rol);
    const { token: refreshToken, tokenHash } = generateRefreshToken();

    await crearSesion(usuario.id, tokenHash, req);
    await db.query(
      'UPDATE usuarios SET token_id = ?, last_activity = NOW() WHERE id = ?',
      [jti, usuario.id]
    );

    logger.info('REGISTER_SUCCESS', {
      event: 'auth.register', userId: usuarioId, ip: getIp(req),
    });

    // 🍪 Sprint 12.5 — refreshToken se envía como cookie httpOnly
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: usuario,
        accessToken,
        expiresIn: process.env.JWT_EXPIRE || '15m'
        // refreshToken eliminado del body — viaja solo como cookie httpOnly
      }
    });

  } catch (error) {
    logger.error('REGISTER_ERROR', {
      event: 'auth.register_error', message: error.message,
    });
    return res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE
// GET /api/auth/profile
// ═══════════════════════════════════════════════════════════════════════════
exports.getProfile = async (req, res) => {
  try {
    const usuario = await Usuario.getById(req.user.id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    actualizarActividad(req.user.id);
    return res.json({ success: true, data: usuario });
  } catch (error) {
    logger.error('PROFILE_ERROR', {
      event: 'auth.profile_error', message: error.message, userId: req.user?.id,
    });
    return res.status(500).json({ success: false, message: 'Error al obtener perfil' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ═══════════════════════════════════════════════════════════════════════════
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requerido' });
    }

    const usuario = await Usuario.getByEmail(email);

    if (!usuario) {
      return res.json({
        success: true,
        message: 'Si el correo existe, recibirás un código de recuperación'
      });
    }

    const code  = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');
    const expirationMinutes = parseInt(process.env.RESET_CODE_EXPIRATION) || 5;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60000);

    await db.query(
      `INSERT INTO password_resets (user_id, code, token, expires_at) VALUES (?, ?, ?, ?)`,
      [usuario.id, code, token, expiresAt]
    );

    try {
      const emailService = require('../services/emailService');
      await emailService.sendResetCode(email, code, usuario.nombre);
      logger.info('RESET_CODE_SENT', {
        event: 'auth.reset_code_sent', userId: usuario.id, ip: getIp(req),
      });
    } catch (emailError) {
      logger.error('RESET_CODE_EMAIL_FAIL', {
        event: 'auth.reset_email_fail', userId: usuario.id, message: emailError.message,
      });
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('RESET_CODE_DEV_FALLBACK', { code });
      }
    }

    return res.json({
      success: true,
      message: 'Si el correo existe, recibirás un código de recuperación',
      token
    });

  } catch (error) {
    logger.error('FORGOT_PASSWORD_ERROR', {
      event: 'auth.forgot_error', message: error.message,
    });
    return res.status(500).json({ success: false, message: 'Error al procesar solicitud' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// VERIFY RESET CODE
// POST /api/auth/verify-code
// ═══════════════════════════════════════════════════════════════════════════
exports.verifyResetCode = async (req, res) => {
  try {
    const { token, code } = req.body;

    if (!token || !code) {
      return res.status(400).json({ success: false, message: 'Token y código requeridos' });
    }

    const [rows] = await db.query(
      `SELECT pr.*, u.email, u.nombre
       FROM   password_resets pr
       JOIN   usuarios u ON pr.user_id = u.id
       WHERE  pr.token = ? AND pr.expires_at > NOW() AND pr.used = FALSE`,
      [token]
    );

    const codeMatch = rows.length > 0 && timingSafeEqual(rows[0].code, code.toString());

    if (rows.length === 0 || !codeMatch) {
      return res.status(400).json({ success: false, message: 'Código inválido o expirado' });
    }

    return res.json({ success: true, message: 'Código verificado correctamente' });

  } catch (error) {
    logger.error('VERIFY_CODE_ERROR', {
      event: 'auth.verify_code_error', message: error.message,
    });
    return res.status(500).json({ success: false, message: 'Error al verificar código' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// POST /api/auth/reset-password
// ═══════════════════════════════════════════════════════════════════════════
exports.resetPassword = async (req, res) => {
  try {
    const { token, code, newPassword } = req.body;

    if (!token || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const [rows] = await db.query(
      `SELECT pr.*, u.id as user_id, u.token_id
       FROM   password_resets pr
       JOIN   usuarios u ON pr.user_id = u.id
       WHERE  pr.token = ? AND pr.expires_at > NOW() AND pr.used = FALSE`,
      [token]
    );

    const codeMatch = rows.length > 0 && timingSafeEqual(rows[0].code, code.toString());

    if (rows.length === 0 || !codeMatch) {
      return res.status(400).json({ success: false, message: 'Código inválido o expirado' });
    }

    const reset = rows[0];

    // FIX BUG A (Sprint 12):
    //   ANTES: if (!reset.token_id) { await addToBlacklist(sesion.token_id) }
    //   AHORA: if (reset.token_id)  { await addToBlacklist(reset.token_id) }
    // 🚀 Sprint 15 — addToBlacklist escribe en Redis + MySQL
    if (reset.token_id) {
      await addToBlacklist(reset.token_id);
    }

    await Usuario.updatePassword(reset.user_id, newPassword);
    await db.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [reset.id]);

    await db.query('DELETE FROM usuarios_sesiones WHERE usuario_id = ?', [reset.user_id]);
    await db.query(
      'UPDATE usuarios SET token_id = NULL, last_activity = NOW() WHERE id = ?',
      [reset.user_id]
    );

    // 🍪 Sprint 12.5 — limpiar cookie de refresh al resetear contraseña
    res.clearCookie('refreshToken', COOKIE_CLEAR_OPTIONS);

    await registrarAuditoria(req, 'CAMBIO_PASSWORD', 'usuarios', reset.user_id, {
      motivo: 'reset_via_codigo'
    });

    logger.info('PASSWORD_RESET_SUCCESS', {
      event: 'auth.password_reset', userId: reset.user_id, ip: getIp(req),
    });

    return res.json({ success: true, message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    logger.error('RESET_PASSWORD_ERROR', {
      event: 'auth.reset_error', message: error.message,
    });
    return res.status(500).json({ success: false, message: 'Error al restablecer contraseña' });
  }
};