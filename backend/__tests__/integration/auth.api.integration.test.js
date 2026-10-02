'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API auth - integración HTTP', () => {
  const agent = request.agent(app);
  let accessToken;
  let csrfToken;

  beforeAll(async () => {
    const csrfResponse = await agent.get('/api');

    csrfToken = csrfResponse.headers['set-cookie']
      ?.find((cookie) => cookie.startsWith('csrf-token='))
      ?.split(';')[0]
      ?.split('=')[1];
  });

  it('debe informar los endpoints del módulo auth', async () => {
    const response = await agent.get('/api/auth');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.endpoints).toEqual(
      expect.objectContaining({
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        profile: 'GET  /api/auth/profile',
      })
    );
  });

  it('debe rechazar credenciales inválidas', async () => {
    const response = await agent
      .post('/api/auth/login')
      .send({
        email: 'e2e.admin@example.com',
        password: 'password-invalido',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('debe autenticar al usuario E2E y emitir tokens', async () => {
    const response = await agent
      .post('/api/auth/login')
      .send({
        email: 'e2e.admin@example.com',
        password: 'E2E_Test_2026!',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        expiresIn: expect.any(String),
        user: expect.objectContaining({
          id: 7,
          email: 'e2e.admin@example.com',
          rol: 'ADMIN',
        }),
      })
    );

    accessToken = response.body.data.accessToken;

    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('refreshToken='),
      ])
    );
  });

  it('debe obtener el perfil autenticado', async () => {
    const response = await agent
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: 7,
        email: 'e2e.admin@example.com',
        rol: 'ADMIN',
      })
    );
  });

  it('debe renovar la sesión mediante refresh token', async () => {
    const response = await agent
      .post('/api/auth/refresh');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.expiresIn).toEqual(expect.any(String));

    accessToken = response.body.accessToken;
  });

  it('debe rechazar refresh sin cookie', async () => {
    const isolatedAgent = request.agent(app);

    const response = await isolatedAgent
      .post('/api/auth/refresh');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.expired).toBe(true);
  });

  it('debe responder de forma uniforme para correo inexistente en recuperación', async () => {
    const response = await agent
      .post('/api/auth/forgot-password')
      .set('x-csrf-token', csrfToken)
      .send({
        email: 'no-existe-e2e@example.com',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Si el correo existe');
    expect(response.body.token).toBeUndefined();
  });

  it('debe cerrar la sesión autenticada', async () => {
    const response = await agent
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Sesión cerrada');
  });
});

afterAll(async () => {
  const db = require(`${process.cwd()}/src/config/database.js`);
  const redis = require(`${process.cwd()}/src/config/redis.js`);

  await db.end();
  await redis.quit();
});
