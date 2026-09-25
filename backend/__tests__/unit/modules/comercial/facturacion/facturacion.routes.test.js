import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const routes = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
};

const express = {
  Router: vi.fn(() => routes),
};

const ctrl = {
  obtenerEstadisticas: vi.fn(),
  obtenerResumenPeriodo: vi.fn(),
  obtenerSiguienteNumero: vi.fn(),
  validarPedidoFacturable: vi.fn(),
  getPedidosParaFacturar: vi.fn(),
  listarFacturas: vi.fn(),
  crearFacturaManual: vi.fn(),
  crearFacturaDesdePedido: vi.fn(),
  descargarPDF: vi.fn(),
  obtenerFactura: vi.fn(),
  anularFactura: vi.fn(),
  actualizarFactura: vi.fn(),
};

const protect = vi.fn();
const trackActivity = vi.fn();
const inactivityGuard = vi.fn();
const auditarOperacion = vi.fn((...args) => ({
  middleware: 'auditarOperacion',
  args,
}));

const authorize = vi.fn((...roles) => ({
  middleware: 'authorize',
  roles,
}));

const validateBody = vi.fn((schema) => ({
  middleware: 'validateBody',
  schema,
}));

const crearFacturaManualSchema = { name: 'crearFacturaManualSchema' };
const crearDesdePedidoSchema = { name: 'crearDesdePedidoSchema' };
const actualizarFacturaSchema = { name: 'actualizarFacturaSchema' };
const anularFacturaSchema = { name: 'anularFacturaSchema' };

const originalLoad = Module._load;

const routerPath = require.resolve(
  `${process.cwd()}/src/modules/comercial/facturacion/facturacion.routes.js`
);

delete require.cache[routerPath];

