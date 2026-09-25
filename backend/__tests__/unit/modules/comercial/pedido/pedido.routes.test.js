import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const express = require('express');

const protect = vi.fn();
const authorize = vi.fn(() => vi.fn());
const auditarOperacion = vi.fn(() => vi.fn());
const filtroCliente = vi.fn();
const trackActivity = vi.fn();
const inactivityGuard = vi.fn();
const validateBody = vi.fn(() => vi.fn());

const createPedidoSchema = {};
const updateEstadoSchema = {};

const pedidoController = {
  getPedidosByEstado: vi.fn(),
  getAllPedidos: vi.fn(),
  createPedido: vi.fn(),
  updateEstado: vi.fn(),
  getPedidoById: vi.fn(),
  deletePedido: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === 'express') return express;

  if (request === '../../../shared/middleware/auth') {
    return { protect, authorize };
  }

  if (request === '../../../shared/middleware/auditLog') {
    return { auditarOperacion };
  }

  if (request === '../../../shared/middleware/filtroRol') {
    return { filtroCliente };
  }

  if (request === '../../../shared/middleware/activityTracker') {
    return { trackActivity, inactivityGuard };
  }

  if (request === '../../../shared/middleware/validateZod') {
    return { validateBody };
  }

  if (request === '../../../shared/validators/pedido.validators') {
    return { createPedidoSchema, updateEstadoSchema };
  }

  if (request === './pedido.controller') {
    return pedidoController;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const router = require(
  `${process.cwd()}/src/modules/comercial/pedido/pedido.routes.js`
);

Module._load = originalLoad;

function getRoute(method, path) {
  return router.stack.find(
    layer =>
      layer.route &&
      layer.route.path === path &&
      layer.route.methods[method]
  );
}

describe('pedido.routes', () => {
  it('debe registrar protect y trackActivity como middlewares globales', () => {
    const middlewares = router.stack.filter(layer => !layer.route);

    expect(middlewares).toHaveLength(2);
    expect(middlewares[0].handle).toBe(protect);
    expect(middlewares[1].handle).toBe(trackActivity);
  });

  it('debe registrar GET /estado/:estado con autorización y controlador correcto', () => {
    const route = getRoute('get', '/estado/:estado');

    expect(route).toBeDefined();
    expect(route.route.stack).toHaveLength(2);

    expect(authorize).toHaveBeenCalledWith(
      'ADMIN',
      'VENDEDOR',
      'ALMACEN'
    );

    expect(route.route.stack.at(-1).handle).toBe(
      pedidoController.getPedidosByEstado
    );
  });

  it('debe registrar GET / con autorización, filtroCliente y controlador correcto', () => {
    const route = getRoute('get', '/');

    expect(route).toBeDefined();
    expect(route.route.stack).toHaveLength(3);

    expect(authorize).toHaveBeenCalledWith(
      'ADMIN',
      'VENDEDOR',
      'ALMACEN',
      'CLIENTE'
    );

    expect(route.route.stack[1].handle).toBe(filtroCliente);
    expect(route.route.stack.at(-1).handle).toBe(
      pedidoController.getAllPedidos
    );
  });

  it('debe registrar POST / con validación de createPedidoSchema', () => {
    const route = getRoute('post', '/');

    expect(route).toBeDefined();
    expect(route.route.stack).toHaveLength(3);

    expect(authorize).toHaveBeenCalledWith(
      'ADMIN',
      'VENDEDOR',
      'CLIENTE'
    );

    expect(validateBody).toHaveBeenCalledWith(createPedidoSchema);
    expect(route.route.stack.at(-1).handle).toBe(
      pedidoController.createPedido
    );
  });

  it('debe registrar PUT /:id/estado con inactivityGuard y validación', () => {
    const route = getRoute('put', '/:id/estado');

    expect(route).toBeDefined();
    expect(route.route.stack).toHaveLength(4);

    expect(authorize).toHaveBeenCalledWith(
      'ADMIN',
      'VENDEDOR',
      'ALMACEN'
    );

    expect(route.route.stack[1].handle).toBe(inactivityGuard);
    expect(validateBody).toHaveBeenCalledWith(updateEstadoSchema);
    expect(route.route.stack.at(-1).handle).toBe(
      pedidoController.updateEstado
    );
  });

  it('debe registrar PATCH /:id/estado con inactivityGuard y validación', () => {
    const route = getRoute('patch', '/:id/estado');

    expect(route).toBeDefined();
    expect(route.route.stack).toHaveLength(4);

    expect(authorize).toHaveBeenCalledWith(
      'ADMIN',
      'VENDEDOR',
      'ALMACEN'
    );

    expect(route.route.stack[1].handle).toBe(inactivityGuard);
    expect(validateBody).toHaveBeenCalledWith(updateEstadoSchema);
    expect(route.route.stack.at(-1).handle).toBe(
      pedidoController.updateEstado
    );
  });

  it('debe registrar GET /:id con filtroCliente', () => {
    const route = getRoute('get', '/:id');

    expect(route).toBeDefined();
    expect(route.route.stack).toHaveLength(3);

    expect(authorize).toHaveBeenCalledWith(
      'ADMIN',
      'VENDEDOR',
      'ALMACEN',
      'CLIENTE'
    );

    expect(route.route.stack[1].handle).toBe(filtroCliente);
    expect(route.route.stack.at(-1).handle).toBe(
      pedidoController.getPedidoById
    );
  });

  it('debe registrar DELETE /:id como ruta exclusiva de ADMIN', () => {
    const route = getRoute('delete', '/:id');

    expect(route).toBeDefined();
    expect(route.route.stack).toHaveLength(4);

    expect(authorize).toHaveBeenCalledWith('ADMIN');

    expect(route.route.stack[1].handle).toBe(inactivityGuard);
    expect(route.route.stack.at(-1).handle).toBe(
      pedidoController.deletePedido
    );
  });

  it('debe configurar auditarOperacion para la eliminación', () => {
    expect(auditarOperacion).toHaveBeenCalledWith('pedidos');

    const route = getRoute('delete', '/:id');

    expect(route.route.stack[2].handle).toBe(
      auditarOperacion.mock.results[0].value
    );
  });

  it('debe definir exactamente las siete rutas del módulo', () => {
    const routes = router.stack
      .filter(layer => layer.route)
      .map(layer => ({
        method: Object.keys(layer.route.methods)[0],
        path: layer.route.path,
      }));

    expect(routes).toEqual([
      { method: 'get', path: '/estado/:estado' },
      { method: 'get', path: '/' },
      { method: 'post', path: '/' },
      { method: 'put', path: '/:id/estado' },
      { method: 'patch', path: '/:id/estado' },
      { method: 'get', path: '/:id' },
      { method: 'delete', path: '/:id' },
    ]);
  });
});