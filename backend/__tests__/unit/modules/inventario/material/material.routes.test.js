import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const routes = {
  use: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

const express = {
  Router: vi.fn(() => routes),
};

const ctrl = {
  getAllMateriales: vi.fn(),
  getConColores: vi.fn(),
  updateVariante: vi.fn(),
  deleteMaterial: vi.fn(),
};

const protect = vi.fn();
const authorize = vi.fn((...roles) => ({
  middleware: 'authorize',
  roles,
}));

const trackActivity = vi.fn();
const inactivityGuard = vi.fn();

const validateBody = vi.fn(schema => ({
  middleware: 'validateBody',
  schema,
}));

const updateVarianteSchema = {
  name: 'updateVarianteSchema',
};

const originalLoad = Module._load;
const originalResolveFilename = Module._resolveFilename;

const routerPath = require.resolve(
  `${process.cwd()}/src/modules/inventario/material/material.routes.js`
);

delete require.cache[routerPath];

Module._load = function (request, parent, isMain) {
  if (request === 'express') return express;
  if (request === './material.controller') return ctrl;

  if (request === '../../../shared/middleware/auth') {
    return { protect, authorize };
  }

  if (request === '../../../shared/middleware/activityTracker') {
    return { trackActivity, inactivityGuard };
  }

  if (request === '../../../shared/middleware/validateZod') {
    return { validateBody };
  }

  if (request === '../../../shared/validators/material.validators') {
    return { updateVarianteSchema };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const router = require(routerPath);

Module._load = originalLoad;
Module._resolveFilename = originalResolveFilename;
describe('material.routes', () => {
  it('debe crear el router de Express', () => {
    expect(express.Router).toHaveBeenCalledTimes(1);
    expect(router).toBe(routes);
  });

  it('debe registrar protect y trackActivity como middlewares globales', () => {
    expect(routes.use).toHaveBeenCalledWith(
      protect,
      trackActivity
    );
  });

  it('debe registrar GET / con getAllMateriales', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/',
      ctrl.getAllMateriales
    );
  });

  it('debe registrar GET /con-colores con getConColores', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/con-colores',
      ctrl.getConColores
    );
  });

  it('debe registrar PUT /variante/:id con todos sus middlewares', () => {
    const putCall = routes.put.mock.calls.find(
      call => call[0] === '/variante/:id'
    );

    expect(putCall).toBeDefined();
    expect(putCall).toHaveLength(5);

    expect(putCall[1]).toEqual({
      middleware: 'authorize',
      roles: ['ADMIN', 'ALMACEN'],
    });

    expect(putCall[2]).toBe(inactivityGuard);

    expect(putCall[3]).toEqual({
      middleware: 'validateBody',
      schema: updateVarianteSchema,
    });

    expect(putCall[4]).toBe(ctrl.updateVariante);
  });

  it('debe configurar authorize para ADMIN y ALMACEN en PUT', () => {
    expect(authorize).toHaveBeenCalledWith(
      'ADMIN',
      'ALMACEN'
    );
  });

  it('debe configurar validateBody con updateVarianteSchema', () => {
    expect(validateBody).toHaveBeenCalledWith(
      updateVarianteSchema
    );
  });

  it('debe registrar DELETE /:id con todos sus middlewares', () => {
    const deleteCall = routes.delete.mock.calls.find(
      call => call[0] === '/:id'
    );

    expect(deleteCall).toBeDefined();
    expect(deleteCall).toHaveLength(4);

    expect(deleteCall[1]).toEqual({
      middleware: 'authorize',
      roles: ['ADMIN'],
    });

    expect(deleteCall[2]).toBe(inactivityGuard);
    expect(deleteCall[3]).toBe(ctrl.deleteMaterial);
  });

  it('debe configurar authorize para ADMIN en DELETE', () => {
    expect(authorize).toHaveBeenCalledWith('ADMIN');
  });

  it('debe conservar el orden de las rutas GET', () => {
    const getPaths = routes.get.mock.calls.map(
      call => call[0]
    );

    expect(getPaths).toEqual([
      '/',
      '/con-colores',
    ]);
  });

  it('debe registrar exactamente una ruta PUT y una DELETE', () => {
    expect(routes.put).toHaveBeenCalledTimes(1);
    expect(routes.delete).toHaveBeenCalledTimes(1);
  });

  it('debe registrar exactamente dos rutas GET', () => {
    expect(routes.get).toHaveBeenCalledTimes(2);
  });
});
