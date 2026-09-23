// src/shared/middleware/security.js
// 📦 Sprint 20 — Movido de middleware/security.js
'use strict';

const rateLimit = require('express-rate-limit');
const crypto    = require('crypto');
const xss       = require('xss');
const logger    = require('../../../utils/logger');

const xssOptions = { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'], css: false };

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => {
    logger.security.loginBlocked(req.ip, req.path);
    res.status(429).json({ success: false, message: 'Demasiadas peticiones. Intenta nuevamente en 1 minuto.', retryAfter: 60 });
  }
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn('Rate limit AUTH', { ip: req.ip, timestamp: new Date().toISOString() });
    res.status(429).json({ success: false, message: 'Demasiados intentos de autenticación. Intenta nuevamente en 1 minuto.', retryAfter: 60 });
  }
});

function sanitizeValue(value) {
  if (typeof value === 'string') return xss(value, xssOptions);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value !== null && typeof value === 'object') { const c = {}; for (const k of Object.keys(value)) c[k] = sanitizeValue(value[k]); return c; }
  return value;
}

const xssProtect = (req, res, next) => {
  if (req.body)   req.body   = sanitizeValue(req.body);
  if (req.query)  req.query  = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

const SQL_INJECTION_PATTERNS = [
  /(\b)(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE|UNION|CAST|CONVERT)\b/gi,
  /(-{2}|\/\*|\*\/)/g,
  /(\b)(OR|AND)\b\s+[\w'"`]+\s*=\s*[\w'"`]+/gi,
  /;\s*(DROP|DELETE|INSERT|UPDATE|SELECT)/gi,
  /INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS/gi,
  /SLEEP\s*\(/gi,
  /BENCHMARK\s*\(/gi,
  /WAITFOR\s+DELAY/gi,
];

function hasSQLInjection(value) {
  if (typeof value !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(p => { p.lastIndex = 0; return p.test(value); });
}

function checkObjectForSQLi(obj) {
  if (!obj || typeof obj !== 'object') return false;
  for (const val of Object.values(obj)) {
    if (typeof val === 'string' && hasSQLInjection(val)) return true;
    if (typeof val === 'object' && checkObjectForSQLi(val)) return true;
  }
  return false;
}

const sqlInjectionProtect = (req, res, next) => {
  if (checkObjectForSQLi(req.body) || checkObjectForSQLi(req.query) || checkObjectForSQLi(req.params)) {
    logger.security.sqliDetected(req.ip, req.path, JSON.stringify(req.body).slice(0, 100));
    return res.status(400).json({ success: false, message: 'Solicitud inválida. Caracteres no permitidos detectados.' });
  }
  next();
};

const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a), bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    const maxLen = Math.max(bufA.length, bufB.length);
    crypto.timingSafeEqual(Buffer.concat([bufA, Buffer.alloc(maxLen - bufA.length)]), Buffer.concat([bufB, Buffer.alloc(maxLen - bufB.length)]));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

const timingNormalize = (minMs = 200) => (req, res, next) => {
  const start = Date.now(), originalJson = res.json.bind(res);
  res.json = function(body) {
    const remaining = minMs - (Date.now() - start);
    if (remaining > 0) setTimeout(() => originalJson(body), remaining);
    else originalJson(body);
  };
  next();
};

const additionalSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options',        'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Permissions-Policy',     'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.removeHeader('X-Powered-By');
  next();
};

const httpLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (res.statusCode >= 400 || ms > 1000) {
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      logger[level]('HTTP', { method: req.method, path: req.path, status: res.statusCode, ms, ip: req.ip, userId: req.user?.id || null });
    }
  });
  next();
};

module.exports = { globalLimiter, authLimiter, xssProtect, sqlInjectionProtect, timingSafeEqual, timingNormalize, additionalSecurityHeaders, httpLogger };