Module._load = function (request, parent, isMain) {
  if (request === 'express') return express;
  if (request === './facturacion.controller') return ctrl;

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

  if (request === '../../../shared/validators/facturacion.validators') {
    return {
      crearFacturaManualSchema,
      crearDesdePedidoSchema,
      actualizarFacturaSchema,
      anularFacturaSchema,
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const router = require(routerPath);

Module._load = originalLoad;

describe('facturacion.routes', () => {
  it('debe crear el router de Express', () => {
    expect(express.Router).toHaveBeenCalledTimes(1);
    expect(router).toBe(routes);
  });

  it('debe aplicar protect y trackActivity a todas las rutas mediante router.use', () => {
    expect(routes.use).toHaveBeenCalledTimes(1);
    expect(routes.use).toHaveBeenCalledWith(protect, trackActivity);
  });

  it('debe registrar GET /estadisticas para ADMIN y VENDEDOR', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/estadisticas',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      ctrl.obtenerEstadisticas
    );
  });

  it('debe registrar GET /resumen-periodo para ADMIN y VENDEDOR', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/resumen-periodo',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      ctrl.obtenerResumenPeriodo
    );
  });

  it('debe registrar GET /siguiente-numero para ADMIN y VENDEDOR', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/siguiente-numero',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      ctrl.obtenerSiguienteNumero
    );
  });

  it('debe registrar GET /validar-pedido/:pedidoId para ADMIN y VENDEDOR', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/validar-pedido/:pedidoId',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      ctrl.validarPedidoFacturable
    );
  });

  it('debe registrar GET /pedidos-cliente/:clienteId antes de /:id', () => {
    const pedidosClienteIndex = routes.get.mock.calls.findIndex(
      ([path]) => path === '/pedidos-cliente/:clienteId'
    );

    const parametroIdIndex = routes.get.mock.calls.findIndex(
      ([path]) => path === '/:id'
    );

    expect(pedidosClienteIndex).toBeGreaterThanOrEqual(0);
    expect(parametroIdIndex).toBeGreaterThanOrEqual(0);
    expect(pedidosClienteIndex).toBeLessThan(parametroIdIndex);

    expect(routes.get.mock.calls[pedidosClienteIndex]).toEqual([
      '/pedidos-cliente/:clienteId',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      ctrl.getPedidosParaFacturar,
    ]);
  });

  it('debe registrar GET / para listar facturas', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      ctrl.listarFacturas
    );
  });

  it('debe registrar POST / con inactivityGuard y validación del schema manual', () => {
    expect(routes.post).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      inactivityGuard,
      expect.objectContaining({
        middleware: 'validateBody',
        schema: crearFacturaManualSchema,
      }),
      ctrl.crearFacturaManual
    );
  });

  it('debe registrar POST /desde-pedido con inactivityGuard y su schema', () => {
    expect(routes.post).toHaveBeenCalledWith(
      '/desde-pedido',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      inactivityGuard,
      expect.objectContaining({
        middleware: 'validateBody',
        schema: crearDesdePedidoSchema,
      }),
      ctrl.crearFacturaDesdePedido
    );
  });

  it('debe registrar GET /:id/pdf para ADMIN y VENDEDOR', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/:id/pdf',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      ctrl.descargarPDF
    );
  });

  it('debe registrar GET /:id para obtener una factura', () => {
    expect(routes.get).toHaveBeenCalledWith(
      '/:id',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN', 'VENDEDOR'],
      }),
      ctrl.obtenerFactura
    );
  });

  it('debe registrar PUT /:id/anular únicamente para ADMIN', () => {
    expect(routes.put).toHaveBeenCalledWith(
      '/:id/anular',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN'],
      }),
      inactivityGuard,
      expect.objectContaining({
        middleware: 'auditarOperacion',
        args: ['facturas'],
      }),
      expect.objectContaining({
        middleware: 'validateBody',
        schema: anularFacturaSchema,
      }),
      ctrl.anularFactura
    );
  });

  it('debe registrar PUT /:id para actualizar únicamente ADMIN', () => {
    expect(routes.put).toHaveBeenCalledWith(
      '/:id',
      expect.objectContaining({
        middleware: 'authorize',
        roles: ['ADMIN'],
      }),
      inactivityGuard,
      expect.objectContaining({
        middleware: 'validateBody',
        schema: actualizarFacturaSchema,
      }),
      ctrl.actualizarFactura
    );
  });

  it('debe usar ADMIN y VENDEDOR en las diez rutas correspondientes', () => {
    const llamadas = authorize.mock.calls.filter(
      ([...roles]) =>
        roles.length === 2 &&
        roles.includes('ADMIN') &&
        roles.includes('VENDEDOR')
    );

    expect(llamadas).toHaveLength(10);
  });

  it('debe usar únicamente ADMIN en anular y actualizar', () => {
    const llamadas = authorize.mock.calls.filter(
      ([...roles]) =>
        roles.length === 1 &&
        roles[0] === 'ADMIN'
    );

    expect(llamadas).toHaveLength(2);
  });

  it('debe usar inactivityGuard en las cuatro operaciones críticas', () => {
    const llamadas = [
      ...routes.post.mock.calls,
      ...routes.put.mock.calls,
    ];

    const conInactivityGuard = llamadas.filter((args) =>
      args.includes(inactivityGuard)
    );

    expect(conInactivityGuard).toHaveLength(4);
  });

  it('debe configurar auditarOperacion para facturas únicamente en anular', () => {
    expect(auditarOperacion).toHaveBeenCalledTimes(1);
    expect(auditarOperacion).toHaveBeenCalledWith('facturas');
  });

  it('debe crear los cuatro middlewares de validación con sus schemas correspondientes', () => {
    expect(validateBody).toHaveBeenCalledTimes(4);

    expect(validateBody).toHaveBeenCalledWith(crearFacturaManualSchema);
    expect(validateBody).toHaveBeenCalledWith(crearDesdePedidoSchema);
    expect(validateBody).toHaveBeenCalledWith(anularFacturaSchema);
    expect(validateBody).toHaveBeenCalledWith(actualizarFacturaSchema);
  });
});
