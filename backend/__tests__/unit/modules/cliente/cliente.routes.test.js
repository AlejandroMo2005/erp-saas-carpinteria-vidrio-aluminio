import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const routes = {
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
};

const express = {
  Router: vi.fn(() => routes),
};

const ctrl = {
  listar: vi.fn(),
  buscarPorTelefono: vi.fn(),
  getMisDatos: vi.fn(),
  updateMisDatos: vi.fn(),
  crear: vi.fn(),
};

const protect = vi.fn();
const authorize = vi.fn((...roles) => ({
  middleware: 'authorize',
  roles,
}));

const originalLoad = Module._load;

const routerPath = require.resolve(
  `${process.cwd()}/src/modules/cliente/cliente.routes.js`
);

delete require.cache[routerPath];

Module._load = function (request, parent, isMain) {
  if (request === 'express') return express;
  if (request === './cliente.controller') return ctrl;
  if (request === '../../shared/middleware/auth') {
    return { protect, authorize };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const router = require(routerPath);

Module._load = originalLoad;

describe('cliente.routes', () => {
  it('debe crear el router de Express', () => {
    expect(express.Router).toHaveBeenCalledTimes(1);
    expect(router).toBe(routes);
  });

  it('debe registrar GET / para listar clientes', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      ctrl.listar
    );
  });

  it('debe registrar GET /buscar para búsqueda por teléfono', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/buscar',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      ctrl.buscarPorTelefono
    );
  });

  it('debe registrar GET /mis-datos con protect y CLIENTE', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/mis-datos',
      protect,
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['CLIENTE'],
      }),
      ctrl.getMisDatos
    );
  });

  it('debe registrar PUT /mis-datos con protect y CLIENTE', () => {
    expect(routes.put).toHaveBeenCalledWith(
      '/mis-datos',
      protect,
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['CLIENTE'],
      }),
      ctrl.updateMisDatos
    );
  });

  it('debe registrar POST / para crear clientes', () => {
    expect(routes.post).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      ctrl.crear
    );
  });

  it('debe autorizar ADMIN y VENDEDOR en las rutas administrativas', () => {
    const llamadas = authorize.mock.calls.filter(
      ([...roles]) =>
        roles.length === 2 &&
        roles.includes('ADMIN') &&
        roles.includes('VENDEDOR')
    );

    expect(llamadas).toHaveLength(3);
  });

  it('debe autorizar CLIENTE únicamente en mis-datos', () => {
    const llamadas = authorize.mock.calls.filter(
      ([...roles]) =>
        roles.length === 1 &&
        roles[0] === 'CLIENTE'
    );

    expect(llamadas).toHaveLength(2);
  });

  it('debe usar protect en las dos rutas de mis-datos', () => {
    const getMisDatosCall = routes.get.mock.calls.find(
      ([path]) => path === '/mis-datos'
    );

    const putMisDatosCall = routes.put.mock.calls.find(
      ([path]) => path === '/mis-datos'
    );

    expect(getMisDatosCall).toContain(protect);
    expect(putMisDatosCall).toContain(protect);
  });
});
