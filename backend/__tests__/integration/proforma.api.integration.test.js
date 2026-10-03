'use strict';

const request = require('supertest');
const { afterAll, beforeAll, describe, expect, it } = await import('vitest');

const app = require(`${process.cwd()}/app.js`);

describe('API proformas - integración HTTP', () => {
  const agent = request.agent(app);
  let accessToken;
  let csrfToken;
  let trabajoId;
  let proformaId;
  const clientePrueba = 'Cliente Proforma E2E';

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

    const crearResponse = await agent
      .post('/api/proformas/agendar')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        cliente: clientePrueba,
        telefono: '0999999999',
        items: [
          {
            trabajo_id: trabajoId,
            ancho: 0.5,
            alto: 0.5,
            cantidad: 1,
          },
        ],
      });

    expect(crearResponse.status).toBe(201);
    expect(crearResponse.body.success).toBe(true);
    expect(crearResponse.body.proforma_id).toBeTruthy();

    proformaId = crearResponse.body.proforma_id;
  });

  it('debe listar proformas de la empresa autenticada', async () => {
    const response = await agent
      .get('/api/proformas/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: proformaId,
          cliente: clientePrueba,
        }),
      ])
    );
  });

  it('debe buscar proformas por cliente', async () => {
    const response = await agent
      .get('/api/proformas/buscar/cliente')
      .query({ cliente: clientePrueba })
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every((proforma) =>
        proforma.cliente.includes(clientePrueba)
      )
    ).toBe(true);
  });

  it('debe obtener una proforma existente', async () => {
    const response = await agent
      .get(`/api/proformas/${proformaId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: proformaId,
        cliente: clientePrueba,
      })
    );
  });

  it('debe calcular una proforma mediante receta', async () => {
    const response = await agent
      .post('/api/proformas/calcular')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        cliente: 'Cliente Calculo E2E',
        items: [
          {
            trabajo_id: trabajoId,
            ancho: 0.5,
            alto: 0.5,
            cantidad: 1,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        cliente: 'Cliente Calculo E2E',
        iva_valor: 0.15,
      })
    );
    expect(response.body.data.subtotal).toBeGreaterThan(0);
    expect(response.body.data.iva).toBeGreaterThan(0);
    expect(response.body.data.total).toBeGreaterThan(
      response.body.data.subtotal
    );
    expect(response.body.data.whatsapp_text).toContain('$');
  });
});

afterAll(async () => {
  const db = require(`${process.cwd()}/src/config/database.js`);
  const redis = require(`${process.cwd()}/src/config/redis.js`);

  await db.end();
  await redis.quit();
});
