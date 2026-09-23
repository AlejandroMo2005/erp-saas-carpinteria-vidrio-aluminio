// backend/middleware/csrf.js
// Sprint 17 — Protección CSRF formal (doble cookie)
// 🐛 Fix: rutas excluidas relativas al mount point /api, no absolutas

'use strict';

const crypto = require('crypto');
const logger = require('../utils/logger');

const IS_PROD = process.env.NODE_ENV === 'production';

const CSRF_TOKEN_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

const METODOS_MUTANTES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// ⚠️ Rutas RELATIVAS al mount point /api
// verificarCsrf se registra como app.use('/api', verificarCsrf)
// → req.path llega SIN el prefijo /api
const RUTAS_EXCLUIDAS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/csp-report',
]);

function generarCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ── Emitir cookie csrf-token ─────────────────────────────────────────────
// app.use(emitirCsrfCookie) — antes de las rutas
function emitirCsrfCookie(req, res, next) {
  try {
    if (!req.cookies?.['csrf-token']) {
      const token = generarCsrfToken();
      res.cookie('csrf-token', token, {
        httpOnly: false,      // legible por JS para el double-submit
        secure:   IS_PROD,
        sameSite: 'strict',
        maxAge:   CSRF_TOKEN_TTL_MS,
      });
      req._csrfToken = token;
    } else {
      req._csrfToken = req.cookies['csrf-token'];
    }
  } catch (err) {
    logger.warn('CSRF_EMIT_FAIL', { event: 'csrf.emit_fail', message: err.message });
  }
  next();
}

// ── Verificar header en requests mutantes ────────────────────────────────
// app.use('/api', verificarCsrf) — req.path es relativo a /api
function verificarCsrf(req, res, next) {
  try {
    if (!METODOS_MUTANTES.has(req.method)) return next();
    if (RUTAS_EXCLUIDAS.has(req.path))     return next();

    const tokenCookie = req.cookies?.['csrf-token'] ?? req._csrfToken;
    const tokenHeader = req.headers['x-csrf-token'];

    if (!tokenCookie || !tokenHeader) {
      logger.warn('CSRF_MISSING_TOKEN', {
        event:  'csrf.missing_token',
        method: req.method,
        path:   req.path,
        ip:     req.ip,
        userId: req.user?.id ?? null,
      });
      return res.status(403).json({
        success: false,
        message: 'Token CSRF requerido.',
      });
    }

    let coinciden = false;
    try {
      const bufCookie = Buffer.from(tokenCookie, 'utf8');
      const bufHeader = Buffer.from(tokenHeader, 'utf8');
      coinciden =
        bufCookie.length === bufHeader.length &&
        crypto.timingSafeEqual(bufCookie, bufHeader);
    } catch {
      coinciden = false;
    }

    if (!coinciden) {
      logger.warn('CSRF_TOKEN_MISMATCH', {
        event:  'csrf.token_mismatch',
        method: req.method,
        path:   req.path,
        ip:     req.ip,
        userId: req.user?.id ?? null,
      });
      return res.status(403).json({
        success: false,
        message: 'Token CSRF inválido.',
      });
    }

    return next();
  } catch (err) {
    // Error inesperado — no bloquear el request
    logger.error('CSRF_VERIFY_FAIL', { event: 'csrf.verify_error', message: err.message });
    return next();
  }
}

module.exports = { emitirCsrfCookie, verificarCsrf };