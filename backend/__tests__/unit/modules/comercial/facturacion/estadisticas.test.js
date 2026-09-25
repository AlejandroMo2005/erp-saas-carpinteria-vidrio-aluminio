import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const Facturacion = {
  obtenerResumenFacturacion: vi.fn(),
  obtenerFacturasPorEstado: vi.fn(),
  obtenerTopClientes: vi.fn(),
  obtenerFacturacionMensual: vi.fn(),
  obtenerResumenMesAnterior: vi.fn(),
};

const responseUtils = {
  successResponse: vi.fn(),
  errorResponse: vi.fn(),
};

const originalLoad = Module._load;

const handlerPath = require.resolve(
  `${process.cwd()}/src/modules/comercial/facturacion/handlers/estadisticas.js`
);

delete require.cache[handlerPath];

Module._load = function (request, parent, isMain) {
  if (request === '../facturacion.repository') {
    return Facturacion;
  }

  if (request === './utils') {
    return responseUtils;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const {
  obtenerEstadisticas,
  obtenerResumenPeriodo,
} = require(handlerPath);

Module._load = originalLoad;

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

describe('facturacion handlers/estadisticas', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Facturacion.obtenerResumenFacturacion.mockResolvedValue([
      [
        {
          total_facturado: '1500.50',
          total_facturas: '12',
          ticket_promedio: '125.04',
          clientes_unicos: '8',
        },
      ],
    ]);

    Facturacion.obtenerFacturasPorEstado.mockResolvedValue([
      [
        { estado: 'EMITIDA', cantidad: 8, total: '1000.00' },
        { estado: 'ANULADA', cantidad: 2, total: '200.00' },
      ],
    ]);

    Facturacion.obtenerTopClientes.mockResolvedValue([
      [
        { cliente: 'Cliente A', total: '500.00' },
      ],
    ]);

    Facturacion.obtenerFacturacionMensual.mockResolvedValue([
      [
        { mes: '2026-01', total: '750.00' },
      ],
    ]);

    Facturacion.obtenerResumenMesAnterior.mockResolvedValue([
      [
        {
          total_facturado: '1000',
          total_facturas: '10',
        },
      ],
    ]);
  });

  describe('obtenerEstadisticas', () => {
    it('debe obtener estadísticas con fechas proporcionadas', async () => {
      const req = {
        query: {
          fechaDesde: '2026-01-01',
          fechaHasta: '2026-06-30',
        },
        empresaId: 7,
      };
      const res = createResponse();

      await obtenerEstadisticas(req, res);

      expect(
        Facturacion.obtenerResumenFacturacion
      ).toHaveBeenCalledWith(
        '2026-01-01',
        '2026-06-30',
        7
      );

      expect(
        Facturacion.obtenerFacturasPorEstado
      ).toHaveBeenCalledWith(
        '2026-01-01',
        '2026-06-30',
        7
      );

      expect(
        Facturacion.obtenerTopClientes
      ).toHaveBeenCalledWith(
        '2026-01-01',
        '2026-06-30',
        10,
        7
      );

      expect(
        Facturacion.obtenerFacturacionMensual
      ).toHaveBeenCalledWith(
        '2026-01-01',
        '2026-06-30',
        7
      );

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        {
          facturacionMensual: [
            { mes: '2026-01', total: '750.00' },
          ],
          distribucionEstados: [
            { estado: 'EMITIDA', cantidad: 8, total: '1000.00' },
            { estado: 'ANULADA', cantidad: 2, total: '200.00' },
          ],
          topClientes: [
            { cliente: 'Cliente A', total: '500.00' },
          ],
          periodo: {
            desde: '2026-01-01',
            hasta: '2026-06-30',
          },
        }
      );
    });

    it('debe generar fechas por defecto cuando no se proporcionan', async () => {
      const req = {
        query: {},
        empresaId: 9,
      };
      const res = createResponse();

      await obtenerEstadisticas(req, res);

      const [fechaDesde, fechaHasta] =
        Facturacion.obtenerResumenFacturacion.mock.calls[0];

      expect(fechaDesde).toMatch(/^\d{4}-01-01$/);
      expect(fechaHasta).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      expect(
        Facturacion.obtenerFacturasPorEstado
      ).toHaveBeenCalledWith(
        fechaDesde,
        fechaHasta,
        9
      );

      expect(
        Facturacion.obtenerTopClientes
      ).toHaveBeenCalledWith(
        fechaDesde,
        fechaHasta,
        10,
        9
      );

      expect(
        Facturacion.obtenerFacturacionMensual
      ).toHaveBeenCalledWith(
        fechaDesde,
        fechaHasta,
        9
      );
    });

    it('debe mapear solamente los campos esperados de los estados', async () => {
      Facturacion.obtenerFacturasPorEstado.mockResolvedValue([
        [
          {
            estado: 'EMITIDA',
            cantidad: 5,
            total: '500',
            campo_extra: 'no debe exponerse',
          },
        ],
      ]);

      const req = {
        query: {
          fechaDesde: '2026-02-01',
          fechaHasta: '2026-02-28',
        },
        empresaId: 3,
      };
      const res = createResponse();

      await obtenerEstadisticas(req, res);

      const data = responseUtils.successResponse.mock.calls[0][1];

      expect(data.distribucionEstados).toEqual([
        {
          estado: 'EMITIDA',
          cantidad: 5,
          total: '500',
        },
      ]);
    });

    it('debe manejar errores al obtener estadísticas', async () => {
      const error = new Error('Error de base de datos');

      Facturacion.obtenerResumenFacturacion.mockRejectedValue(error);

      const req = {
        query: {},
        empresaId: 4,
      };
      const res = createResponse();

      await obtenerEstadisticas(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al obtener estadísticas',
        500,
        error
      );
    });
  });

  describe('obtenerResumenPeriodo', () => {
    it('debe calcular el resumen y las variaciones respecto al mes anterior', async () => {
      const req = {
        query: {
          fechaDesde: '2026-06-01',
          fechaHasta: '2026-06-30',
        },
        empresaId: 7,
      };
      const res = createResponse();

      await obtenerResumenPeriodo(req, res);

      expect(
        Facturacion.obtenerResumenFacturacion
      ).toHaveBeenCalledWith(
        '2026-06-01',
        '2026-06-30',
        7
      );

      expect(
        Facturacion.obtenerResumenMesAnterior
      ).toHaveBeenCalledWith(7);

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        {
          totalFacturado: 1500.5,
          totalFacturas: 12,
          ticketPromedio: 125.04,
          clientesUnicos: 8,
          variacionVsMesAnterior: 50,
          variacionFacturas: 20,
          periodo: {
            desde: '2026-06-01',
            hasta: '2026-06-30',
          },
        }
      );
    });

    it('debe generar fechas por defecto en el resumen', async () => {
      const req = {
        query: {},
        empresaId: 11,
      };
      const res = createResponse();

      await obtenerResumenPeriodo(req, res);

      const [fechaDesde, fechaHasta] =
        Facturacion.obtenerResumenFacturacion.mock.calls[0];

      expect(fechaDesde).toMatch(/^\d{4}-01-01$/);
      expect(fechaHasta).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          periodo: {
            desde: fechaDesde,
            hasta: fechaHasta,
          },
        })
      );
    });

    it('debe devolver null en las variaciones cuando el valor anterior es cero', async () => {
      Facturacion.obtenerResumenFacturacion.mockResolvedValue([
        [
          {
            total_facturado: '500',
            total_facturas: '5',
            ticket_promedio: '100',
            clientes_unicos: '3',
          },
        ],
      ]);

      Facturacion.obtenerResumenMesAnterior.mockResolvedValue([
        [
          {
            total_facturado: '0',
            total_facturas: '0',
          },
        ],
      ]);

      const req = {
        query: {
          fechaDesde: '2026-07-01',
          fechaHasta: '2026-07-31',
        },
        empresaId: 12,
      };
      const res = createResponse();

      await obtenerResumenPeriodo(req, res);

      const data = responseUtils.successResponse.mock.calls[0][1];

      expect(data.variacionVsMesAnterior).toBeNull();
      expect(data.variacionFacturas).toBeNull();
    });

    it('debe usar objetos vacíos cuando no existen filas en los resultados', async () => {
      Facturacion.obtenerResumenFacturacion.mockResolvedValue([[]]);
      Facturacion.obtenerResumenMesAnterior.mockResolvedValue([[]]);

      const req = {
        query: {
          fechaDesde: '2026-08-01',
          fechaHasta: '2026-08-31',
        },
        empresaId: 13,
      };
      const res = createResponse();

      await obtenerResumenPeriodo(req, res);

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        {
          totalFacturado: 0,
          totalFacturas: 0,
          ticketPromedio: 0,
          clientesUnicos: 0,
          variacionVsMesAnterior: null,
          variacionFacturas: null,
          periodo: {
            desde: '2026-08-01',
            hasta: '2026-08-31',
          },
        }
      );
    });

    it('debe manejar errores al obtener el resumen', async () => {
      const error = new Error('Consulta fallida');

      Facturacion.obtenerResumenMesAnterior.mockRejectedValue(error);

      const req = {
        query: {},
        empresaId: 14,
      };
      const res = createResponse();

      await obtenerResumenPeriodo(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al obtener resumen',
        500,
        error
      );
    });
  });
});
