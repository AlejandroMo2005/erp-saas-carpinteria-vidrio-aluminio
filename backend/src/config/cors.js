// backend/config/cors.js
// Sprint 16 — CORS: permite IPs de red local en DEV

'use strict';

const cors   = require('cors');
const logger = require('../shared/utils/logger');

const IS_PROD = process.env.NODE_ENV === 'production';

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:4173',
  'http://localhost:5000',
  'https://localhost:5000',
  'http://localhost:5173',
  'https://localhost:5173',
];

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : DEFAULT_ORIGINS;

// Permite cualquier IP de red local en DEV (192.168.x.x, 10.x, 172.16-31.x)
const LOCAL_NETWORK_REGEX =
  /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):(3000|4173|5000|5173)$/;

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (!IS_PROD && LOCAL_NETWORK_REGEX.test(origin)) {
      logger.info('CORS_LOCAL_NETWORK', { event: 'cors.local_network_allowed', origin });
      return callback(null, true);
    }
    logger.warn('CORS_BLOCKED', { event: 'cors.blocked', origin });
    return callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
  },
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials:    true,
});

module.exports = { corsMiddleware, ALLOWED_ORIGINS };