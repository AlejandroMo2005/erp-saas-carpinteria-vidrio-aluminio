'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API pedidos - integración HTTP', () => {
  const agent = request.agent(app);

  let accessToken;
  let csrfToken;
  let pedidoPendienteId;
  let pedidoEntregadoId;

  beforeAll(async () => {
    const csrfResponse = await agent.get('/api');

    csrfToken = csrfResponse.headers['set-cookie']
      ?.find((cookie) => cookie.startsWith('csrf-token='))
      ?.split(';')[0]
      ?.split('=')[1];

    expect(csrfToken).toBeTruthy();

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({
        email: 'e2e.admin@example.com',
        password: 'E2E_Test_2026!',
      });

    expect(loginResponse.status).toBe(200);
    accessToken = loginResponse.body.data.accessToken;

    const pedidoPendiente = await agent
      .post('/api/pedidos/')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        total: 25,
        observaciones: 'Pedido E2E pendiente',
        detalles: [],
      });

    expect(pedidoPendiente.status).toBe(201);
    pedidoPendienteId = pedidoPendiente.body.data[0].id;

    const pedidoEntregado = await agent
      .post('/api/pedidos/')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        total: 30,
        observaciones: 'Pedido E2E entregado',
        detalles: [],
      });

    expect(pedidoEntregado.status).toBe(201);
    pedidoEntregadoId = pedidoEntregado.body.data[0].id;

    const estadoResponse = await agent
      .put(`/api/pedidos/${pedidoEntregadoId}/estado`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ estado: 'ENTREGADO' });

    expect(estadoResponse.status).toBe(200);
  });

  it('debe listar pedidos de la empresa autenticada', async () => {
    const response = await agent
      .get('/api/pedidos/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: pedidoPendienteId,
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
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: pedidoEntregadoId,
          estado: 'ENTREGADO',
        }),
      ])
    );
  });

  it('debe obtener un pedido existente con sus items', async () => {
    const response = await agent
      .get(`/api/pedidos/${pedidoPendienteId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: pedidoPendienteId,
        estado: 'PENDIENTE',
        total: expect.anything(),
        proforma_id: null,
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
