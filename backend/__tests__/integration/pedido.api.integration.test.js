'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API pedidos - integración HTTP', () => {
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

  it('debe listar pedidos de la empresa autenticada', async () => {
    const response = await agent
      .get('/api/pedidos/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 86,
          estado: 'PENDIENTE',
        }),
      ])
    );
  });

  it('debe filtrar pedidos por estado', async () => {
    const response = await agent
      .get('/api/pedidos/estado/ENTREGADO')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((pedido) => pedido.estado === 'ENTREGADO')).toBe(true);
  });

  it('debe obtener un pedido existente con sus items', async () => {
    const response = await agent
      .get('/api/pedidos/86')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: 86,
        estado: 'PENDIENTE',
        total: expect.anything(),
        proforma_id: 70,
        items: expect.any(Array),
      })
    );
  });

  it('debe rechazar un estado inexistente', async () => {
    const response = await agent
      .get('/api/pedidos/estado/INVALIDO')
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
