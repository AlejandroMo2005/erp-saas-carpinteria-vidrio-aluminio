'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API trabajos - integración HTTP', () => {
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

  it('debe listar trabajos de la empresa autenticada', async () => {
    const response = await agent
      .get('/api/trabajos/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 40,
          nombre: 'Ventana E2E',
        }),
      ])
    );
  });

  it('debe obtener solo trabajos base', async () => {
    const response = await agent
      .get('/api/trabajos/')
      .query({ solo_base: '1' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    for (const trabajo of response.body) {
      expect(
        trabajo.variante === null || trabajo.variante === ''
      ).toBe(true);
    }
  });

  it('debe obtener las recetas de un trabajo', async () => {
    const response = await agent
      .get('/api/trabajos/40/recetas')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 181,
          trabajo_id: 40,
          material_id: 41,
          material: 'Material E2E',
          unidad_calculo: 'm2',
        }),
      ])
    );
  });

  it('debe obtener los colores de la empresa autenticada', async () => {
    const response = await agent
      .get('/api/trabajos/colores')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

afterAll(async () => {
  const db = require(`${process.cwd()}/src/config/database.js`);
  const redis = require(`${process.cwd()}/src/config/redis.js`);

  await db.end();
  await redis.quit();
});
