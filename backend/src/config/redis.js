// src/config/redis.js
// ⭐ Sprint 21 — Movido desde backend/config/redis.js
//   Ruta canónica: src/config/redis.js
//   Imports que apuntaban a backend/config/redis → src/config/redis
//
// Sin cambios de lógica respecto a la versión anterior.

'use strict';

const Redis = require('ioredis');

const redis = new Redis({
  host:     process.env.REDIS_HOST     || '127.0.0.1',
  port:     parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on('connect', () => {
  console.log('[Redis] Conectado correctamente');
});

redis.on('error', (err) => {
  console.error('[Redis] Error de conexión:', err.message);
});

module.exports = redis;