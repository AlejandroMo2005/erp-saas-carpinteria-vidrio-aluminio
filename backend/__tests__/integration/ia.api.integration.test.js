'use strict';

const request = require('supertest');
const sharp = require('sharp');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API IA - integración HTTP', () => {
  const agent = request.agent(app);
  let accessToken;
  let csrfToken;
  let imagenBase64;

  beforeAll(async () => {
    const imagen = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).png().toBuffer();

    imagenBase64 = `data:image/png;base64,${imagen.toString('base64')}`;

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

  it('debe rechazar inpaint sin campos requeridos', async () => {
    const response = await agent
      .post('/api/ia/inpaint')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({});

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  it('debe ejecutar inpaint con el mock de IA', async () => {
    const response = await agent
      .post('/api/ia/inpaint')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        imagen: imagenBase64,
        mascara: imagenBase64,
        prompt: 'ventana de aluminio blanca',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.imagen).toBe(imagenBase64);
    expect(response.body.modelo).toBe('mock-hf');
  });

  it('debe obtener trabajo y colores disponibles', async () => {
    const response = await agent
      .get('/api/ia/visualizar/trabajos/40/colores')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.trabajo).toEqual(
      expect.objectContaining({
        id: 40,
        nombre: 'Ventana E2E',
      })
    );
    expect(Array.isArray(response.body.colores)).toBe(true);
  });

  it('debe rechazar visualizar sin archivos', async () => {
    const response = await agent
      .post('/api/ia/visualizar')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('trabajo_id', '40')
      .field('color_id', '11');

    expect(response.status).toBe(422);
  });

  it('debe generar máscara automática con el mock SAM', async () => {
    const response = await agent
      .post('/api/ia/mascara-auto')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('imagen', Buffer.from(await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      }).png().toBuffer()), 'imagen.png');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.mascara_base64).toEqual(expect.any(String));
    expect(response.body.mime_type).toBe('image/png');
  });
});

afterAll(async () => {
  const db = require(`${process.cwd()}/src/config/database.js`);
  const redis = require(`${process.cwd()}/src/config/redis.js`);

  await db.end();
  await redis.quit();
});
