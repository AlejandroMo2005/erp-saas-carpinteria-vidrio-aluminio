'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API facturación - integración HTTP', () => {
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

  it('debe listar facturas de la empresa autenticada', async () => {
    const response = await agent
      .get('/api/facturacion/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        facturas: expect.any(Array),
        paginacion: expect.objectContaining({
          pagina: 1,
          limite: 20,
          total: expect.any(Number),
        }),
      })
    );
  });

  it('debe obtener el siguiente número de factura', async () => {
    const response = await agent
      .get('/api/facturacion/siguiente-numero')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        numeroFormateado: expect.any(String),
        secuencia: expect.any(Number),
      })
    );
  });

  it('debe validar un pedido sin factura asociada', async () => {
    const response = await agent
      .get('/api/facturacion/validar-pedido/86')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        facturable: expect.any(Boolean),
      })
    );
  });

  it('debe rechazar un cliente inválido al consultar pedidos facturables', async () => {
    const response = await agent
      .get('/api/facturacion/pedidos-cliente/abc')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

afterAll(async () => {
  const db = require(`${process.cwd()}/src/config/database.js`);
  const redis = require(`${process.cwd()}/src/config/redis.js`);

  await db.end();
  await redis.quit();
});
