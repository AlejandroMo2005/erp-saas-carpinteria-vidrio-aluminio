// backend/config/helmet.js
// Sprint 13 — CSP Report-Only Trusted Types + HSTS
// Sprint 18 — CSP Enforce + report-uri endpoint

'use strict';

const helmet = require('helmet');

const IS_PROD = process.env.NODE_ENV === 'production';

// ── Helmet + CSP ───────────────────────────────────────────────────────────
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc: IS_PROD
        ? ["'self'"]
        : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc:         ["'self'", "data:", "blob:"],
      fontSrc:        ["'self'", "data:", "https://fonts.gstatic.com"],
      connectSrc:     ["'self'"],
      objectSrc:      ["'none'"],
      mediaSrc:       ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: IS_PROD ? [] : null,
    },
  },
  permissionsPolicy:         false,
  crossOriginEmbedderPolicy: false,
  strictTransportSecurity: IS_PROD
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
});

// ── Headers adicionales + Trusted Types en PROD ────────────────────────────
const customHeaders = (req, res, next) => {
  res.setHeader('Referrer-Policy',             'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy',          'geolocation=(), microphone=(), camera=(self)');
  res.setHeader('Cross-Origin-Opener-Policy',  'same-origin-allow-popups');
  if (IS_PROD) {
    res.setHeader(
      'Content-Security-Policy',
      "require-trusted-types-for 'script'; report-uri /api/csp-report"
    );
  }
  next();
};

module.exports = { helmetMiddleware, customHeaders };