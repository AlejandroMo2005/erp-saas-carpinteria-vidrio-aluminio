// backend/middleware/security.js
// ⭐ Sprint 11 — XSS: regex reemplazado por librería `xss` especializada
//              + Helmet integrado (requiere npm install xss helmet)
//              + Logger estructurado reemplaza console.warn
//
// npm install xss helmet

const rateLimit = require('express-rate-limit');
const crypto    = require('crypto');
const xss       = require('xss');
const logger    = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────
// Configuración XSS — librería especializada
// Cubre: SVG payloads, HTML entities codificadas, vectores avanzados
// ─────────────────────────────────────────────────────────────────────────
const xssOptions = {
  whiteList:          {},          // Sin tags HTML permitidos
  stripIgnoreTag:     true,        // Strip tags no reconocidas
  stripIgnoreTagBody: ['script'],  // Eliminar contenido de <script>
  css:                false,       // Sin CSS inline
};

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════

const globalLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => {
    logger.security.loginBlocked(req.ip, req.path);
    res.status(429).json({
      success:    false,
      message:    'Demasiadas peticiones. Intenta nuevamente en 1 minuto.',
      retryAfter: 60
    });
  }
});

const authLimiter = rateLimit({
  windowMs:               60 * 1000,
  max:                    10,
  standardHeaders:        true,
  legacyHeaders:          false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn('Rate limit AUTH', { ip: req.ip, timestamp: new Date().toISOString() });
    res.status(429).json({
      success:    false,
      message:    'Demasiados intentos de autenticación. Intenta nuevamente en 1 minuto.',
      retryAfter: 60
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SANITIZACIÓN XSS — librería `xss` (antes: regex básico)
// ⭐ Sprint 11: cubre SVG payloads, HTML entities, vectores avanzados
// ═══════════════════════════════════════════════════════════════════════════

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return xss(value, xssOptions);
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value !== null && typeof value === 'object') {
    const clean = {};
    for (const key of Object.keys(value)) clean[key] = sanitizeValue(value[key]);
    return clean;
  }
  return value;
}

const xssProtect = (req, res, next) => {
  if (req.body)   req.body   = sanitizeValue(req.body);
  if (req.query)  req.query  = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

// ═══════════════════════════════════════════════════════════════════════════
// PROTECCIÓN SQL INJECTION
// ═══════════════════════════════════════════════════════════════════════════

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
  return SQL_INJECTION_PATTERNS.some(pattern => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
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
  const suspicious =
    checkObjectForSQLi(req.body)  ||
    checkObjectForSQLi(req.query) ||
    checkObjectForSQLi(req.params);

  if (suspicious) {
    logger.security.sqliDetected(req.ip, req.path, JSON.stringify(req.body).slice(0, 100));
    return res.status(400).json({
      success: false,
      message: 'Solicitud inválida. Caracteres no permitidos detectados.'
    });
  }
  next();
};

// ═══════════════════════════════════════════════════════════════════════════
// TIMING ATTACK PROTECTION
// ═══════════════════════════════════════════════════════════════════════════

const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    const maxLen = Math.max(bufA.length, bufB.length);
    const padA = Buffer.concat([bufA, Buffer.alloc(maxLen - bufA.length)]);
    const padB = Buffer.concat([bufB, Buffer.alloc(maxLen - bufB.length)]);
    crypto.timingSafeEqual(padA, padB);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

const timingNormalize = (minMs = 200) => {
  return (req, res, next) => {
    const start        = Date.now();
    const originalJson = res.json.bind(res);
    res.json = function(body) {
      const remaining = minMs - (Date.now() - start);
      if (remaining > 0) {
        setTimeout(() => originalJson(body), remaining);
      } else {
        originalJson(body);
      }
    };
    next();
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// HEADERS DE SEGURIDAD
// (Helmet se configura directamente en app.js — ver parche abajo)
// Estos headers son un fallback manual para lo que Helmet no cubre
// ═══════════════════════════════════════════════════════════════════════════

const additionalSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options',        'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Permissions-Policy',     'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  res.removeHeader('X-Powered-By');
  next();
};

// ═══════════════════════════════════════════════════════════════════════════
// HTTP REQUEST LOGGER — reemplaza morgan o logs manuales
// ═══════════════════════════════════════════════════════════════════════════

const httpLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    // Solo loguear >= 400 o requests lentos (> 1s)
    if (res.statusCode >= 400 || ms > 1000) {
      const level = res.statusCode >= 500 ? 'error'
                  : res.statusCode >= 400 ? 'warn'
                  : 'info';
      logger[level]('HTTP', {
        method:   req.method,
        path:     req.path,
        status:   res.statusCode,
        ms,
        ip:       req.ip,
        userId:   req.user?.id || null,
      });
    }
  });
  next();
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════
module.exports = {
  globalLimiter,
  authLimiter,
  xssProtect,
  sqlInjectionProtect,
  timingSafeEqual,
  timingNormalize,
  additionalSecurityHeaders,
  httpLogger,
};