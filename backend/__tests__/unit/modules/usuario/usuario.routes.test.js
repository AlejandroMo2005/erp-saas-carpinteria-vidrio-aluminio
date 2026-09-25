import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const routes = {
  use: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
};

const express = {
  Router: vi.fn(() => routes),
};

const protect = vi.fn();
const authorize = vi.fn((...roles) => ({
  middleware: 'authorize',
  roles,
}));

const auditarOperacion = vi.fn(recurso => ({
  middleware: 'auditarOperacion',
  recurso,
}));

const trackActivity = vi.fn();
const inactivityGuard = vi.fn();

const validateBody = vi.fn(schema => ({
  middleware: 'validateBody',
  schema,
}));

const schemas = {
  updateMeSchema: { name: 'updateMeSchema' },
  createUsuarioSchema: { name: 'createUsuarioSchema' },
  updateRolSchema: { name: 'updateRolSchema' },
  toggleActivoSchema: { name: 'toggleActivoSchema' },
};

const ctrl = {
  getMe: vi.fn(),
  updateMe: vi.fn(),
  buscarClientes: vi.fn(),
  getAllUsuarios: vi.fn(),
  createUsuario: vi.fn(),
  updateRol: vi.fn(),
  toggleActivo: vi.fn(),
};

const originalLoad = Module._load;

const routerPath = require.resolve(
  `${process.cwd()}/src/modules/usuario/usuario.routes.js`
);

delete require.cache[routerPath];

Module._load = function (request, parent, isMain) {
  if (request === 'express') return express;

  if (request === '../../shared/middleware/auth') {
    return { protect, authorize };
  }

  if (request === '../../shared/middleware/auditLog') {
    return { auditarOperacion };
  }

  if (request === '../../shared/middleware/activityTracker') {
    return { trackActivity, inactivityGuard };
  }

  if (request === '../../shared/middleware/validateZod') {
    return { validateBody };
  }

  if (request === '../../shared/validators/usuario.validators') {
    return schemas;
  }

  if (request === './usuario.controller') {
    return ctrl;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const router = require(routerPath);

Module._load = originalLoad;

describe('usuario.routes', () => {
  it('crea el router de Express', () => {
    expect(express.Router).toHaveBeenCalledTimes(1);
    expect(router).toBe(routes);
  });

  it('registra GET /me con protect, trackActivity y getMe', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/me',
      protect,
      trackActivity,
      ctrl.getMe
    );
  });

  it('registra PUT /me con protección, actividad, inactividad, validación y updateMe', () => {
    expect(routes.put).toHaveBeenCalledWith(
      '/me',
      protect,
      trackActivity,
      inactivityGuard,
      expect.objectContaining({
        middleware: 'validateBody',
        schema: schemas.updateMeSchema,
      }),
      ctrl.updateMe
    );
  });

  it('registra GET /buscar para ADMIN y VENDEDOR', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/buscar',
      protect,
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      trackActivity,
      ctrl.buscarClientes
    );
  });

  it('registra GET / para ADMIN', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/',
      protect,
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN'],
      }),
      trackActivity,
      ctrl.getAllUsuarios
    );
  });

  it('registra POST / para crear usuario con validación y guards', () => {
    expect(routes.post).toHaveBeenCalledWith(
      '/',
      protect,
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN'],
      }),
      trackActivity,
      inactivityGuard,
      expect.objectContaining({
        middleware: 'validateBody',
        schema: schemas.createUsuarioSchema,
      }),
      ctrl.createUsuario
    );
  });

  it('registra PUT /:id/rol para ADMIN con updateRolSchema', () => {
    expect(routes.put).toHaveBeenCalledWith(
      '/:id/rol',
      protect,
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN'],
      }),
      trackActivity,
      inactivityGuard,
      expect.objectContaining({
        middleware: 'validateBody',
        schema: schemas.updateRolSchema,
      }),
      ctrl.updateRol
    );
  });

  it('registra PUT /:id/activo para ADMIN con toggleActivoSchema', () => {
    expect(routes.put).toHaveBeenCalledWith(
      '/:id/activo',
      protect,
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN'],
      }),
      trackActivity,
      inactivityGuard,
      expect.objectContaining({
        middleware: 'validateBody',
        schema: schemas.toggleActivoSchema,
      }),
      ctrl.toggleActivo
    );
  });

  it('registra DELETE /:id con protección, autorización, actividad, inactividad y auditoría', () => {
    expect(routes.delete).toHaveBeenCalledWith(
      '/:id',
      protect,
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN'],
      }),
      trackActivity,
      inactivityGuard,
      expect.objectContaining({
        middleware: 'auditarOperacion',
        recurso: 'usuarios',
      })
    );
  });

  it('usa los cuatro esquemas correctos mediante validateBody', () => {
    expect(validateBody).toHaveBeenCalledWith(schemas.updateMeSchema);
    expect(validateBody).toHaveBeenCalledWith(schemas.createUsuarioSchema);
    expect(validateBody).toHaveBeenCalledWith(schemas.updateRolSchema);
    expect(validateBody).toHaveBeenCalledWith(schemas.toggleActivoSchema);
    expect(validateBody).toHaveBeenCalledTimes(4);
  });

  it('configura authorize con los roles esperados', () => {
    expect(authorize).toHaveBeenCalledWith('ADMIN', 'VENDEDOR');
    expect(authorize).toHaveBeenCalledWith('ADMIN');
    expect(authorize).toHaveBeenCalledTimes(6);
  });

  it('configura la auditoría para el recurso usuarios', () => {
    expect(auditarOperacion).toHaveBeenCalledWith('usuarios');
    expect(auditarOperacion).toHaveBeenCalledTimes(1);
  });
});
