// backend/controllers/authController/password.js
// Sprint 12 Fix — condición invertida en resetPassword corregida
// Sprint 15     — addToBlacklist Redis + MySQL

'use strict';

const Usuario = require('../../models/Usuario');
const db      = require('../../config/database');
const crypto  = require('crypto');
const logger  = require('../../utils/logger');
const { timingSafeEqual } = require('../../middleware/security');
const { registrarAuditoria } = require('../../middleware/auditLog');
const { COOKIE_CLEAR_OPTIONS, getIp, addToBlacklist } = require('./helpers');

// ═══════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// ═══════════════════════════════════════════════════════
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email requerido' });

    const usuario = await Usuario.getByEmail(email);

    if (!usuario)
      return res.json({ success: true, message: 'Si el correo existe, recibirás un código de recuperación' });

    const code      = Math.floor(100000 + Math.random() * 900000).toString();
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (parseInt(process.env.RESET_CODE_EXPIRATION) || 5) * 60000);

    await db.query(
      'INSERT INTO password_resets (user_id, code, token, expires_at) VALUES (?, ?, ?, ?)',
      [usuario.id, code, token, expiresAt]
    );

    try {
      const emailService = require('../../services/emailService');
      await emailService.sendResetCode(email, code, usuario.nombre);
      logger.info('RESET_CODE_SENT', { event: 'auth.reset_code_sent', userId: usuario.id, ip: getIp(req) });
    } catch (emailError) {
      logger.error('RESET_CODE_EMAIL_FAIL', {
        event: 'auth.reset_email_fail', userId: usuario.id, message: emailError.message,
      });
      if (process.env.NODE_ENV !== 'production') logger.debug('RESET_CODE_DEV_FALLBACK', { code });
    }

    return res.json({ success: true, message: 'Si el correo existe, recibirás un código de recuperación', token });
  } catch (error) {
    logger.error('FORGOT_PASSWORD_ERROR', { event: 'auth.forgot_error', message: error.message });
    return res.status(500).json({ success: false, message: 'Error al procesar solicitud' });
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/auth/verify-code
// ═══════════════════════════════════════════════════════
exports.verifyResetCode = async (req, res) => {
  try {
    const { token, code } = req.body;
    if (!token || !code)
      return res.status(400).json({ success: false, message: 'Token y código requeridos' });

    const [rows] = await db.query(
      `SELECT pr.*, u.email, u.nombre FROM password_resets pr
       JOIN usuarios u ON pr.user_id = u.id
       WHERE pr.token = ? AND pr.expires_at > NOW() AND pr.used = FALSE`,
      [token]
    );

    const codeMatch = rows.length > 0 && timingSafeEqual(rows[0].code, code.toString());
    if (!rows.length || !codeMatch)
      return res.status(400).json({ success: false, message: 'Código inválido o expirado' });

    return res.json({ success: true, message: 'Código verificado correctamente' });
  } catch (error) {
    logger.error('VERIFY_CODE_ERROR', { event: 'auth.verify_code_error', message: error.message });
    return res.status(500).json({ success: false, message: 'Error al verificar código' });
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/auth/reset-password
// ═══════════════════════════════════════════════════════
exports.resetPassword = async (req, res) => {
  try {
    const { token, code, newPassword } = req.body;

    if (!token || !code || !newPassword)
      return res.status(400).json({ success: false, message: 'Datos incompletos' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });

    const [rows] = await db.query(
      `SELECT pr.*, u.id as user_id, u.token_id FROM password_resets pr
       JOIN usuarios u ON pr.user_id = u.id
       WHERE pr.token = ? AND pr.expires_at > NOW() AND pr.used = FALSE`,
      [token]
    );

    const codeMatch = rows.length > 0 && timingSafeEqual(rows[0].code, code.toString());
    if (!rows.length || !codeMatch)
      return res.status(400).json({ success: false, message: 'Código inválido o expirado' });

    const reset = rows[0];

    if (reset.token_id) await addToBlacklist(reset.token_id);

    await Usuario.updatePassword(reset.user_id, newPassword);
    await db.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [reset.id]);
    await db.query('DELETE FROM usuarios_sesiones WHERE usuario_id = ?', [reset.user_id]);
    await db.query('UPDATE usuarios SET token_id = NULL, last_activity = NOW() WHERE id = ?', [reset.user_id]);

    res.clearCookie('refreshToken', COOKIE_CLEAR_OPTIONS);
    await registrarAuditoria(req, 'CAMBIO_PASSWORD', 'usuarios', reset.user_id, { motivo: 'reset_via_codigo' });

    logger.info('PASSWORD_RESET_SUCCESS', { event: 'auth.password_reset', userId: reset.user_id, ip: getIp(req) });
    return res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    logger.error('RESET_PASSWORD_ERROR', { event: 'auth.reset_error', message: error.message });
    return res.status(500).json({ success: false, message: 'Error al restablecer contraseña' });
  }
};