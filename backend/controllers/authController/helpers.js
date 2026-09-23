// backend/controllers/authController/helpers.js
// Sprint 12   — blacklist Redis + MySQL, cookie options, crearSesion
// Sprint 15   — addToBlacklist escribe Redis (primario) + MySQL (auditoría)
// Sprint 19   — empresa_id incluido en el access token

'use strict';

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const db     = require('../../config/database');
const redis  = require('../../config/redis');
const logger = require('../../utils/logger');

const IS_PROD = process.env.NODE_ENV === 'production';

// ── Cookie options ─────────────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

const COOKIE_CLEAR_OPTIONS = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: 'strict',
};

// ── Tokens ─────────────────────────────────────────────────────────────────
// Sprint 19: empresa_id en el payload del JWT
const generateAccessToken = (userId, rol, empresaId) => {
  const jti   = crypto.randomUUID();
  const token = jwt.sign(
    { id: userId, rol, empresa_id: empresaId, jti },
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

// ── Helpers de request ─────────────────────────────────────────────────────
const getIp = (req) =>
  req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

// ── Sesiones ───────────────────────────────────────────────────────────────
const crearSesion = async (usuarioId, tokenHash, req, expireDays = 7) => {
  const expiresAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);
  await db.query(
    `INSERT INTO usuarios_sesiones (usuario_id, token_hash, ip, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      usuarioId, tokenHash, getIp(req),
      req.headers['user-agent']?.slice(0, 255) || null,
      expiresAt,
    ]
  );
};

// ── Blacklist ──────────────────────────────────────────────────────────────
// Redis: capa rápida O(1) con TTL automático
// MySQL: respaldo y auditoría
const addToBlacklist = async (jti) => {
  if (!jti) return;
  try {
    const ttlSeconds = parseInt(process.env.JWT_EXPIRE_MINUTES || '15') * 60;
    await redis.set('bl:' + jti, '1', 'EX', ttlSeconds);
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

const cleanupBlacklist = async () => {
  try {
    const [result] = await db.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
    if (result.affectedRows > 0)
      logger.info('BLACKLIST_CLEANUP', { event: 'auth.blacklist_cleanup', deleted: result.affectedRows });
  } catch (err) {
    logger.warn('BLACKLIST_CLEANUP_FAIL', { event: 'auth.blacklist_cleanup_fail', message: err.message });
  }
};
setInterval(cleanupBlacklist, 60 * 60 * 1000);

const actualizarActividad = (usuarioId) => {
  db.query('UPDATE usuarios SET last_activity = NOW() WHERE id = ?', [usuarioId])
    .catch(err => logger.warn('ACTIVITY_UPDATE_FAIL', {
      event: 'auth.activity_update_fail', userId: usuarioId, message: err.message,
    }));
};

module.exports = {
  COOKIE_OPTIONS, COOKIE_CLEAR_OPTIONS,
  generateAccessToken, generateRefreshToken,
  getIp, crearSesion,
  addToBlacklist, cleanupBlacklist, actualizarActividad,
};