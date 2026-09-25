import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const routes = {
  get: vi.fn(),
  put: vi.fn(),
};

const express = {
  Router: vi.fn(() => routes),
};

const ctrl = {
  obtenerTasaIva: vi.fn(),
  obtenerTodos: vi.fn(),
  obtenerPorClave: vi.fn(),
  actualizarValor: vi.fn(),
};

const protect = vi.fn();
const tenantMiddleware = vi.fn();
const authorize = vi.fn((...roles) => ({
  middleware: 'authorize',
  roles,
}));

const originalLoad = Module._load;

const routerPath = require.resolve(
  `${process.cwd()}/src/modules/configuracion/configuracion.routes.js`
);

delete require.cache[routerPath];

Module._load = function (request, parent, isMain) {
  if (request === 'express') return express;
  if (request === './configuracion.controller') return ctrl;

  if (request === '../../shared/middleware/auth') {
    return {
      protect,
      authorize,
    };
  }

  if (request === '../../shared/middleware/tenant') {
    return {
      tenantMiddleware,
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const router = require(routerPath);

Module._load = originalLoad;

describe('configuracion.routes', () => {
  it('debe crear el router de Express', () => {
    expect(express.Router).toHaveBeenCalledTimes(1);
    expect(router).toBe(routes);
  });

  it('debe registrar GET /iva/tasa con todos los middlewares', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/iva/tasa',
      protect,
      tenantMiddleware,
      {
        middleware: 'authorize',
        roles: ['ADMIN'],
      },
      ctrl.obtenerTasaIva
    );
  });

  it('debe registrar GET / con todos los middlewares', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/',
      protect,
      tenantMiddleware,
      {
        middleware: 'authorize',
        roles: ['ADMIN'],
      },
      ctrl.obtenerTodos
    );
  });

  it('debe registrar GET /:clave con todos los middlewares', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/:clave',
      protect,
      tenantMiddleware,
      {
        middleware: 'authorize',
        roles: ['ADMIN'],
      },
      ctrl.obtenerPorClave
    );
  });

  it('debe registrar PUT /:clave con todos los middlewares', () => {
    expect(routes.put).toHaveBeenCalledWith(
      '/:clave',
      protect,
      tenantMiddleware,
      {
        middleware: 'authorize',
        roles: ['ADMIN'],
      },
      ctrl.actualizarValor
    );
  });

  it('debe configurar authorize como ADMIN para todas las rutas', () => {
    expect(authorize).toHaveBeenCalledTimes(4);
    expect(authorize).toHaveBeenCalledWith('ADMIN');
  });

  it('debe registrar exactamente tres rutas GET y una PUT', () => {
    expect(routes.get).toHaveBeenCalledTimes(3);
    expect(routes.put).toHaveBeenCalledTimes(1);
  });

  it('debe mantener /iva/tasa antes de /:clave', () => {
    const getPaths = routes.get.mock.calls.map(
      call => call[0]
    );

    expect(getPaths).toEqual([
      '/iva/tasa',
      '/',
      '/:clave',
    ]);

    expect(
      getPaths.indexOf('/iva/tasa')
    ).toBeLessThan(
      getPaths.indexOf('/:clave')
    );
  });

  it('debe aplicar protect y tenantMiddleware a todas las rutas', () => {
    const allRoutes = [
      ...routes.get.mock.calls,
      ...routes.put.mock.calls,
    ];

    for (const route of allRoutes) {
      expect(route[1]).toBe(protect);
      expect(route[2]).toBe(tenantMiddleware);
    }
  });

  it('debe asociar cada ruta con su controlador correspondiente', () => {
    expect(
      routes.get.mock.calls.map(call => call.at(-1))
    ).toEqual([
      ctrl.obtenerTasaIva,
      ctrl.obtenerTodos,
      ctrl.obtenerPorClave,
    ]);

    expect(
      routes.put.mock.calls.map(call => call.at(-1))
    ).toEqual([
      ctrl.actualizarValor,
    ]);
  });
});
