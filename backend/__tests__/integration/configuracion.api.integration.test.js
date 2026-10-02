'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API configuración - integración HTTP', () => {
  const agent = request.agent(app);
  let accessToken;
  let csrfToken;

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

  it('debe listar la configuración de la empresa', async () => {
    const response = await agent
      .get('/api/configuracion/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('debe obtener la tasa IVA por defecto', async () => {
    const response = await agent
      .get('/api/configuracion/iva/tasa')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        clave: 'IVA',
        valor: expect.any(String),
        porcentaje: expect.stringMatching(/^\d+%$/),
      })
    );
  });

  it('debe crear o actualizar la configuración IVA', async () => {
    const response = await agent
      .put('/api/configuracion/IVA')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ valor: '0.15' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      clave: 'IVA',
      valor: '0.15',
    });
  });

  it('debe recuperar el IVA configurado', async () => {
    const response = await agent
      .get('/api/configuracion/IVA')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      clave: 'IVA',
      valor: '0.15',
    });
  });
});

afterAll(async () => {
  const db = require(`${process.cwd()}/src/config/database.js`);
  const redis = require(`${process.cwd()}/src/config/redis.js`);

  await db.end();
  await redis.quit();
});
