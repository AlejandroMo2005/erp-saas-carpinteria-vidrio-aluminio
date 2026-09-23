// src/modules/auth/handlers/session.js
// Sprint 12.5 — refresh y logout usan httpOnly cookie
// Sprint 15   — addToBlacklist Redis + MySQL
// Sprint 19   — empresa_id en el nuevo access token al rotar
// 📦 Sprint 20 — Migrado a src/modules/auth/handlers/
//                helpers  → ../auth.service
//                auditLog → ../../../shared/middleware/auditLog

'use strict';

const db     = require('../../../../config/database');
const crypto = require('crypto');
const logger = require('../../../../utils/logger');
const { registrarAuditoria } = require('../../../shared/middleware/auditLog');
const {
  COOKIE_OPTIONS,
  COOKIE_CLEAR_OPTIONS,
  generateAccessToken,
  generateRefreshToken,
  getIp,
  crearSesion,
  addToBlacklist,
} = require('../auth.service');

// ═══════════════════════════════════════════════════════
// POST /api/auth/refresh
// ═══════════════════════════════════════════════════════
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ success: false, message: 'Refresh token requerido', expired: true });

    const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const [rows] = await db.query(
      `SELECT s.*, u.rol, u.activo, u.token_id, u.empresa_id
       FROM   usuarios_sesiones s
       JOIN   usuarios u ON s.usuario_id = u.id
       WHERE  s.token_hash = ? AND s.expires_at > NOW()`,
      [incomingHash]
    );

    if (!rows.length) {
      logger.warn('REFRESH_TOKEN_INVALID', { event: 'auth.refresh_invalid', ip: getIp(req) });
      return res.status(401).json({ success: false, message: 'Refresh token inválido o expirado', expired: true });
    }

    const sesion  = rows[0];
    const usuario = {
      id:         sesion.usuario_id,
      rol:        sesion.rol,
      activo:     sesion.activo,
      empresa_id: sesion.empresa_id,
    };

    if (sesion.token_id) await addToBlacklist(sesion.token_id);

    if (!usuario.activo) {
      await db.query('DELETE FROM usuarios_sesiones WHERE usuario_id = ?', [usuario.id]);
      res.clearCookie('refreshToken', COOKIE_CLEAR_OPTIONS);
      return res.status(401).json({ success: false, message: 'Usuario desactivado' });
    }

    await db.query('DELETE FROM usuarios_sesiones WHERE id = ?', [sesion.id]);

    // Sprint 19: empresa_id incluido en el nuevo access token
    const { token: newAccessToken, jti }                 = generateAccessToken(usuario.id, usuario.rol, usuario.empresa_id);
    const { token: newRefreshToken, tokenHash: newHash } = generateRefreshToken();

    await crearSesion(usuario.id, newHash, req);
    await db.query(
      'UPDATE usuarios SET token_id = ?, last_activity = NOW() WHERE id = ?',
      [jti, usuario.id]
    );
    await db.query(
      'UPDATE usuarios_sesiones SET last_used_at = NOW() WHERE usuario_id = ? AND token_hash = ?',
      [usuario.id, newHash]
    );

    await registrarAuditoria(req, 'REFRESH_TOKEN', 'usuarios_sesiones', usuario.id, {});
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return res.json({
      success:    true,
      accessToken: newAccessToken,
      expiresIn:  process.env.JWT_EXPIRE || '15m',
    });
  } catch (error) {
    logger.error('REFRESH_ERROR', { event: 'auth.refresh_error', message: error.message });
    return res.status(500).json({ success: false, message: 'Error al renovar sesión' });
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/auth/logout
// ═══════════════════════════════════════════════════════
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    let usuarioId = req.user?.id;

    if (refreshToken) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const [sessionRows] = await db.query(
        `SELECT s.usuario_id, u.token_id FROM usuarios_sesiones s
         JOIN usuarios u ON s.usuario_id = u.id WHERE s.token_hash = ?`,
        [hash]
      );
      if (sessionRows.length > 0) {
        usuarioId = sessionRows[0].usuario_id;
        await addToBlacklist(sessionRows[0].token_id);
        await db.query('DELETE FROM usuarios_sesiones WHERE token_hash = ?', [hash]);
        await db.query('UPDATE usuarios SET token_id = NULL WHERE id = ?', [usuarioId]);
      } else {
        await db.query('DELETE FROM usuarios_sesiones WHERE token_hash = ?', [hash]);
      }
    } else if (usuarioId) {
      const [userRows] = await db.query('SELECT token_id FROM usuarios WHERE id = ?', [usuarioId]);
      if (userRows.length > 0 && userRows[0].token_id) await addToBlacklist(userRows[0].token_id);
      await db.query('DELETE FROM usuarios_sesiones WHERE usuario_id = ?', [usuarioId]);
      await db.query('UPDATE usuarios SET token_id = NULL WHERE id = ?', [usuarioId]);
    }

    if (usuarioId) {
      await registrarAuditoria(req, 'LOGOUT', 'usuarios', usuarioId, {});
      logger.info('LOGOUT', { event: 'auth.logout', userId: usuarioId, ip: getIp(req) });
    }

    res.clearCookie('refreshToken', COOKIE_CLEAR_OPTIONS);
    return res.json({ success: true, message: 'Sesión cerrada correctamente' });
  } catch (error) {
    logger.error('LOGOUT_ERROR', { event: 'auth.logout_error', message: error.message });
    return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
  }
};