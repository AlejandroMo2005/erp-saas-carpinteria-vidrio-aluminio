'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API clientes - integración HTTP', () => {
  const agent = request.agent(app);
  let accessToken;
  let csrfToken;
  let telefono;

  beforeAll(async () => {
    const csrfResponse = await agent.get('/api');
    csrfToken = csrfResponse.headers['set-cookie']
      ?.find((cookie) => cookie.startsWith('csrf-token='))
      ?.split(';')[0]
      ?.split('=')[1];

    const response = await agent
      .post('/api/auth/login')
      .send({
        email: 'e2e.admin@example.com',
        password: 'E2E_Test_2026!',
      });

    expect(response.status).toBe(200);
    accessToken = response.body.data.accessToken;
  });

  it('debe listar clientes de la empresa autenticada', async () => {
    const response = await agent
      .get('/api/clientes/')
      .query({ busqueda: 'Cliente' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('debe crear un cliente asociado a la empresa autenticada', async () => {
    telefono = `09${Date.now().toString().slice(-8)}`;

    const response = await agent
      .post('/api/clientes/')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        nombre: 'Cliente E2E',
        telefono,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        nombre: 'Cliente E2E',
        telefono,
      })
    );
  });

  it('debe encontrar el cliente recién creado', async () => {
    const response = await agent
      .get('/api/clientes/')
      .query({ busqueda: telefono })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nombre: 'Cliente E2E',
          telefono,
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
