import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const express = require('express');

const proformaController = {
  calcularProforma: vi.fn(),
  agendarPedido: vi.fn(),
  getAllProformas: vi.fn(),
  searchByCliente: vi.fn(),
  getProformaById: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === 'express') return express;

  if (request === './proforma.controller') {
    return proformaController;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const router = require(
  `${process.cwd()}/src/modules/comercial/proforma/proforma.routes.js`
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

describe('proforma.routes', () => {
  it('debe registrar POST /calcular con el controlador correcto', () => {
    const route = getRoute('post', '/calcular');

    expect(route).toBeDefined();
    expect(route.route.stack).toHaveLength(1);
    expect(route.route.stack[0].handle).toBe(
      proformaController.calcularProforma
    );
  });

  it('debe registrar POST /agendar con el controlador correcto', () => {
    const route = getRoute('post', '/agendar');

    expect(route).toBeDefined();
    expect(route.route.stack).toHaveLength(1);
    expect(route.route.stack[0].handle).toBe(
      proformaController.agendarPedido
    );
  });

  it('debe registrar GET / con el controlador correcto', () => {
    const route = getRoute('get', '/');

    expect(route).toBeDefined();
    expect(route.route.stack).toHaveLength(1);
    expect(route.route.stack[0].handle).toBe(
      proformaController.getAllProformas
    );
  });

  it('debe registrar GET /buscar/cliente antes de /:id', () => {
    const routes = router.stack
      .filter(layer => layer.route)
      .map(layer => layer.route.path);

    expect(routes.indexOf('/buscar/cliente')).toBeLessThan(
      routes.indexOf('/:id')
    );

    const route = getRoute('get', '/buscar/cliente');

    expect(route).toBeDefined();
    expect(route.route.stack[0].handle).toBe(
      proformaController.searchByCliente
    );
  });

  it('debe registrar GET /:id con el controlador correcto', () => {
    const route = getRoute('get', '/:id');

    expect(route).toBeDefined();
    expect(route.route.stack).toHaveLength(1);
    expect(route.route.stack[0].handle).toBe(
      proformaController.getProformaById
    );
  });

  it('debe definir exactamente las cinco rutas del módulo', () => {
    const routes = router.stack
      .filter(layer => layer.route)
      .map(layer => ({
        method: Object.keys(layer.route.methods)[0],
        path: layer.route.path,
      }));

    expect(routes).toEqual([
      { method: 'post', path: '/calcular' },
      { method: 'post', path: '/agendar' },
      { method: 'get', path: '/' },
      { method: 'get', path: '/buscar/cliente' },
      { method: 'get', path: '/:id' },
    ]);
  });
});
