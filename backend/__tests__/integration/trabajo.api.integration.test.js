'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API trabajos - integración HTTP', () => {
  const agent = request.agent(app);
  let accessToken;
  let trabajoId;
  let materialId;
  let recetaId;

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

    const db = require(`${process.cwd()}/src/config/database.js`);

    const [trabajos] = await db.query(
      `SELECT t.id
       FROM trabajos t
       INNER JOIN empresas e ON e.id = t.empresa_id
       WHERE t.nombre = ? AND e.ruc = ?
       LIMIT 1`,
      ['Ventana E2E', '9999999999001']
    );

    expect(trabajos).toHaveLength(1);
    trabajoId = trabajos[0].id;

    const [recetas] = await db.query(
      `SELECT r.id, r.material_id
       FROM recetas r
       INNER JOIN trabajos t ON t.id = r.trabajo_id
       INNER JOIN materiales m ON m.id = r.material_id
       WHERE r.trabajo_id = ?
         AND t.nombre = ?
         AND m.nombre = ?
       LIMIT 1`,
      [trabajoId, 'Ventana E2E', 'Material E2E']
    );

    expect(recetas).toHaveLength(1);
    recetaId = recetas[0].id;
    materialId = recetas[0].material_id;
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
          id: trabajoId,
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
      .get(`/api/trabajos/${trabajoId}/recetas`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: recetaId,
          trabajo_id: trabajoId,
          material_id: materialId,
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
