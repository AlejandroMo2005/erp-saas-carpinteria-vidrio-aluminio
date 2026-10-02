'use strict';

const request = require('supertest');
const sharp = require('sharp');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API referencias - integración HTTP', () => {
  const agent = request.agent(app);
  let accessToken;
  let csrfToken;
  let referenciaId;
  let imagenBuffer;

  beforeAll(async () => {
    imagenBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).png().toBuffer();

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

  it('debe rechazar un trabajo inválido al listar referencias', async () => {
    const response = await agent
      .get('/api/referencias/trabajos/abc')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('trabajo_id inválido');
  });

  it('debe subir una referencia para un trabajo existente', async () => {
    const response = await agent
      .post('/api/referencias/trabajos/40')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .field('descriptores', 'ventana aluminio blanca, glass, architectural')
      .field('peso', '0.85')
      .attach('imagen', imagenBuffer, 'referencia-e2e.png');

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.trabajo_id).toBe(40);
    expect(response.body.filename).toMatch(/^ref_\d+\.png$/);
    expect(response.body.descriptores).toBe(
      'ventana aluminio blanca, glass, architectural'
    );
    expect(response.body.peso).toBe(0.85);

    referenciaId = response.body.id;
  });

  it('debe listar la referencia recién creada', async () => {
    const response = await agent
      .get('/api/referencias/trabajos/40')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.trabajo_id).toBe(40);
    expect(response.body.referencias).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: referenciaId,
          descriptores: 'ventana aluminio blanca, glass, architectural',
          peso: '0.85',
          activo: 1,
          url: expect.stringContaining('/referencias/40/'),
        }),
      ])
    );
  });

  it('debe actualizar la referencia creada', async () => {
    const response = await agent
      .patch(`/api/referencias/${referenciaId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        descriptores: 'ventana aluminio negra, vidrio claro, instalación profesional',
        peso: 0.9,
        activo: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('debe eliminar la referencia creada', async () => {
    const response = await agent
      .delete(`/api/referencias/${referenciaId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('debe devolver 404 al consultar una referencia eliminada', async () => {
    const response = await agent
      .get('/api/referencias/trabajos/40')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.referencias).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: referenciaId,
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
