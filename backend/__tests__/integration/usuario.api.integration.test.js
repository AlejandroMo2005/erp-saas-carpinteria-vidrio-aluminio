'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API usuarios - integración HTTP', () => {
  const agent = request.agent(app);
  let accessToken;
  let csrfToken;
  let usuarioId;
  let usuarioAdminId;
  const email = `usuario.e2e.${Date.now()}@example.com`;

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
    usuarioAdminId = response.body.data.user.id;
  });

  it('debe obtener el perfil del usuario autenticado', async () => {
    const response = await agent
      .get('/api/usuarios/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: usuarioAdminId,
        email: 'e2e.admin@example.com',
        rol: 'ADMIN',
      })
    );
  });

  it('debe listar usuarios de la empresa autenticada', async () => {
    const response = await agent
      .get('/api/usuarios/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: usuarioAdminId,
          email: 'e2e.admin@example.com',
          rol: 'ADMIN',
        }),
      ])
    );
  });

  it('debe crear un usuario asociado a la empresa autenticada', async () => {
    const response = await agent
      .post('/api/usuarios/')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        nombre: 'Usuario Nuevo E2E',
        email,
        password: 'E2E_User_2026!',
        rol: 'VENDEDOR',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        nombre: 'Usuario Nuevo E2E',
        email,
        rol: 'VENDEDOR',
        activo: 1,
      })
    );

    usuarioId = response.body.data.id;
  });

  it('debe encontrar el usuario recién creado', async () => {
    const response = await agent
      .get('/api/usuarios/buscar')
      .query({ q: 'Usuario Nuevo E2E' })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: usuarioId,
            nombre: 'Usuario Nuevo E2E',
          email,
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
