// src/shared/utils/logger.js
// ⭐ Sprint 21 — Movido desde backend/utils/logger.js
//   Ruta canónica: src/shared/utils/logger.js
//   ÚNICO CAMBIO: LOG_DIR ahora usa '../../../logs' (3 niveles arriba = raíz del proyecto)
//   en lugar de '../../logs' (que apuntaba a backend/../logs = raíz).
//   El directorio físico logs/ no cambia de lugar.
//
// Niveles: error > warn > info > http > debug
// En producción: solo info+ a archivo + console JSON
// En desarrollo: console colorizado + archivo
//
// Uso:
//   const logger = require('../../shared/utils/logger');
//   logger.info('Login exitoso', { userId: 4, ip: '127.0.0.1' });
//   logger.warn('Rate limit alcanzado', { ip, path });
//   logger.error('Error en DB', { error: err.message, stack: err.stack });

'use strict';

const winston = require('winston');
const path    = require('path');
const fs      = require('fs');

// ── Directorio de logs — siempre en la raíz del proyecto ────────────────
// __dirname = src/shared/utils  →  ../../../  = raíz del proyecto
const LOG_DIR = path.join(__dirname, '../../../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// ── Formato base JSON ────────────────────────────────────────────────────
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ── Formato consola (desarrollo) ─────────────────────────────────────────
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message}${extras}`;
  })
);

const esProd = process.env.NODE_ENV === 'production';

// ── Transports ───────────────────────────────────────────────────────────
const transports = [
  new winston.transports.Console({
    format: esProd ? jsonFormat : consoleFormat,
    level:  esProd ? 'info' : 'debug',
  }),
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    level:    'error',
    format:   jsonFormat,
    maxsize:  10 * 1024 * 1024,
    maxFiles: 5,
    tailable: true,
  }),
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    level:    'info',
    format:   jsonFormat,
    maxsize:  20 * 1024 * 1024,
    maxFiles: 10,
    tailable: true,
  }),
];

// ── Instancia principal ──────────────────────────────────────────────────
const logger = winston.createLogger({
  level:             esProd ? 'info' : 'debug',
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(LOG_DIR, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(LOG_DIR, 'rejections.log') }),
  ],
  exitOnError: false,
});

// ── Helpers de eventos de seguridad ─────────────────────────────────────
logger.security = {
  loginOk:      (userId, ip)            => logger.info('LOGIN_OK',       { userId, ip }),
  loginFail:    (email, ip)             => logger.warn('LOGIN_FAILED',   { email, ip }),
  loginBlocked: (ip, path)              => logger.warn('RATE_LIMIT',     { ip, path }),
  sqliDetected: (ip, path, value)       => logger.warn('SQLI_DETECTED',  { ip, path, value }),
  xssDetected:  (ip, path)              => logger.warn('XSS_ATTEMPT',    { ip, path }),
  unauthorized: (ip, path, userId)      => logger.warn('UNAUTHORIZED',   { ip, path, userId }),
  stockLow:     (materialId, stock)     => logger.warn('STOCK_LOW',      { materialId, stock }),
  passwordReset:(userId, ip)            => logger.info('PASSWORD_RESET', { userId, ip }),
  logout:       (userId, ip)            => logger.info('LOGOUT',         { userId, ip }),
  rolChanged:   (adminId, targetId, newRol) => logger.info('ROL_CHANGED', { adminId, targetId, newRol }),
};

// ── Alias directos para métodos de uso frecuente ─────────────────────────
logger.stockLow = (materialId, nombre, stockActual, stockMinimo) =>
  logger.warn('STOCK_LOW', {
    event:      'stock.bajo',
    materialId,
    nombre,
    stockActual,
    stockMinimo,
    faltante:   Math.max(0, (stockMinimo ?? 0) - (stockActual ?? 0)),
  });

logger.loginFail    = (email, ip, razon) => logger.warn('LOGIN_FAILED',  { event: 'auth.login_fail',    email, ip, razon });
logger.accessDenied = (rol, path, ip)    => logger.warn('ACCESS_DENIED', { event: 'auth.access_denied', rol, path, ip });

// ── Override console.* en producción (Sprint 13) ─────────────────────────
if (esProd) {
  console.log   = (...args) => logger.info(args.map(String).join(' '),  { source: 'console.log' });
  console.info  = (...args) => logger.info(args.map(String).join(' '),  { source: 'console.info' });
  console.warn  = (...args) => logger.warn(args.map(String).join(' '),  { source: 'console.warn' });
  console.error = (...args) => logger.error(args.map(String).join(' '), { source: 'console.error' });
  console.debug = ()        => {};
}

module.exports = logger;