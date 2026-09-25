import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const routes = {
  use: vi.fn(),
  get: vi.fn(),
};

const express = {
  Router: vi.fn(() => routes),
};

const middleware = {
  protect: vi.fn(),
  authorize: vi.fn((...roles) => ({
    middleware: 'authorize',
    roles,
  })),
  trackActivity: vi.fn(),
};

const controllers = {
  getResumen: vi.fn(),
  getIngresos: vi.fn(),
  getPedidosRecientes: vi.fn(),
  getUsuariosIngresos: vi.fn(),
  getTopProductos: vi.fn(),
  getMaterialesVariantes: vi.fn(),
  getTrabajoStats: vi.fn(),
  getEstados: vi.fn(),
};

const originalLoad = Module._load;

const routerPath = require.resolve(
  `${process.cwd()}/src/modules/dashboard/dashboard.routes.js`
);

delete require.cache[routerPath];

Module._load = function (request, parent, isMain) {
  if (request === 'express') return express;

  if (request === '../../shared/middleware/auth') {
    return {
      protect: middleware.protect,
      authorize: middleware.authorize,
    };
  }

  if (request === '../../shared/middleware/activityTracker') {
    return {
      trackActivity: middleware.trackActivity,
    };
  }

  if (request === './dashboard.controller') {
    return controllers;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const router = require(routerPath);

Module._load = originalLoad;

describe('dashboard.routes', () => {
  it('crea el router de Express', () => {
    expect(express.Router).toHaveBeenCalledTimes(1);
    expect(router).toBe(routes);
  });

  it('registra middleware global de protección, autorización y actividad', () => {
    expect(routes.use).toHaveBeenCalledWith(
      middleware.protect,
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN'],
      }),
      middleware.trackActivity
    );
  });

  it('autoriza únicamente ADMIN', () => {
    expect(middleware.authorize).toHaveBeenCalledWith('ADMIN');
  });

  it.each([
    ['/resumen', controllers.getResumen],
    ['/ingresos', controllers.getIngresos],
    ['/pedidos-recientes', controllers.getPedidosRecientes],
    ['/usuarios-ingresos', controllers.getUsuariosIngresos],
    ['/top-productos', controllers.getTopProductos],
    ['/materiales-variantes', controllers.getMaterialesVariantes],
    ['/trabajos-stats', controllers.getTrabajoStats],
    ['/estados', controllers.getEstados],
  ])('registra GET %s', (path, handler) => {
    expect(routes.get).toHaveBeenCalledWith(path, handler);
  });

  it('registra exactamente ocho rutas GET', () => {
    expect(routes.get).toHaveBeenCalledTimes(8);
  });

  it('no registra rutas de escritura', () => {
    expect(routes).not.toHaveProperty('post');
    expect(routes).not.toHaveProperty('put');
    expect(routes).not.toHaveProperty('patch');
    expect(routes).not.toHaveProperty('delete');
  });
});
