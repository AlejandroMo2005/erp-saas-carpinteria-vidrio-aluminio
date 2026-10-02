'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API proveedores - integración HTTP', () => {
  const agent = request.agent(app);
  let accessToken;
  let csrfToken;
  let proveedorId;

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

  it('debe listar proveedores de la empresa autenticada', async () => {
    const response = await agent
      .get('/api/proveedores/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('debe crear un proveedor asociado a la empresa autenticada', async () => {
    const response = await agent
      .post('/api/proveedores/')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        nombre: 'Proveedor E2E',
        ciudad: 'Flavio Alfaro',
        telefono_whatsapp: '0988888888',
        email: 'proveedor.e2e@example.com',
        notas: 'Proveedor de integración E2E',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        nombre: 'Proveedor E2E',
        ciudad: 'Flavio Alfaro',
      })
    );

    proveedorId = response.body.data.id;
    expect(proveedorId).toBeTruthy();
  });

  it('debe obtener el proveedor recién creado', async () => {
    const response = await agent
      .get(`/api/proveedores/${proveedorId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: proveedorId,
        empresa_id: 2,
        nombre: 'Proveedor E2E',
      })
    );
  });
});

afterAll(async () => {
  const db = require(`${process.cwd()}/src/config/database.js`);
  const redis = require(`${process.cwd()}/src/config/redis.js`);

  await db.end();
  await redis.quit();
});
