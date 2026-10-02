'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API proformas - integración HTTP', () => {
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

  it('debe listar proformas de la empresa autenticada', async () => {
    const response = await agent
      .get('/api/proformas/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 70,
          empresa_id: 2,
          cliente: expect.stringContaining('Cliente Pedidos E2E'),
        }),
      ])
    );
  });

  it('debe buscar proformas por cliente', async () => {
    const response = await agent
      .get('/api/proformas/buscar/cliente')
      .query({ cliente: 'Cliente Pedidos E2E' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every((proforma) =>
        proforma.cliente.includes('Cliente Pedidos E2E')
      )
    ).toBe(true);
  });

  it('debe obtener una proforma existente', async () => {
    const response = await agent
      .get('/api/proformas/70')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: 70,
        empresa_id: 2,
        cliente: expect.stringContaining('Cliente Pedidos E2E'),
        total: '115.00',
      })
    );
  });

  it('debe calcular una proforma legacy con el material E2E', async () => {
    const response = await agent
      .post('/api/proformas/calcular')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        cliente: 'Cliente Calculo E2E',
        items: [
          {
            material_id: 41,
            cantidad: 2,
            precio_unitario: 50,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        cliente: 'Cliente Calculo E2E',
        subtotal: 100,
        iva: 15,
        total: 115,
        iva_valor: 0.15,
      })
    );
    expect(response.body.data.whatsapp_text).toContain('$115.00');
  });
});

afterAll(async () => {
  const db = require(`${process.cwd()}/src/config/database.js`);
  const redis = require(`${process.cwd()}/src/config/redis.js`);

  await db.end();
  await redis.quit();
});
