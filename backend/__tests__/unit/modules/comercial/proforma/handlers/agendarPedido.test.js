import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const database = {
  getConnection: vi.fn(),
};

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const service = {
  round2: vi.fn((n) =>
    Math.round((Number(n) + Number.EPSILON) * 100) / 100
  ),
  isLegacyItems: vi.fn(),
  isRecipeItems: vi.fn(),
  safeDate: vi.fn((d) => d || '2026-09-23'),
  validarYRestarStock: vi.fn(),
  validarYRestarStockLegacy: vi.fn(),
  calcularPorRecetas: vi.fn(),
  buildWhatsAppText: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../../config/database.js') {
    return database;
  }

  if (request === '../../../../shared/utils/logger') {
    return logger;
  }

  if (request === '../proforma.service') {
    return service;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const handlers = require(
  `${process.cwd()}/src/modules/comercial/proforma/handlers/agendarPedido.js`
);

Module._load = originalLoad;

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

function createConnection(queryImpl = vi.fn()) {
  return {
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    query: queryImpl,
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    release: vi.fn(),
  };
}

function createRequest(overrides = {}) {
  return {
    body: {
      cliente: 'Cliente Test',
      fecha: '2026-09-23',
      total: 150,
      telefono: '0999999999',
      fecha_agendamiento: '2026-09-25',
      items: [{ material_id: 10, cantidad: 2, precio_unitario: 5 }],
      ...overrides.body,
    },
    user: {
      id: 25,
      rol: 'ADMIN',
      ...overrides.user,
    },
    empresaId: 7,
    ...overrides,
  };
}

describe('proforma handler - agendarPedido', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    service.isRecipeItems.mockReturnValue(false);
    service.isLegacyItems.mockReturnValue(false);
    service.safeDate.mockImplementation((d) => d || '2026-09-23');

    service.round2.mockImplementation((n) =>
      Math.round((Number(n) + Number.EPSILON) * 100) / 100
    );

    service.calcularPorRecetas.mockResolvedValue({
      fecha: '2026-09-23',
      cliente: 'Cliente Recetas',
      telefono: '0988888888',
      fecha_agendamiento: '2026-09-25',
      total: 250,
      materialesAgregados: [
        {
          material_id: 10,
          cantidad: 2,
          precio_unitario: 15,
        },
      ],
      items: [
        {
          trabajo_id: 3,
          color_id: 4,
          ancho: 1.2,
          alto: 2,
          cantidad: 1,
          detalle: 'Puerta',
          precio_unitario: 250.126,
          subtotal: 250.126,
        },
      ],
    });

    service.buildWhatsAppText.mockReturnValue('Texto WhatsApp');
  });

  it('debe rechazar una solicitud sin items y hacer rollback', async () => {
    const connection = createConnection();
    database.getConnection.mockResolvedValueOnce(connection);

    const req = createRequest({
      body: {
        items: [],
      },
    });
    const res = createResponse();

    await handlers.agendarPedido(req, res);

    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();

    expect(logger.error).toHaveBeenCalledWith(
      'PROFORMA_AGENDAR_ERROR',
      expect.objectContaining({
        event: 'proforma.agendar_error',
        message: 'Debe enviar al menos 1 item',
        userId: 25,
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Debe enviar al menos 1 item',
    });
  });

  describe('modo recetas', () => {

it('debe usar valores por defecto cuando los campos opcionales del modo recetas están vacíos', async () => {
  const connection = createConnection();
  database.getConnection.mockResolvedValueOnce(connection);

  service.isRecipeItems.mockReturnValue(true);
  service.calcularPorRecetas.mockResolvedValueOnce({
    fecha: '2026-09-24',
    cliente: 'Cliente receta',
    telefono: null,
    fecha_agendamiento: null,
    total: 150,
    items: [
      {
        trabajo_id: 3,
        color_id: null,
        ancho: 1.2,
        alto: 2,
        cantidad: 0,
        detalle: '',
        precio_unitario: null,
        subtotal: undefined,
      },
    ],
    materialesAgregados: [
      {
        material_id: 10,
        cantidad: 2,
        precio_unitario: 15,
      },
    ],
  });
  service.buildWhatsAppText.mockReturnValue('Texto WhatsApp');

  connection.query
    .mockResolvedValueOnce([{ insertId: 50 }]) // proforma
    .mockResolvedValueOnce([{ insertId: 60 }]) // proforma_items
    .mockResolvedValueOnce([{ insertId: 70 }]) // proforma_detalle
    .mockResolvedValueOnce([{ insertId: 80 }]) // pedido
    .mockResolvedValueOnce([{ insertId: 90 }]); // pedido_detalle

  const req = createRequest({
    body: {
      items: [{ trabajo_id: 3 }],
    },
  });
  const res = createResponse();

  await handlers.agendarPedido(req, res);

  expect(connection.query).toHaveBeenCalledTimes(5);

  expect(connection.query).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining('INSERT INTO proformas'),
    [7, '2026-09-24', 'Cliente receta', null, null, 150, 25]
  );

  expect(connection.query).toHaveBeenNthCalledWith(
    2,
    expect.stringContaining('INSERT INTO proforma_items'),
    [50, 3, null, 1.2, 2, 1, null, 0, 0]
  );

  expect(connection.query).toHaveBeenNthCalledWith(
    4,
    expect.stringContaining('INSERT INTO pedidos'),
    [7, '2026-09-24', 150, 25, 50]
  );

  expect(connection.commit).toHaveBeenCalled();
  expect(connection.release).toHaveBeenCalled();

  expect(res.status).toHaveBeenCalledWith(201);
});

it('debe rechazar el modo recetas cuando el cálculo no está disponible', async () => {
      const connection = createConnection();
      database.getConnection.mockResolvedValueOnce(connection);

      service.isRecipeItems.mockReturnValue(true);

      const handlerPath = require.resolve(
        `${process.cwd()}/src/modules/comercial/proforma/handlers/agendarPedido.js`
      );
      const originalModule = require.cache[handlerPath];
      const originalLoad = Module._load;
      const originalBuildWhatsAppText = service.buildWhatsAppText;

      try {
        service.buildWhatsAppText = null;
        delete require.cache[handlerPath];

        Module._load = function (request, parent, isMain) {
          if (request === '../../../../config/database.js') {
            return database;
          }

          if (request === '../../../../shared/utils/logger') {
            return logger;
          }

          if (request === '../proforma.service') {
            return service;
          }

          return originalLoad.call(this, request, parent, isMain);
        };

        const isolatedHandlers = require(handlerPath);

        const req = createRequest({
          body: {
            items: [{ trabajo_id: 3 }],
          },
        });
        const res = createResponse();

        await isolatedHandlers.agendarPedido(req, res);

        expect(connection.beginTransaction).toHaveBeenCalled();
        expect(connection.rollback).toHaveBeenCalled();
        expect(connection.release).toHaveBeenCalled();

        expect(logger.error).toHaveBeenCalledWith(
          'PROFORMA_AGENDAR_ERROR',
          expect.objectContaining({
            event: 'proforma.agendar_error',
            message: 'Modo recetas no disponible',
            userId: 25,
          })
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Modo recetas no disponible',
        });
      } finally {
        Module._load = originalLoad;
        service.buildWhatsAppText = originalBuildWhatsAppText;

        delete require.cache[handlerPath];

        if (originalModule) {
          require.cache[handlerPath] = originalModule;
        }
      }
    });

    it('debe agendar una proforma y pedido correctamente', async () => {
      const query = vi.fn()
        .mockResolvedValueOnce([{ insertId: 101 }])
        .mockResolvedValueOnce([{ insertId: 201 }])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{ insertId: 301 }])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);
      database.getConnection.mockResolvedValueOnce(connection);

      service.isRecipeItems.mockReturnValue(true);

      const req = createRequest({
        body: {
          items: [{ trabajo_id: 3 }],
        },
      });
      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(connection.beginTransaction).toHaveBeenCalled();
      expect(service.calcularPorRecetas).toHaveBeenCalledWith(
        connection,
        req.body
      );
      expect(service.buildWhatsAppText).toHaveBeenCalledWith(
        expect.objectContaining({ total: 250 })
      );
      expect(service.validarYRestarStock).toHaveBeenCalledWith(
        connection,
        expect.any(Array),
        expect.any(Array),
        7
      );

      expect(query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('INSERT INTO proformas'),
        [7, '2026-09-23', 'Cliente Recetas', '0988888888', '2026-09-25', 250, 25]
      );

      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO proforma_items'),
        [101, 3, 4, 1.2, 2, 1, 'Puerta', 250.13, 250.13]
      );

      expect(query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('INSERT INTO proforma_detalle'),
        [101, 10, 2, 15]
      );

      expect(query).toHaveBeenNthCalledWith(
        4,
        expect.stringContaining('INSERT INTO pedidos'),
        [7, '2026-09-25', 250, 25, 101]
      );

      expect(query).toHaveBeenNthCalledWith(
        5,
        expect.stringContaining('INSERT INTO pedido_detalle'),
        [301, 10, 2, 15]
      );

      expect(connection.commit).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'PROFORMA_AGENDADA',
        expect.objectContaining({
          proformaId: 101,
          pedidoId: 301,
          userId: 25,
          empresaId: 7,
          total: 250,
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Agendado correctamente',
          proforma_id: 101,
          pedido_id: 301,
          data: expect.objectContaining({
            whatsapp_text: 'Texto WhatsApp',
          }),
        })
      );

      expect(connection.release).toHaveBeenCalled();
    });

    it('no debe descontar stock cuando el usuario es CLIENTE', async () => {
      const query = vi.fn()
        .mockResolvedValueOnce([{ insertId: 102 }])
        .mockResolvedValueOnce([{ insertId: 202 }])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{ insertId: 302 }])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);
      database.getConnection.mockResolvedValueOnce(connection);

      service.isRecipeItems.mockReturnValue(true);

      const req = createRequest({
        user: {
          id: 30,
          rol: 'CLIENTE',
        },
        body: {
          items: [{ trabajo_id: 3 }],
        },
      });
      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(service.validarYRestarStock).not.toHaveBeenCalled();
      expect(connection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe continuar si falla la inserción de proforma_items y registrar warning', async () => {
      const query = vi.fn()
        .mockResolvedValueOnce([{ insertId: 103 }])
        .mockRejectedValueOnce(new Error('proforma_items error'))
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{ insertId: 303 }])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);
      database.getConnection.mockResolvedValueOnce(connection);

      service.isRecipeItems.mockReturnValue(true);

      const req = createRequest({
        body: {
          items: [{ trabajo_id: 3 }],
        },
      });
      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(logger.warn).toHaveBeenCalledWith(
        'PROFORMA_ITEMS_INSERT_WARN',
        {
          event: 'proforma.items_insert_warning',
          message: 'proforma_items error',
        }
      );

      expect(connection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          proforma_id: 103,
          pedido_id: 303,
        })
      );
    });

    it('debe usar fallback al insertar pedido si falla con proforma_id', async () => {
      const query = vi.fn()
        .mockResolvedValueOnce([{ insertId: 104 }])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}])
        .mockRejectedValueOnce(new Error('Unknown column proforma_id'))
        .mockResolvedValueOnce([{ insertId: 304 }])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);
      database.getConnection.mockResolvedValueOnce(connection);

      service.isRecipeItems.mockReturnValue(true);

      service.calcularPorRecetas.mockImplementationOnce(async () => ({
        fecha: '2026-09-23',
        cliente: 'Cliente Recetas',
        telefono: '0988888888',
        fecha_agendamiento: null,
        total: 250,
        materialesAgregados: [
          {
            material_id: 10,
            cantidad: 2,
            precio_unitario: 15,
          },
        ],
        items: [
          {
            trabajo_id: 3,
            color_id: 4,
            ancho: 1.2,
            alto: 2,
            cantidad: 1,
            detalle: 'Puerta',
            precio_unitario: 250.126,
            subtotal: 250.126,
          },
        ],
      }));



      const req = createRequest({
        body: {
          items: [{ trabajo_id: 3 }],
        },
      });
      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(query).toHaveBeenNthCalledWith(
        5,
        expect.stringContaining(
          'INSERT INTO pedidos (empresa_id, fecha, estado, total, usuario_id, created_at, updated_at)'
        ),
        [7, '2026-09-23', 250, 25]
      );

      expect(connection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pedido_id: 304,
        })
      );
    });
  });

  describe('modo legacy', () => {
    it('debe agendar correctamente una proforma legacy', async () => {
      const query = vi.fn()
        .mockResolvedValueOnce([{ insertId: 105 }])
        .mockResolvedValueOnce([{ insertId: 305 }])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);
      database.getConnection.mockResolvedValueOnce(connection);

      service.isLegacyItems.mockReturnValue(true);

      const req = createRequest({
        body: {
          cliente: '  Cliente Legacy  ',
          fecha: '2026-09-24',
          total: '180',
          telefono: ' 0991234567 ',
          fecha_agendamiento: '2026-09-26',
          items: [
            {
              material_id: 10,
              cantidad: '2',
              precio_unitario: '25.50',
            },
          ],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(service.validarYRestarStockLegacy).toHaveBeenCalledWith(
        connection,
        req.body.items,
        7
      );

      expect(query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('INSERT INTO proformas'),
        [7, '2026-09-24', 'Cliente Legacy', '0991234567', '2026-09-26', 180, 25]
      );

      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO pedidos'),
        [7, '2026-09-24', 180, 25, 105]
      );

      expect(query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('INSERT INTO proforma_detalle'),
        [105, 10, 2, 25.5]
      );

      expect(query).toHaveBeenNthCalledWith(
        4,
        expect.stringContaining('INSERT INTO pedido_detalle'),
        [305, 10, 2, 25.5]
      );

      expect(connection.commit).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'PROFORMA_AGENDADA_LEGACY',
        expect.objectContaining({
          proformaId: 105,
          pedidoId: 305,
          userId: 25,
          empresaId: 7,
          total: 180,
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Agendado en modo legacy correctamente',
        proforma_id: 105,
        pedido_id: 305,
      });
    });

    it('no debe descontar stock para un CLIENTE', async () => {
      const query = vi.fn()
        .mockResolvedValueOnce([{ insertId: 106 }])
        .mockResolvedValueOnce([{ insertId: 306 }])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);
      database.getConnection.mockResolvedValueOnce(connection);

      service.isLegacyItems.mockReturnValue(true);

      const req = createRequest({
        user: {
          id: 31,
          rol: 'CLIENTE',
        },
        body: {
          cliente: 'Cliente Cliente',
          items: [
            {
              material_id: 10,
              cantidad: 1,
              precio_unitario: 20,
            },
          ],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(service.validarYRestarStockLegacy).not.toHaveBeenCalled();
      expect(connection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe usar fallback de pedido en modo legacy', async () => {
      const query = vi.fn()
        .mockResolvedValueOnce([{ insertId: 107 }])
        .mockRejectedValueOnce(new Error('proforma_id no existe'))
        .mockResolvedValueOnce([{ insertId: 307 }])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}]);

      const connection = createConnection(query);
      database.getConnection.mockResolvedValueOnce(connection);

      service.isLegacyItems.mockReturnValue(true);

      const req = createRequest({
        body: {
            cliente: 'Cliente Fallback',
            total: 150,
            items: [
            {
              material_id: 10,
              cantidad: 1,
              precio_unitario: 20,
            },
          ],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining(
          'INSERT INTO pedidos (empresa_id, fecha, estado, total, usuario_id, created_at, updated_at)'
        ),
        [7, '2026-09-23', 150, 25]
      );

      expect(connection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pedido_id: 307,
        })
      );
    });

    it('debe rechazar cliente vacío', async () => {
      const connection = createConnection();
      database.getConnection.mockResolvedValueOnce(connection);

      service.isLegacyItems.mockReturnValue(true);

      const req = createRequest({
        body: {
          cliente: '   ',
          items: [
            {
              material_id: 10,
              cantidad: 1,
              precio_unitario: 20,
            },
          ],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(connection.rollback).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'PROFORMA_AGENDAR_ERROR',
        expect.objectContaining({
          event: 'proforma.agendar_error',
          message: 'Cliente es requerido',
          userId: 25,
        })
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cliente es requerido',
      });
      expect(connection.release).toHaveBeenCalled();
    });

    it('debe rechazar material_id faltante en legacy', async () => {
      const query = vi.fn()
        .mockResolvedValueOnce([{ insertId: 108 }])
        .mockResolvedValueOnce([{ insertId: 308 }]);

      const connection = createConnection(query);
      database.getConnection.mockResolvedValueOnce(connection);

      service.isLegacyItems.mockReturnValue(true);

      const req = createRequest({
        body: {
            cliente: 'Cliente Test',
          items: [
            {
              cantidad: 1,
              precio_unitario: 20,
            },
          ],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(connection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Falta material_id en item #1',
      });
    });

    it('debe rechazar cantidad inválida en legacy', async () => {
      const query = vi.fn()
        .mockResolvedValueOnce([{ insertId: 109 }])
        .mockResolvedValueOnce([{ insertId: 309 }]);

      const connection = createConnection(query);
      database.getConnection.mockResolvedValueOnce(connection);

      service.isLegacyItems.mockReturnValue(true);

      const req = createRequest({
        body: {
            cliente: 'Cliente Test',
          items: [
            {
              material_id: 10,
              cantidad: 0,
              precio_unitario: 20,
            },
          ],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(connection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cantidad invalida en item #1',
      });
    });

    it('debe rechazar precio inválido en legacy', async () => {
      const query = vi.fn()
        .mockResolvedValueOnce([{ insertId: 110 }])
        .mockResolvedValueOnce([{ insertId: 310 }]);

      const connection = createConnection(query);
      database.getConnection.mockResolvedValueOnce(connection);

      service.isLegacyItems.mockReturnValue(true);

      const req = createRequest({
        body: {
            cliente: 'Cliente Test',
          items: [
            {
              material_id: 10,
              cantidad: 1,
              precio_unitario: -5,
            },
          ],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(connection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Precio invalido en item #1',
      });
    });
  });

  describe('validaciones generales y errores', () => {
    it('debe rechazar items inexistentes', async () => {
      const connection = createConnection();
      database.getConnection.mockResolvedValueOnce(connection);

      const req = createRequest({
        body: {
          items: [],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(connection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Debe enviar al menos 1 item',
      });
      expect(connection.release).toHaveBeenCalled();
    });

    it('debe rechazar items que no sean un modo válido', async () => {
      const connection = createConnection();
      database.getConnection.mockResolvedValueOnce(connection);

      const req = createRequest({
        body: {
          items: [{ nombre: 'item inválido' }],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(connection.rollback).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'PROFORMA_AGENDAR_ERROR',
        expect.objectContaining({
          message:
            'Items invalidos: debe ser modo recetas (trabajo_id) o modo legacy (material_id)',
        })
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error:
          'Items invalidos: debe ser modo recetas (trabajo_id) o modo legacy (material_id)',
      });
      expect(connection.release).toHaveBeenCalled();
    });

    it('debe hacer rollback cuando falla el cálculo de recetas', async () => {
      const connection = createConnection();
      database.getConnection.mockResolvedValueOnce(connection);

      service.isRecipeItems.mockReturnValue(true);
      service.calcularPorRecetas.mockRejectedValueOnce(
        new Error('Error calculando receta')
      );

      const req = createRequest({
        body: {
          items: [{ trabajo_id: 3 }],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(connection.rollback).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'PROFORMA_AGENDAR_ERROR',
        expect.objectContaining({
          message: 'Error calculando receta',
        })
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error calculando receta',
      });
      expect(connection.release).toHaveBeenCalled();
    });

    it('debe hacer rollback cuando falla el descuento de stock en recetas', async () => {
      const connection = createConnection();
      database.getConnection.mockResolvedValueOnce(connection);

      service.isRecipeItems.mockReturnValue(true);
      service.validarYRestarStock.mockRejectedValueOnce(
        new Error('Stock insuficiente')
      );

      const req = createRequest({
        body: {
          items: [{ trabajo_id: 3 }],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(connection.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Stock insuficiente',
      });
      expect(connection.release).toHaveBeenCalled();
    });

    it('debe hacer rollback cuando falla una consulta de base de datos', async () => {
      const query = vi.fn().mockRejectedValueOnce(
        new Error('DB error')
      );

      const connection = createConnection(query);
      database.getConnection.mockResolvedValueOnce(connection);

      service.isLegacyItems.mockReturnValue(true);

      const req = createRequest({
        body: {
            cliente: 'Cliente Error',
          items: [
            {
              material_id: 10,
              cantidad: 1,
              precio_unitario: 20,
            },
          ],
        },
      });

      const res = createResponse();

      await handlers.agendarPedido(req, res);

      expect(connection.rollback).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'PROFORMA_AGENDAR_ERROR',
        expect.objectContaining({
          event: 'proforma.agendar_error',
          message: 'DB error',
          userId: 25,
        })
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'DB error',
      });
      expect(connection.release).toHaveBeenCalled();
    });
  });
});
