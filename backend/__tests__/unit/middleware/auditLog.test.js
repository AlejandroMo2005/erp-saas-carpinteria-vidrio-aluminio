import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
};

const logger = {
  warn: vi.fn(),
};

const originalLoad = Module._load;

const databasePath = require.resolve(
  `${process.cwd()}/src/config/database.js`
);

const loggerPath = require.resolve(
  `${process.cwd()}/src/shared/utils/logger.js`
);

const auditLogPath = require.resolve(
  `${process.cwd()}/src/shared/middleware/auditLog.js`
);

delete require.cache[auditLogPath];

Module._load = function (request, parent, isMain) {
  if (
    request === '../../config/database.js' ||
    request === databasePath
  ) {
    return db;
  }

  if (
    request === '../utils/logger' ||
    request === loggerPath
  ) {
    return logger;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const {
  auditarOperacion,
  registrarAuditoria,
} = require(auditLogPath);

Module._load = originalLoad;

beforeEach(() => {
  vi.clearAllMocks();
});

function createResponse(statusCode = 200) {
  const res = {
    statusCode,
    json: vi.fn(function (body) {
      return {
        original: true,
        body,
      };
    }),
  };

  return res;
}

function createRequest(overrides = {}) {
  return {
    method: 'GET',
    path: '/test',
    params: {},
    body: {},
    user: {
      id: 10,
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
    },
    ip: '192.168.1.10',
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
    ...overrides,
  };
}

describe('auditarOperacion', () => {
  it('debe continuar sin interceptar res.json para métodos distintos de DELETE, PATCH y PUT', () => {
    const req = createRequest({
      method: 'GET',
    });
    const res = createResponse();
    const jsonOriginal = res.json;
    const next = vi.fn();

    auditarOperacion('clientes')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.json).toBe(jsonOriginal);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('debe interceptar DELETE y registrar auditoría cuando la respuesta es 2xx', async () => {
    const req = createRequest({
      method: 'DELETE',
      path: '/clientes/25',
      params: {
        id: '25',
      },
    });
    const res = createResponse(200);
    const next = vi.fn();

    auditarOperacion('clientes')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const resultado = res.json({
      success: true,
      message: 'Cliente eliminado',
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(resultado).toEqual({
      original: true,
      body: {
        success: true,
        message: 'Cliente eliminado',
      },
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO auditoria_acciones'),
      [
        10,
        'Juan Pérez',
        'DELETE',
        'clientes',
        '25',
        expect.any(String),
        '192.168.1.10',
        'Mozilla/5.0',
      ]
    );

    const detalle = JSON.parse(db.query.mock.calls[0][1][5]);

    expect(detalle).toEqual({
      method: 'DELETE',
      path: '/clientes/25',
      params: {
        id: '25',
      },
      body: undefined,
      respuesta: 'Cliente eliminado',
    });
  });

  it('debe detectar ANULADA mediante estado en PATCH', async () => {
    const req = createRequest({
      method: 'PATCH',
      path: '/facturas/30',
      params: {
        id: '30',
      },
      body: {
        estado: 'ANULADA',
      },
    });
    const res = createResponse(200);
    const next = vi.fn();

    auditarOperacion('facturas')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    res.json({
      success: true,
      message: 'Factura anulada',
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(db.query).toHaveBeenCalledTimes(1);

    const values = db.query.mock.calls[0][1];

    expect(values[2]).toBe('ANULACION');
    expect(values[3]).toBe('facturas');
    expect(values[4]).toBe('30');

    const detalle = JSON.parse(values[5]);

    expect(detalle.body).toEqual({
      estado: 'ANULADA',
    });
  });

  it('debe detectar ANULADO mediante status en PUT sin importar mayúsculas', async () => {
    const req = createRequest({
      method: 'PUT',
      params: {
        facturaId: '31',
      },
      body: {
        status: 'anulado',
      },
    });
    const res = createResponse(204);
    const next = vi.fn();

    auditarOperacion('facturas')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    res.json({
      success: true,
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1][2]).toBe('ANULACION');
    expect(db.query.mock.calls[0][1][4]).toBe('31');
  });

  it('debe detectar CANCELADA mediante estado_factura', async () => {
    const req = createRequest({
      method: 'PATCH',
      params: {
        pedidoId: '40',
      },
      body: {
        estado_factura: 'CANCELADA',
      },
    });
    const res = createResponse(200);
    const next = vi.fn();

    auditarOperacion('facturas')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    res.json({
      message: 'Cancelada',
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1][2]).toBe('ANULACION');
    expect(db.query.mock.calls[0][1][4]).toBe('40');
  });

  it('debe continuar sin auditar PATCH que no representa una anulación', () => {
    const req = createRequest({
      method: 'PATCH',
      body: {
        estado: 'EMITIDA',
      },
    });
    const res = createResponse();
    const jsonOriginal = res.json;
    const next = vi.fn();

    auditarOperacion('facturas')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.json).toBe(jsonOriginal);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('debe continuar sin auditar PUT sin body', () => {
    const req = createRequest({
      method: 'PUT',
      body: undefined,
    });
    const res = createResponse();
    const next = vi.fn();

    auditarOperacion('facturas')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('debe ignorar DELETE cuando la respuesta no es 2xx', async () => {
    const req = createRequest({
      method: 'DELETE',
      params: {
        id: '50',
      },
    });
    const res = createResponse(400);
    const next = vi.fn();

    auditarOperacion('clientes')(req, res, next);

    res.json({
      success: false,
      message: 'No permitido',
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(db.query).not.toHaveBeenCalled();
  });

  it('debe ignorar DELETE cuando la respuesta es 3xx', async () => {
    const req = createRequest({
      method: 'DELETE',
      params: {
        id: '51',
      },
    });
    const res = createResponse(300);
    const next = vi.fn();

    auditarOperacion('clientes')(req, res, next);

    res.json({
      message: 'Redirección',
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(db.query).not.toHaveBeenCalled();
  });

  it('debe usar facturaId, pedidoId y data.id como alternativas de registro', async () => {
    const req = createRequest({
      method: 'DELETE',
      params: {
        facturaId: '60',
      },
    });
    const res = createResponse(200);
    const next = vi.fn();

    auditarOperacion('facturas')(req, res, next);
    res.json({ message: 'ok' });

    await new Promise(resolve => setImmediate(resolve));

    expect(db.query.mock.calls[0][1][4]).toBe('60');

    vi.clearAllMocks();

    const req2 = createRequest({
      method: 'DELETE',
      params: {
        pedidoId: '61',
      },
    });
    const res2 = createResponse(200);

    auditarOperacion('pedidos')(req2, res2, next);
    res2.json({ message: 'ok' });

    await new Promise(resolve => setImmediate(resolve));

    expect(db.query.mock.calls[0][1][4]).toBe('61');

    vi.clearAllMocks();

    const req3 = createRequest({
      method: 'DELETE',
      params: {},
    });
    const res3 = createResponse(200);

    auditarOperacion('pedidos')(req3, res3, next);
    res3.json({
      data: {
        id: 62,
      },
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(db.query.mock.calls[0][1][4]).toBe(62);
  });

  it('debe usar null cuando no existe identificador del registro', async () => {
    const req = createRequest({
      method: 'DELETE',
      params: {},
    });
    const res = createResponse(200);
    const next = vi.fn();

    auditarOperacion('clientes')(req, res, next);
    res.json({ message: 'ok' });

    await new Promise(resolve => setImmediate(resolve));

    expect(db.query.mock.calls[0][1][4]).toBeNull();
  });

  it('debe usar email cuando el usuario no tiene nombre', async () => {
    const req = createRequest({
      method: 'DELETE',
      user: {
        id: 11,
        email: 'correo@example.com',
      },
    });
    const res = createResponse(200);
    const next = vi.fn();

    auditarOperacion('clientes')(req, res, next);
    res.json({ message: 'ok' });

    await new Promise(resolve => setImmediate(resolve));

    expect(db.query.mock.calls[0][1][1]).toBe('correo@example.com');
  });

  it('debe manejar usuario inexistente y datos de red ausentes', async () => {
    const req = createRequest({
      method: 'DELETE',
      user: undefined,
      ip: undefined,
      headers: {},
    });
    const res = createResponse(200);
    const next = vi.fn();

    auditarOperacion('clientes')(req, res, next);
    res.json({ message: 'ok' });

    await new Promise(resolve => setImmediate(resolve));

    const values = db.query.mock.calls[0][1];

    expect(values[0]).toBeNull();
    expect(values[1]).toBe('Sistema');
    expect(values[6]).toBeNull();
    expect(values[7]).toBeNull();
  });

  it('debe obtener IP desde x-forwarded-for cuando no existe req.ip y limitar user-agent a 255 caracteres', async () => {
    const longUserAgent = 'A'.repeat(300);

    const req = createRequest({
      method: 'DELETE',
      ip: undefined,
      headers: {
        'x-forwarded-for': '10.0.0.1, 10.0.0.2',
        'user-agent': longUserAgent,
      },
    });
    const res = createResponse(200);
    const next = vi.fn();

    auditarOperacion('clientes')(req, res, next);
    res.json({ message: 'ok' });

    await new Promise(resolve => setImmediate(resolve));

    const values = db.query.mock.calls[0][1];

    expect(values[6]).toBe('10.0.0.1');
    expect(values[7]).toHaveLength(255);
  });

  it('debe registrar advertencia si falla la inserción de auditoría', async () => {
    const req = createRequest({
      method: 'DELETE',
      params: {
        id: '70',
      },
    });
    const res = createResponse(200);
    const next = vi.fn();

    db.query.mockRejectedValueOnce(new Error('Audit DB error'));

    auditarOperacion('clientes')(req, res, next);
    res.json({ message: 'ok' });

    await new Promise(resolve => setImmediate(resolve));

    expect(logger.warn).toHaveBeenCalledWith(
      'AUDIT_INSERT_FAIL',
      {
        event: 'audit.insert_error',
        message: 'Audit DB error',
        accion: 'DELETE',
        tabla: 'clientes',
      }
    );
  });
});

describe('registrarAuditoria', () => {
  it('debe insertar una auditoría con los datos proporcionados', async () => {
    const req = createRequest();

    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await registrarAuditoria(
      req,
      'CREAR',
      'clientes',
      80,
      {
        origen: 'test',
      }
    );

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO auditoria_acciones'),
      [
        10,
        'Juan Pérez',
        'CREAR',
        'clientes',
        80,
        JSON.stringify({
          origen: 'test',
        }),
        '192.168.1.10',
        'Mozilla/5.0',
      ]
    );
  });

  it('debe usar los valores alternativos y detalle vacío por defecto', async () => {
    const req = createRequest({
      user: {
        id: 12,
        email: 'fallback@example.com',
      },
      ip: undefined,
      headers: {
        'x-forwarded-for': '172.16.0.5, 172.16.0.6',
      },
    });

    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await registrarAuditoria(
      req,
      'ACTUALIZAR',
      'pedidos',
      81
    );

    const values = db.query.mock.calls[0][1];

    expect(values[0]).toBe(12);
    expect(values[1]).toBe('fallback@example.com');
    expect(values[2]).toBe('ACTUALIZAR');
    expect(values[3]).toBe('pedidos');
    expect(values[4]).toBe(81);
    expect(values[5]).toBe('{}');
    expect(values[6]).toBe('172.16.0.5');
    expect(values[7]).toBeNull();
  });

it('debe usar null cuando tabla afectada es falsy', async () => {
  const req = createRequest();

  db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

  await registrarAuditoria(
    req,
    'ACTUALIZAR',
    null,
    10,
    { motivo: 'prueba' }
  );

  const values = db.query.mock.calls[0][1];

  expect(values[3]).toBeNull();
});


    it('debe usar null para registroId cero y detalle null', async () => {
      const req = createRequest();

      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await registrarAuditoria(
        req,
        'ACTUALIZAR',
        'clientes',
        0,
        null
      );

      const values = db.query.mock.calls[0][1];

      expect(values[4]).toBeNull();
      expect(values[5]).toBeNull();
    });

  it('debe registrar advertencia si falla registrarAuditoria', async () => {
    const req = createRequest();

    db.query.mockRejectedValueOnce(new Error('Insert failed'));

    await registrarAuditoria(
      req,
      'ELIMINAR',
      'clientes',
      82,
      {
        motivo: 'test',
      }
    );

    expect(logger.warn).toHaveBeenCalledWith(
      'AUDIT_INSERT_FAIL',
      {
        event: 'audit.insert_error',
        message: 'Insert failed',
        accion: 'ELIMINAR',
        tabla: 'clientes',
      }
    );
  });
});
