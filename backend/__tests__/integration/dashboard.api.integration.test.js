'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API dashboard - integración HTTP', () => {
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

  it('debe obtener el resumen del dashboard', async () => {
    const response = await agent
      .get('/api/dashboard/resumen')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });

  it('debe obtener ingresos por periodo', async () => {
    const response = await agent
      .get('/api/dashboard/ingresos')
      .query({ periodo: 'mes' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.periodo).toBe('mes');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('debe rechazar un periodo inválido', async () => {
    const response = await agent
      .get('/api/dashboard/ingresos')
      .query({ periodo: 'invalido' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('debe obtener pedidos recientes', async () => {
    const response = await agent
      .get('/api/dashboard/pedidos-recientes')
      .query({ limite: 5 })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeLessThanOrEqual(5);
  });

  it('debe obtener ingresos por usuario', async () => {
    const response = await agent
      .get('/api/dashboard/usuarios-ingresos')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('debe obtener los productos principales', async () => {
    const response = await agent
      .get('/api/dashboard/top-productos')
      .query({ limite: 5 })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeLessThanOrEqual(5);
  });

  it('debe obtener materiales con sus variantes', async () => {
    const response = await agent
      .get('/api/dashboard/materiales-variantes')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);

    for (const material of response.body.data) {
      expect(material).toEqual(
        expect.objectContaining({
          material_id: expect.any(Number),
          variantes: expect.any(Array),
        })
      );
    }
  });

  it('debe obtener estadísticas de trabajos y estados', async () => {
    const [trabajos, estados] = await Promise.all([
      agent
        .get('/api/dashboard/trabajos-stats')
        .set('Authorization', `Bearer ${accessToken}`),
      agent
        .get('/api/dashboard/estados')
        .set('Authorization', `Bearer ${accessToken}`),
    ]);

    expect(trabajos.status).toBe(200);
    expect(trabajos.body.success).toBe(true);
    expect(Array.isArray(trabajos.body.data)).toBe(true);

    expect(estados.status).toBe(200);
    expect(estados.body.success).toBe(true);
    expect(Array.isArray(estados.body.data)).toBe(true);
  });
});

afterAll(async () => {
  const db = require(`${process.cwd()}/src/config/database.js`);
  const redis = require(`${process.cwd()}/src/config/redis.js`);

  await db.end();
  await redis.quit();
});
