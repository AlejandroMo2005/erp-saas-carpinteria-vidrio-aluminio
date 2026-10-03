'use strict';

const request = require('supertest');
const { afterAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API materiales - integración HTTP', () => {
  let accessToken;
  let empresaId;

  it('debe autenticar al usuario E2E', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'e2e.admin@example.com',
        password: 'E2E_Test_2026!',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeTruthy();

    accessToken = response.body.data.accessToken;

    const db = require(`${process.cwd()}/src/config/database.js`);
    const [empresas] = await db.query(
      `SELECT id
       FROM empresas
       WHERE ruc = ?
       LIMIT 1`,
      ['9999999999001']
    );

    expect(empresas).toHaveLength(1);
    empresaId = empresas[0].id;
  });

  it('debe obtener materiales de la empresa autenticada', async () => {
    const response = await request(app)
      .get('/api/materiales/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          empresa_id: empresaId,
          nombre: 'Material E2E',
        }),
      ])
    );
  });
});

afterAll(async () => {
  const db = require(`${process.cwd()}/src/config/database.js`);
  const redis = require(`${process.cwd()}/src/config/redis.js`);

  await db.end();
  await redis.quit();
});
