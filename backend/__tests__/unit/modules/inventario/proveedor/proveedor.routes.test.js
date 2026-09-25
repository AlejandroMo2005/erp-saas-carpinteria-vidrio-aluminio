import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const routes = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

const express = {
  Router: vi.fn(() => routes),
};

const ctrl = {
  getMateriales: vi.fn(),
  alertasStock: vi.fn(),
  historialSolicitudes: vi.fn(),
  listar: vi.fn(),
  obtener: vi.fn(),
  generarSolicitud: vi.fn(),
  marcarEnviada: vi.fn(),
  crear: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
};

const protect = vi.fn();
const authorize = vi.fn((...roles) => ({
  middleware: 'authorize',
  roles,
}));

const auditarOperacion = vi.fn(tabla => ({
  middleware: 'auditarOperacion',
  tabla,
}));

const trackActivity = vi.fn();
const inactivityGuard = vi.fn();

const validateBody = vi.fn(schema => ({
  middleware: 'validateBody',
  schema,
}));

const crearProveedorSchema = {
  name: 'crearProveedorSchema',
};

const actualizarProveedorSchema = {
  name: 'actualizarProveedorSchema',
};

const generarSolicitudSchema = {
  name: 'generarSolicitudSchema',
};

const originalLoad = Module._load;

const routerPath = require.resolve(
  `${process.cwd()}/src/modules/inventario/proveedor/proveedor.routes.js`
);

delete require.cache[routerPath];

Module._load = function (request, parent, isMain) {
  if (request === 'express') return express;
  if (request === './proveedor.controller') return ctrl;

  if (request === '../../../shared/middleware/auth') {
    return { protect, authorize };
  }

  if (request === '../../../shared/middleware/auditLog') {
    return { auditarOperacion };
  }

  if (request === '../../../shared/middleware/activityTracker') {
    return { trackActivity, inactivityGuard };
  }

  if (request === '../../../shared/middleware/validateZod') {
    return { validateBody };
  }

  if (request === '../../../shared/validators/proveedor.validators') {
    return {
      crearProveedorSchema,
      actualizarProveedorSchema,
      generarSolicitudSchema,
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const router = require(routerPath);

Module._load = originalLoad;

describe('proveedor.routes', () => {
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

  it('debe registrar las cinco rutas GET', () => {
    expect(routes.get).toHaveBeenCalledTimes(5);

    expect(routes.get).toHaveBeenCalledWith(
      '/materiales',
      {
        middleware: 'authorize',
        roles: ['ADMIN', 'ALMACEN'],
      },
      ctrl.getMateriales
    );

    expect(routes.get).toHaveBeenCalledWith(
      '/alertas/stock',
      {
        middleware: 'authorize',
        roles: ['ADMIN', 'ALMACEN'],
      },
      ctrl.alertasStock
    );

    expect(routes.get).toHaveBeenCalledWith(
      '/solicitudes/historial',
      {
        middleware: 'authorize',
        roles: ['ADMIN', 'ALMACEN'],
      },
      ctrl.historialSolicitudes
    );

    expect(routes.get).toHaveBeenCalledWith(
      '/',
      {
        middleware: 'authorize',
        roles: ['ADMIN', 'ALMACEN'],
      },
      ctrl.listar
    );

    expect(routes.get).toHaveBeenCalledWith(
      '/:id',
      {
        middleware: 'authorize',
        roles: ['ADMIN', 'ALMACEN'],
      },
      ctrl.obtener
    );
  });

  it('debe registrar POST /solicitudes/generar con todos sus middlewares', () => {
    expect(routes.post).toHaveBeenCalledWith(
      '/solicitudes/generar',
      {
        middleware: 'authorize',
        roles: ['ADMIN', 'ALMACEN'],
      },
      inactivityGuard,
      {
        middleware: 'validateBody',
        schema: generarSolicitudSchema,
      },
      ctrl.generarSolicitud
    );
  });

  it('debe registrar PATCH /solicitudes/:id/enviada', () => {
    expect(routes.patch).toHaveBeenCalledWith(
      '/solicitudes/:id/enviada',
      {
        middleware: 'authorize',
        roles: ['ADMIN', 'ALMACEN'],
      },
      ctrl.marcarEnviada
    );
  });

  it('debe registrar POST / con crearProveedorSchema', () => {
    expect(routes.post).toHaveBeenCalledWith(
      '/',
      {
        middleware: 'authorize',
        roles: ['ADMIN', 'ALMACEN'],
      },
      inactivityGuard,
      {
        middleware: 'validateBody',
        schema: crearProveedorSchema,
      },
      ctrl.crear
    );
  });

  it('debe registrar PUT /:id con actualizarProveedorSchema', () => {
    expect(routes.put).toHaveBeenCalledWith(
      '/:id',
      {
        middleware: 'authorize',
        roles: ['ADMIN', 'ALMACEN'],
      },
      inactivityGuard,
      {
        middleware: 'validateBody',
        schema: actualizarProveedorSchema,
      },
      ctrl.actualizar
    );
  });

  it('debe registrar DELETE /:id con autorización ADMIN', () => {
    expect(routes.delete).toHaveBeenCalledWith(
      '/:id',
      {
        middleware: 'authorize',
        roles: ['ADMIN'],
      },
      inactivityGuard,
      {
        middleware: 'auditarOperacion',
        tabla: 'proveedores',
      },
      ctrl.eliminar
    );
  });

  it('debe configurar authorize con ADMIN y ALMACEN', () => {
    const calls = authorize.mock.calls;

    expect(calls).toHaveLength(10);

    expect(calls.filter(
      call => call.length === 2 &&
        call[0] === 'ADMIN' &&
        call[1] === 'ALMACEN'
    )).toHaveLength(9);

    expect(authorize).toHaveBeenLastCalledWith('ADMIN');
  });

  it('debe configurar los tres schemas mediante validateBody', () => {
    expect(validateBody).toHaveBeenCalledTimes(3);

    expect(validateBody).toHaveBeenCalledWith(
      generarSolicitudSchema
    );

    expect(validateBody).toHaveBeenCalledWith(
      crearProveedorSchema
    );

    expect(validateBody).toHaveBeenCalledWith(
      actualizarProveedorSchema
    );
  });

  it('debe configurar auditarOperacion para proveedores', () => {
    expect(auditarOperacion).toHaveBeenCalledTimes(1);
    expect(auditarOperacion).toHaveBeenCalledWith('proveedores');
  });

  it('debe registrar exactamente una ruta PATCH, una PUT y una DELETE', () => {
    expect(routes.patch).toHaveBeenCalledTimes(1);
    expect(routes.put).toHaveBeenCalledTimes(1);
    expect(routes.delete).toHaveBeenCalledTimes(1);
  });

  it('debe mantener el orden de las rutas GET', () => {
    const paths = routes.get.mock.calls.map(call => call[0]);

    expect(paths).toEqual([
      '/materiales',
      '/alertas/stock',
      '/solicitudes/historial',
      '/',
      '/:id',
    ]);
  });
});
