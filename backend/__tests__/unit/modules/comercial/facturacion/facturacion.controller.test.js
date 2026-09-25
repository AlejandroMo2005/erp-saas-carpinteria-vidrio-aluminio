import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const handlers = {
  getFacturas: {
    listarFacturas: vi.fn(),
    obtenerFactura: vi.fn(),
    obtenerSiguienteNumero: vi.fn(),
    validarPedidoFacturable: vi.fn(),
    getPedidosParaFacturar: vi.fn(),
  },
  estadisticas: {
    obtenerEstadisticas: vi.fn(),
    obtenerResumenPeriodo: vi.fn(),
  },
  crearFactura: {
    crearFacturaManual: vi.fn(),
    crearFacturaDesdePedido: vi.fn(),
  },
  mutarFactura: {
    actualizarFactura: vi.fn(),
    anularFactura: vi.fn(),
    descargarPDF: vi.fn(),
  },
};

const originalLoad = Module._load;

const controllerPath = require.resolve(
  `${process.cwd()}/src/modules/comercial/facturacion/facturacion.controller.js`
);

delete require.cache[controllerPath];

Module._load = function (request, parent, isMain) {
  if (request === './handlers/getFacturas') return handlers.getFacturas;
  if (request === './handlers/estadisticas') return handlers.estadisticas;
  if (request === './handlers/crearFactura') return handlers.crearFactura;
  if (request === './handlers/mutarFactura') return handlers.mutarFactura;

  return originalLoad.call(this, request, parent, isMain);
};

const controller = require(controllerPath);

Module._load = originalLoad;

describe('facturacion.controller', () => {
  it('debe exportar todos los handlers públicos del módulo', () => {
    expect(Object.keys(controller)).toEqual([
      'listarFacturas',
      'obtenerFactura',
      'obtenerSiguienteNumero',
      'validarPedidoFacturable',
      'getPedidosParaFacturar',
      'obtenerEstadisticas',
      'obtenerResumenPeriodo',
      'crearFacturaManual',
      'crearFacturaDesdePedido',
      'actualizarFactura',
      'anularFactura',
      'descargarPDF',
    ]);
  });

  it('debe reenviar las referencias exactas de los handlers', () => {
    expect(controller.listarFacturas).toBe(handlers.getFacturas.listarFacturas);
    expect(controller.obtenerFactura).toBe(handlers.getFacturas.obtenerFactura);
    expect(controller.obtenerSiguienteNumero).toBe(handlers.getFacturas.obtenerSiguienteNumero);
    expect(controller.validarPedidoFacturable).toBe(handlers.getFacturas.validarPedidoFacturable);
    expect(controller.getPedidosParaFacturar).toBe(handlers.getFacturas.getPedidosParaFacturar);

    expect(controller.obtenerEstadisticas).toBe(handlers.estadisticas.obtenerEstadisticas);
    expect(controller.obtenerResumenPeriodo).toBe(handlers.estadisticas.obtenerResumenPeriodo);

    expect(controller.crearFacturaManual).toBe(handlers.crearFactura.crearFacturaManual);
    expect(controller.crearFacturaDesdePedido).toBe(handlers.crearFactura.crearFacturaDesdePedido);

    expect(controller.actualizarFactura).toBe(handlers.mutarFactura.actualizarFactura);
    expect(controller.anularFactura).toBe(handlers.mutarFactura.anularFactura);
    expect(controller.descargarPDF).toBe(handlers.mutarFactura.descargarPDF);
  });
});
