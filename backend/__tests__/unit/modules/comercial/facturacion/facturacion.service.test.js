import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const comprobanteService = {
  crearFactura: vi.fn(),
  crearFacturaDesdePedido: vi.fn(),
  actualizarFactura: vi.fn(),
  anularFactura: vi.fn(),
  obtenerFactura: vi.fn(),
  listarFacturas: vi.fn(),
  obtenerSiguienteNumero: vi.fn(),
  validarPedidoFacturable: vi.fn(),
  getPedidosParaFacturar: vi.fn(),
  obtenerEstadisticas: vi.fn(),
  obtenerResumenPeriodo: vi.fn(),
  descargarPDF: vi.fn(),
};

const originalLoad = Module._load;

const servicePath = require.resolve(
  `${process.cwd()}/src/modules/comercial/facturacion/facturacion.service.js`
);

delete require.cache[servicePath];

Module._load = function (request, parent, isMain) {
  if (request === '../../../shared/services/comprobanteService') {
    return comprobanteService;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const service = require(servicePath);

Module._load = originalLoad;

describe('facturacion.service', () => {
  it('debe reenviar exactamente el servicio de comprobantes', () => {
    expect(service).toBe(comprobanteService);
  });

  it('debe conservar todas las operaciones expuestas por comprobanteService', () => {
    expect(Object.keys(service)).toEqual(Object.keys(comprobanteService));

    for (const [nombre, funcion] of Object.entries(comprobanteService)) {
      expect(service[nombre]).toBe(funcion);
    }
  });
});
