import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const database = {
  query: vi.fn(),
};

const Pedido = {
  create: vi.fn(),
  cancelar: vi.fn(),
};

const logger = {
  error: vi.fn(),
  info: vi.fn(),
};

const softDelete = vi.fn();

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../config/database.js') return database;
  if (request === './pedido.repository') return Pedido;
  if (request === '../../../shared/utils/logger') return logger;
  if (request === '../../../shared/utils/softDelete') return { softDelete };

  return originalLoad.call(this, request, parent, isMain);
};

const controller = require(
  `${process.cwd()}/src/modules/comercial/pedido/pedido.controller.js`
);

Module._load = originalLoad;

function mockRes() {
  const res = {};

  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);

  return res;
}

function mockReq(overrides = {}) {
  return {
    query: {},
    params: {},
    body: {},
    empresaId: 10,
    user: {
      id: 25,
      nombre: 'Usuario Test',
    },
    filtroUsuario: {},
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// getAllPedidos
// ============================================================

describe('getAllPedidos', () => {
  it('debe listar pedidos para todos los usuarios', async () => {
    database.query.mockResolvedValueOnce([[
      {
        id: 3,
        fecha: '2026-09-23',
        estado: 'PENDIENTE',
        total: 150,
        proforma_id: 8,
        usuario_id: 25,
        cliente: null,
        trabajos_nombres: 'Puerta & Ventana',
      },
    ]]);

    const req = mockReq({
      query: {
        limit: '20',
        offset: '5',
      },
    });
    const res = mockRes();

    await controller.getAllPedidos(req, res);

    expect(database.query).toHaveBeenCalledTimes(1);
    expect(database.query.mock.calls[0][1]).toEqual([
      10,
      20,
      5,
    ]);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 3,
        cliente: '',
        trabajos_nombres: 'Puerta &amp; Ventana',
      }),
    ]);
  });

  it('debe aplicar filtro de usuario cuando soloPropio está activo', async () => {
    database.query.mockResolvedValueOnce([[]]);

    const req = mockReq({
      query: {
        limit: '200',
        offset: '-5',
      },
      filtroUsuario: {
        soloPropio: true,
        usuarioId: 99,
      },
    });
    const res = mockRes();

    await controller.getAllPedidos(req, res);

    expect(database.query.mock.calls[0][1]).toEqual([
      10,
      99,
      100,
      0,
    ]);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('debe usar valores por defecto cuando limit y offset no son válidos', async () => {
    database.query.mockResolvedValueOnce([[]]);

    const req = mockReq({
      query: {
        limit: 'abc',
        offset: 'abc',
      },
    });
    delete req.filtroUsuario;
    const res = mockRes();

    await controller.getAllPedidos(req, res);

    expect(database.query.mock.calls[0][1]).toEqual([
      10,
      50,
      0,
    ]);
  });

  it('debe responder 500 cuando ocurre un error', async () => {
    database.query.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await controller.getAllPedidos(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'PEDIDO_GET_ALL',
      expect.objectContaining({
        event: 'pedido.getAll_error',
        message: 'DB error',
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});

// ============================================================
// getPedidosByEstado
// ============================================================


describe('getPedidosByEstado', () => {
  it('debe rechazar un estado inválido', async () => {
    const req = mockReq({
      params: {
        estado: 'desconocido',
      },
    });
    const res = mockRes();

    await controller.getPedidosByEstado(req, res);

    expect(database.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        'Estado inválido. Use: PENDIENTE, PROCESADO, ENTREGADO o CANCELADO',
    });
  });

  it('debe aceptar estados válidos ignorando mayúsculas/minúsculas', async () => {
    database.query.mockResolvedValueOnce([[
      {
        id: 5,
        cliente: 'Ana "Test"',
        trabajos_nombres: "Cortina's / Vidrio",
      },
    ]]);

    const req = mockReq({
      params: {
        estado: 'pendiente',
      },
    });
    const res = mockRes();

    await controller.getPedidosByEstado(req, res);

    expect(database.query).toHaveBeenCalledWith(
      expect.any(String),
      [10, 'PENDIENTE']
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        cliente: 'Ana &quot;Test&quot;',
        trabajos_nombres: 'Cortina&#x27;s &#x2F; Vidrio',
      }),
    ]);
  });

  it('debe responder 500 cuando falla la consulta', async () => {
    database.query.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({
      params: {
        estado: 'PROCESADO',
      },
    });
    const res = mockRes();

    await controller.getPedidosByEstado(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'PEDIDO_GET_BY_ESTADO',
      expect.objectContaining({
        event: 'pedido.getByEstado_error',
        estado: 'PROCESADO',
        message: 'DB error',
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});

// ============================================================
// getPedidoById
// ============================================================

describe('getPedidoById', () => {
  it('debe rechazar un ID inválido', async () => {
    const req = mockReq({
      params: {
        id: 'abc',
      },
    });
    const res = mockRes();

    await controller.getPedidoById(req, res);

    expect(database.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'ID inválido',
    });
  });

  it('debe rechazar un ID menor o igual a cero', async () => {
    const req = mockReq({
      params: {
        id: '0',
      },
    });
    const res = mockRes();

    await controller.getPedidoById(req, res);

    expect(database.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('debe aplicar el filtro de usuario cuando soloPropio está activo', async () => {
    database.query.mockResolvedValueOnce([[]]);

    const req = mockReq({
      params: {
        id: '7',
      },
      filtroUsuario: {
        soloPropio: true,
        usuarioId: 77,
      },
    });
    const res = mockRes();

    await controller.getPedidoById(req, res);

    expect(database.query).toHaveBeenCalledWith(
      expect.any(String),
      ['7', 10, 77]
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Pedido no encontrado',
    });
  });

  it('debe responder 404 cuando el pedido no existe', async () => {
    database.query.mockResolvedValueOnce([[]]);

    const req = mockReq({
      params: {
        id: '8',
      },
    });
    const res = mockRes();

    await controller.getPedidoById(req, res);

    expect(database.query).toHaveBeenCalledWith(
      expect.any(String),
      ['8', 10]
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Pedido no encontrado',
    });
  });

  it('debe obtener un pedido sin proforma y devolver items vacíos', async () => {
    database.query.mockResolvedValueOnce([[
      {
        id: 8,
        fecha: '2026-09-23',
        estado: 'PENDIENTE',
        total: 200,
        proforma_id: null,
        usuario_id: 25,
        cliente: '<Juan>',
        telefono: '099',
        trabajos_nombres: 'Puerta & Ventana',
      },
    ]]);

    const req = mockReq({
      params: {
        id: '8',
      },
    });
    const res = mockRes();

    await controller.getPedidoById(req, res);

    expect(database.query).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 8,
      fecha: '2026-09-23',
      estado: 'PENDIENTE',
      total: 200,
      proforma_id: null,
      usuario_id: 25,
      cliente: '&lt;Juan&gt;',
      telefono: '099',
      trabajos_nombres: 'Puerta &amp; Ventana',
      items: [],
    });
  });

  it('debe obtener un pedido con proforma y sanitizar sus items', async () => {
    database.query
      .mockResolvedValueOnce([[
        {
          id: 9,
          fecha: '2026-09-23',
          estado: 'PROCESADO',
          total: 350,
          proforma_id: 30,
          usuario_id: 25,
          cliente: '<Cliente>',
          telefono: '098',
          trabajos_nombres: 'Ventana',
        },
      ]])
      .mockResolvedValueOnce([[
        {
          id: 1,
          ancho: 1.2,
          alto: 2,
          cantidad: 2,
          detalle: '<Detalle>',
          trabajo_id: 4,
          trabajo_nombre: 'Puerta & Ventana',
          color_id: 2,
          color_nombre: 'Negro "Mate"',
          color_hex: '#000000',
        },
      ]]);

    const req = mockReq({
      params: {
        id: '9',
      },
    });
    const res = mockRes();

    await controller.getPedidoById(req, res);

    expect(database.query).toHaveBeenCalledTimes(2);
    expect(database.query.mock.calls[1][1]).toEqual([30]);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 9,
      fecha: '2026-09-23',
      estado: 'PROCESADO',
      total: 350,
      proforma_id: 30,
      usuario_id: 25,
      cliente: '&lt;Cliente&gt;',
      telefono: '098',
      trabajos_nombres: 'Ventana',
      items: [
        {
          id: 1,
          ancho: 1.2,
          alto: 2,
          cantidad: 2,
          detalle: '&lt;Detalle&gt;',
          trabajo_id: 4,
          trabajo_nombre: 'Puerta &amp; Ventana',
          color_id: 2,
          color_nombre: 'Negro &quot;Mate&quot;',
          color_hex: '#000000',
        },
      ],
    });
  });

  it('debe responder 500 cuando ocurre un error', async () => {
    database.query.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({
      params: {
        id: '10',
      },
    });
    const res = mockRes();

    await controller.getPedidoById(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'PEDIDO_GET_BY_ID',
      expect.objectContaining({
        event: 'pedido.getById_error',
        pedidoId: '10',
        message: 'DB error',
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al obtener pedido',
    });
  });
});

// ============================================================
// createPedido
// ============================================================

describe('createPedido', () => {
  it('debe rechazar un total inválido', async () => {
    const req = mockReq({
      body: {
        total: 0,
      },
    });
    const res = mockRes();

    await controller.createPedido(req, res);

    expect(Pedido.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Total inválido',
    });
  });

  it('debe crear un pedido con los valores proporcionados', async () => {
    const pedidoCreado = {
      id: 20,
      total: 150,
      estado: 'PENDIENTE',
    };

    Pedido.create.mockResolvedValueOnce(pedidoCreado);

    const fecha = '2026-09-23';

    const req = mockReq({
      body: {
        fecha,
        estado: 'PROCESADO',
        total: 150,
        proforma_id: 12,
        observaciones: 'Observación',
        detalles: [
          {
            material_id: 1,
            cantidad: 2,
          },
        ],
      },
    });
    const res = mockRes();

    await controller.createPedido(req, res);

    expect(Pedido.create).toHaveBeenCalledWith({
      empresa_id: 10,
      fecha,
      estado: 'PROCESADO',
      total: 150,
      proforma_id: 12,
      observaciones: 'Observación',
      detalles: [
        {
          material_id: 1,
          cantidad: 2,
        },
      ],
      usuario_id: 25,
    });

    expect(logger.info).toHaveBeenCalledWith(
      'PEDIDO_CREATED',
      expect.objectContaining({
        event: 'pedido.created',
        pedidoId: 20,
        userId: 25,
        empresaId: 10,
        total: 150,
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Pedido creado correctamente',
      data: pedidoCreado,
    });
  });

  it('debe aplicar valores por defecto al crear el pedido', async () => {
    Pedido.create.mockResolvedValueOnce({
      id: 21,
    });

    const req = mockReq({
      body: {
        total: 100,
      },
    });
    const res = mockRes();

    await controller.createPedido(req, res);

    const args = Pedido.create.mock.calls[0][0];

    expect(args.empresa_id).toBe(10);
    expect(args.estado).toBe('PENDIENTE');
    expect(args.total).toBe(100);
    expect(args.proforma_id).toBeNull();
    expect(args.observaciones).toBeNull();
    expect(args.detalles).toEqual([]);
    expect(args.usuario_id).toBe(25);
    expect(args.fecha).toBeInstanceOf(Date);
  });

  it('debe responder 500 cuando falla la creación', async () => {
    Pedido.create.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({
      body: {
        total: 100,
      },
    });
    const res = mockRes();

    await controller.createPedido(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'PEDIDO_CREATE_ERROR',
      expect.objectContaining({
        event: 'pedido.create_error',
        message: 'DB error',
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al crear pedido',
    });
  });
});

// ============================================================
// updateEstado
// ============================================================

describe('updateEstado', () => {
  it('debe rechazar un ID inválido', async () => {
    const req = mockReq({
      params: {
        id: 'abc',
      },
      body: {
        estado: 'PROCESADO',
      },
    });
    const res = mockRes();

    await controller.updateEstado(req, res);

    expect(database.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'ID inválido',
    });
  });

  it('debe rechazar un estado inválido', async () => {
    const req = mockReq({
      params: {
        id: '1',
      },
      body: {
        estado: 'INVALIDO',
      },
    });
    const res = mockRes();

    await controller.updateEstado(req, res);

    expect(database.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        'Estado inválido. Use: PENDIENTE, PROCESADO, ENTREGADO o CANCELADO',
    });
  });

  it('debe rechazar cuando el pedido no existe', async () => {
    database.query.mockResolvedValueOnce([[]]);

    const req = mockReq({
      params: {
        id: '2',
      },
      body: {
        estado: 'PROCESADO',
      },
    });
    const res = mockRes();

    await controller.updateEstado(req, res);

    expect(database.query).toHaveBeenCalledWith(
      'SELECT estado FROM pedidos WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL',
      ['2', 10]
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Pedido no encontrado',
    });
  });

  it('debe rechazar una transición no permitida', async () => {
    database.query.mockResolvedValueOnce([[
      {
        estado: 'ENTREGADO',
      },
    ]]);

    const req = mockReq({
      params: {
        id: '3',
      },
      body: {
        estado: 'CANCELADO',
      },
    });
    const res = mockRes();

    await controller.updateEstado(req, res);

    expect(database.query).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No se puede cambiar de ENTREGADO a CANCELADO.',
    });
  });

  it('debe cancelar el pedido mediante Pedido.cancelar', async () => {
    database.query.mockResolvedValueOnce([[
      {
        estado: 'PROCESADO',
      },
    ]]);

    Pedido.cancelar.mockResolvedValueOnce(true);

    const req = mockReq({
      params: {
        id: '4',
      },
      body: {
        estado: 'cancelado',
      },
    });
    const res = mockRes();

    await controller.updateEstado(req, res);

    expect(Pedido.cancelar).toHaveBeenCalledWith(4, 10);

    expect(logger.info).toHaveBeenCalledWith(
      'PEDIDO_CANCELADO',
      expect.objectContaining({
        event: 'pedido.cancelled',
        pedidoId: '4',
        userId: 25,
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Pedido cancelado y stock restaurado correctamente',
      estado_anterior: 'PROCESADO',
      estado_nuevo: 'CANCELADO',
    });
  });

  it('debe responder 404 si Pedido.cancelar devuelve false', async () => {
    database.query.mockResolvedValueOnce([[
      {
        estado: 'PENDIENTE',
      },
    ]]);

    Pedido.cancelar.mockResolvedValueOnce(false);

    const req = mockReq({
      params: {
        id: '5',
      },
      body: {
        estado: 'CANCELADO',
      },
    });
    const res = mockRes();

    await controller.updateEstado(req, res);

    expect(Pedido.cancelar).toHaveBeenCalledWith(5, 10);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Pedido no encontrado',
    });
  });

  it('debe actualizar normalmente de PENDIENTE a PROCESADO', async () => {
    database.query
      .mockResolvedValueOnce([[
        {
          estado: 'PENDIENTE',
        },
      ]])
      .mockResolvedValueOnce([{
        affectedRows: 1,
      }]);

    const req = mockReq({
      params: {
        id: '6',
      },
      body: {
        estado: 'procesado',
      },
    });
    const res = mockRes();

    await controller.updateEstado(req, res);

    expect(database.query).toHaveBeenNthCalledWith(
      2,
      'UPDATE pedidos SET estado = ?, updated_at = NOW() WHERE id = ? AND empresa_id = ?',
      ['PROCESADO', '6', 10]
    );

    expect(logger.info).toHaveBeenCalledWith(
      'PEDIDO_ESTADO_UPDATE',
      expect.objectContaining({
        event: 'pedido.estado_updated',
        pedidoId: '6',
        estadoAnterior: 'PENDIENTE',
        estadoNuevo: 'PROCESADO',
        userId: 25,
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Estado actualizado correctamente',
      estado_anterior: 'PENDIENTE',
      estado_nuevo: 'PROCESADO',
    });
  });

  it('debe responder 404 si el UPDATE no afecta filas', async () => {
    database.query
      .mockResolvedValueOnce([[
        {
          estado: 'PENDIENTE',
        },
      ]])
      .mockResolvedValueOnce([{
        affectedRows: 0,
      }]);

    const req = mockReq({
      params: {
        id: '7',
      },
      body: {
        estado: 'PROCESADO',
      },
    });
    const res = mockRes();

    await controller.updateEstado(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Pedido no encontrado',
    });
  });

  it('debe responder 500 si ocurre un error', async () => {
    database.query.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({
      params: {
        id: '8',
      },
      body: {
        estado: 'PROCESADO',
      },
    });
    const res = mockRes();

    await controller.updateEstado(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'PEDIDO_UPDATE_ESTADO_ERROR',
      expect.objectContaining({
        event: 'pedido.updateEstado_error',
        pedidoId: '8',
        message: 'DB error',
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al actualizar estado',
    });
  });
});

