'use strict';

const mysql = require('mysql2/promise');
const Redis = require('ioredis');
const { describe, it, expect, afterAll } = await import('vitest');

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'e2e-root',
  database: process.env.DB_NAME || 'inventario_proformas_e2e',
});

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6380),
});

describe('Infraestructura de integración', () => {
  it('conecta con MySQL E2E y consulta el esquema', async () => {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ?',
      [process.env.DB_NAME || 'inventario_proformas_e2e']
    );

    expect(rows[0].total).toBeGreaterThan(0);
  });

  it('conecta con Redis E2E', async () => {
    await expect(redis.ping()).resolves.toBe('PONG');
  });
});

afterAll(async () => {
  await db.end();
  await redis.quit();
});
