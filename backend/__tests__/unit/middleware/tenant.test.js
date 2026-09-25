import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const logger = {
  warn: vi.fn(),
};

const loggerPath = require.resolve(
  `${process.cwd()}/src/shared/utils/logger.js`
);

const modulePath = require.resolve(
  `${process.cwd()}/src/shared/middleware/tenant.js`
);

require.cache[loggerPath] = {
  id: loggerPath,
  filename: loggerPath,
  loaded: true,
  exports: logger,
};

delete require.cache[modulePath];

const {
  tenantMiddleware,
  tenantScope,
  tenantInsert,
} = require(modulePath);

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('tenantMiddleware', () => {
  it('debe rechazar la solicitud cuando no existe req.user', () => {
    const req = {
      path: '/api/clientes',
      ip: '127.0.0.1',
    };
    const res = createResponse();
    const next = vi.fn();

    const result = tenantMiddleware(req, res, next);

    expect(result).toBe(res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No autenticado',
    });
    expect(next).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('debe rechazar al usuario que no tiene empresa asignada', () => {
    const req = {
      user: {
        id: 25,
        empresa_id: null,
      },
      path: '/api/proformas',
      ip: '10.0.0.5',
    };
    const res = createResponse();
    const next = vi.fn();

    const result = tenantMiddleware(req, res, next);

    expect(result).toBe(res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Usuario sin empresa asignada. Contacta al administrador.',
    });
    expect(next).not.toHaveBeenCalled();

    expect(logger.warn).toHaveBeenCalledWith(
      'TENANT_MISSING',
      {
        event: 'tenant.empresa_id_missing',
        userId: 25,
        path: '/api/proformas',
        ip: '10.0.0.5',
      }
    );
  });

  it('debe rechazar cuando empresa_id es 0', () => {
    const req = {
      user: {
        id: 30,
        empresa_id: 0,
      },
      path: '/api/pedidos',
      ip: '192.168.1.10',
    };
    const res = createResponse();
    const next = vi.fn();

    tenantMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Usuario sin empresa asignada. Contacta al administrador.',
    });
    expect(next).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('debe asignar empresaId como número y continuar', () => {
    const req = {
      user: {
        id: 7,
        empresa_id: '42',
      },
      path: '/api/inventario',
      ip: '127.0.0.1',
    };
    const res = createResponse();
    const next = vi.fn();

    const result = tenantMiddleware(req, res, next);

    expect(result).toBeUndefined();
    expect(req.empresaId).toBe(42);
    expect(typeof req.empresaId).toBe('number');
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

describe('tenantScope', () => {
  it('debe generar el WHERE básico cuando no existe condición adicional', () => {
    const req = {
      empresaId: 15,
    };

    const result = tenantScope(req);

    expect(result).toEqual([
      'p.empresa_id = ?',
      [15],
    ]);
  });

  it('debe generar el WHERE con alias, condición y parámetros adicionales', () => {
    const req = {
      empresaId: 8,
    };

    const result = tenantScope(
      req,
      'f',
      'deleted_at IS NULL AND estado = ?',
      ['EMITIDA']
    );

    expect(result).toEqual([
      'f.empresa_id = ? AND deleted_at IS NULL AND estado = ?',
      [8, 'EMITIDA'],
    ]);
  });

  it('debe conservar el alias proporcionado aunque no exista extraWhere', () => {
    const req = {
      empresaId: 21,
    };

    const result = tenantScope(req, 'm');

    expect(result).toEqual([
      'm.empresa_id = ?',
      [21],
    ]);
  });
});

describe('tenantInsert', () => {
  it('debe devolver el empresaId del request', () => {
    const req = {
      empresaId: 37,
    };

    expect(tenantInsert(req)).toBe(37);
  });
});
