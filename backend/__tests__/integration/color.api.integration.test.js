'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API colores - integración HTTP', () => {
  const agent = request.agent(app);
  let accessToken;

  beforeAll(async () => {
    await agent.get('/api');

    const response = await agent
      .post('/api/auth/login')
      .send({
        email: 'e2e.admin@example.com',
        password: 'E2E_Test_2026!',
      });

    expect(response.status).toBe(200);
    accessToken = response.body.data.accessToken;
  });

  it('debe obtener colores de la empresa autenticada', async () => {
    const response = await agent
      .get('/api/colores/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('debe devolver la estructura esperada de los colores', async () => {
    const response = await agent
      .get('/api/colores/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    for (const color of response.body) {
      expect(color).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          nombre: expect.any(String),
          tipo: expect.any(String),
        })
      );
    }
  });
});

afterAll(async () => {
  const db = require(`${process.cwd()}/src/config/database.js`);
  const redis = require(`${process.cwd()}/src/config/redis.js`);

  await db.end();
  await redis.quit();
});
