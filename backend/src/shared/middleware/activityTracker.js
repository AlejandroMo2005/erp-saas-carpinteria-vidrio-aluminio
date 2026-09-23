// src/shared/services/activityTracker.js → src/shared/middleware/activityTracker.js
// 📦 Sprint 20 — Movido de middleware/activityTracker.js
'use strict';

const db     = require('../../../config/database');
const logger = require('../../../utils/logger');

const INACTIVIDAD_MINUTOS    = parseInt(process.env.SESSION_INACTIVITY_MINUTES || '15');
const MAX_INACTIVIDAD_MS     = INACTIVIDAD_MINUTOS * 60 * 1000;
const MIN_UPDATE_INTERVAL_MS = 60 * 1000;
const activityCache          = new Map();

const blacklistJti = async (jti) => {
  if (!jti) return;
  try {
    const expireMinutes = parseInt(process.env.JWT_EXPIRE_MINUTES || '15');
    const expiresAt     = new Date(Date.now() + expireMinutes * 60 * 1000);
    await db.query('INSERT IGNORE INTO token_blacklist (jti, expires_at) VALUES (?, ?)', [jti, expiresAt]);
  } catch (err) {
    logger.warn('BLACKLIST_INSERT_FAIL', { event: 'activity.blacklist_insert_fail', jti, message: err.message });
  }
};

const trackActivity = async (req, res, next) => {
  if (!req.user?.id) return next();
  const userId = req.user.id;
  const ahora  = Date.now();
  try {
    const ultimoUpdate = activityCache.get(userId) || 0;
    if (ahora - ultimoUpdate >= MIN_UPDATE_INTERVAL_MS) {
      await db.query('UPDATE usuarios SET last_activity = NOW() WHERE id = ?', [userId]);
      activityCache.set(userId, ahora);
    }
  } catch (err) {
    logger.warn('TRACK_ACTIVITY_FAIL', { event: 'activity.track_fail', userId, message: err.message });
  }
  next();
};

const inactivityGuard = async (req, res, next) => {
  if (!req.user?.id) return next();
  try {
    const [rows] = await db.query('SELECT last_activity FROM usuarios WHERE id = ? LIMIT 1', [req.user.id]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'Sesión inválida.', expired: true });
    const lastActivity = rows[0].last_activity;
    if (!lastActivity) return next();
    const tiempoInactivo = Date.now() - new Date(lastActivity).getTime();
    if (tiempoInactivo > MAX_INACTIVIDAD_MS) {
      await blacklistJti(req.user.jti);
      await db.query('DELETE FROM usuarios_sesiones WHERE usuario_id = ?', [req.user.id]);
      await db.query('UPDATE usuarios SET token_id = NULL WHERE id = ?', [req.user.id]);
      activityCache.delete(req.user.id);
      logger.warn('SESSION_EXPIRED_INACTIVITY', { event: 'activity.session_expired', userId: req.user.id, ip: req.ip, inactivoMinutos: Math.round(tiempoInactivo / 60000), limiteMinutos: INACTIVIDAD_MINUTOS });
      return res.status(401).json({ success: false, message: `Sesión expirada por inactividad (${INACTIVIDAD_MINUTOS} min). Inicia sesión nuevamente.`, expired: true });
    }
    next();
  } catch (err) {
    logger.error('INACTIVITY_GUARD_ERROR', { event: 'activity.guard_error', message: err.message, userId: req.user?.id });
    next();
  }
};

const clearActivityCache = (userId) => activityCache.delete(userId);

module.exports = { trackActivity, inactivityGuard, clearActivityCache };