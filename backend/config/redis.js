// backend/config/redis.js
// 🚀 Sprint 15 — DT-04: conexión ioredis para token_blacklist
//
// Uso:
//   const redis = require('./redis');
//   await redis.set('bl:' + jti, '1', 'EX', ttlSeconds);  // blacklist
//   await redis.get('bl:' + jti);                          // check O(1)
//
// Variables de entorno (.env):
//   REDIS_HOST     — default: 127.0.0.1
//   REDIS_PORT     — default: 6379
//   REDIS_PASSWORD — opcional, omitir si no hay contraseña
//
// Patrón igual que database.js: exporta la instancia directamente.
// Redis se mantiene como capa rápida; MySQL token_blacklist se conserva
// como respaldo y auditoría (no se elimina).

const Redis = require('ioredis');

const redis = new Redis({
  host:     process.env.REDIS_HOST     || '127.0.0.1',
  port:     parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  // Reconexión automática con backoff exponencial
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on('connect', () => {
  console.log('[Redis] Conectado correctamente');
});

redis.on('error', (err) => {
  console.error('[Redis] Error de conexión:', err.message);
});

module.exports = redis;