// ============================================================
// deletePedido
// ============================================================

describe('deletePedido', () => {
  it('debe rechazar un ID inválido', async () => {
    const req = mockReq({
      params: {
        id: 'abc',
      },
    });
    const res = mockRes();

    await controller.deletePedido(req, res);

    expect(database.query).not.toHaveBeenCalled();
    expect(softDelete).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'ID de pedido inválido',
    });
  });

  it('debe responder 404 cuando el pedido no existe', async () => {
    database.query.mockResolvedValueOnce([[]]);

    const req = mockReq({
      params: {
        id: '10',
      },
    });
    const res = mockRes();

    await controller.deletePedido(req, res);

    expect(database.query).toHaveBeenCalledWith(
      'SELECT id FROM pedidos WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL',
      ['10', 10]
    );

    expect(softDelete).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Pedido no encontrado',
    });
  });

  it('debe ejecutar soft delete correctamente', async () => {
    database.query.mockResolvedValueOnce([[
      {
        id: 11,
      },
    ]]);

    softDelete.mockResolvedValueOnce(undefined);

    const req = mockReq({
      params: {
        id: '11',
      },
    });
    const res = mockRes();

    await controller.deletePedido(req, res);

    expect(softDelete).toHaveBeenCalledWith(
      database,
      'pedidos',
      '11'
    );

    expect(logger.info).toHaveBeenCalledWith(
      'PEDIDO_SOFT_DELETE',
      expect.objectContaining({
        event: 'pedido.deleted',
        pedidoId: '11',
        userId: 25,
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Pedido eliminado correctamente',
    });
  });

  it('debe responder 500 si falla la consulta o el soft delete', async () => {
    database.query.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({
      params: {
        id: '12',
      },
    });
    const res = mockRes();

    await controller.deletePedido(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'PEDIDO_DELETE_ERROR',
      expect.objectContaining({
        event: 'pedido.delete_error',
        pedidoId: '12',
        message: 'DB error',
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al eliminar pedido',
    });
  });

  it('debe responder 500 si softDelete lanza un error', async () => {
    database.query.mockResolvedValueOnce([[
      {
        id: 13,
      },
    ]]);

    softDelete.mockRejectedValueOnce(new Error('Soft delete error'));

    const req = mockReq({
      params: {
        id: '13',
      },
    });
    const res = mockRes();

    await controller.deletePedido(req, res);

    expect(softDelete).toHaveBeenCalledWith(
      database,
      'pedidos',
      '13'
    );

    expect(logger.error).toHaveBeenCalledWith(
      'PEDIDO_DELETE_ERROR',
      expect.objectContaining({
        event: 'pedido.delete_error',
        pedidoId: '13',
        message: 'Soft delete error',
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al eliminar pedido',
    });
  });
});
