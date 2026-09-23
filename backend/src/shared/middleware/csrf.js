// src/shared/middleware/csrf.js
// 📦 Sprint 20 — Movido de middleware/csrf.js
'use strict';

const crypto = require('crypto');
const logger = require('../../../utils/logger');

const IS_PROD           = process.env.NODE_ENV === 'production';
const CSRF_TOKEN_TTL_MS = 4 * 60 * 60 * 1000;
const METODOS_MUTANTES  = new Set(['POST','PUT','PATCH','DELETE']);
const RUTAS_EXCLUIDAS   = new Set(['/auth/login','/auth/register','/auth/refresh','/csp-report']);

function generarCsrfToken() { return crypto.randomBytes(32).toString('hex'); }

function emitirCsrfCookie(req, res, next) {
  try {
    if (!req.cookies?.['csrf-token']) {
      const token = generarCsrfToken();
      res.cookie('csrf-token', token, { httpOnly: false, secure: IS_PROD, sameSite: 'strict', maxAge: CSRF_TOKEN_TTL_MS });
      req._csrfToken = token;
    } else { req._csrfToken = req.cookies['csrf-token']; }
  } catch (err) { logger.warn('CSRF_EMIT_FAIL', { event: 'csrf.emit_fail', message: err.message }); }
  next();
}

function verificarCsrf(req, res, next) {
  try {
    if (!METODOS_MUTANTES.has(req.method)) return next();
    if (RUTAS_EXCLUIDAS.has(req.path))     return next();
    const tokenCookie = req.cookies?.['csrf-token'] ?? req._csrfToken;
    const tokenHeader = req.headers['x-csrf-token'];
    if (!tokenCookie || !tokenHeader) {
      logger.warn('CSRF_MISSING_TOKEN', { event: 'csrf.missing_token', method: req.method, path: req.path, ip: req.ip, userId: req.user?.id ?? null });
      return res.status(403).json({ success: false, message: 'Token CSRF requerido.' });
    }
    let coinciden = false;
    try {
      const bufCookie = Buffer.from(tokenCookie,'utf8'), bufHeader = Buffer.from(tokenHeader,'utf8');
      coinciden = bufCookie.length === bufHeader.length && crypto.timingSafeEqual(bufCookie, bufHeader);
    } catch { coinciden = false; }
    if (!coinciden) {
      logger.warn('CSRF_TOKEN_MISMATCH', { event: 'csrf.token_mismatch', method: req.method, path: req.path, ip: req.ip, userId: req.user?.id ?? null });
      return res.status(403).json({ success: false, message: 'Token CSRF inválido.' });
    }
    return next();
  } catch (err) {
    logger.error('CSRF_VERIFY_FAIL', { event: 'csrf.verify_error', message: err.message });
    return next();
  }
}

module.exports = { emitirCsrfCookie, verificarCsrf };