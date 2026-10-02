import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const Facturacion = {
  obtenerFacturas: vi.fn(),
  contarFacturas: vi.fn(),
};

const comprobanteService = {
  obtenerFacturaPorId: vi.fn(),
  obtenerSiguienteSecuencia: vi.fn(),
};

const database = {
  query: vi.fn(),
};

const logger = {
  info: vi.fn(),
};

const responseUtils = {
  successResponse: vi.fn(),
  errorResponse: vi.fn(),
};

const originalLoad = Module._load;

const handlerPath = require.resolve(
  `${process.cwd()}/src/modules/comercial/facturacion/handlers/getFacturas.js`
);

delete require.cache[handlerPath];

Module._load = function (request, parent, isMain) {
  if (request === '../facturacion.repository') {
    return Facturacion;
  }

  if (request === '../facturacion.service') {
    return comprobanteService;
  }

  if (request === '../../../../config/database.js') {
    return database;
  }

  if (request === '../../../../shared/utils/logger') {
    return logger;
  }

  if (request === './utils') {
    return responseUtils;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const {
  listarFacturas,
  obtenerFactura,
  obtenerSiguienteNumero,
  validarPedidoFacturable,
  getPedidosParaFacturar,
} = require(handlerPath);

Module._load = originalLoad;

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

describe('facturacion handlers/getFacturas', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Facturacion.obtenerFacturas.mockResolvedValue([
      [
        {
          id: 1,
          numero_factura: '001-001-000000001',
          total: 100,
        },
      ],
    ]);

    Facturacion.contarFacturas.mockResolvedValue([
      [
        {
          total: 21,
        },
      ],
    ]);

    comprobanteService.obtenerFacturaPorId.mockResolvedValue({
      id: 1,
      numero_factura: '001-001-000000001',
      total: 100,
    });

    comprobanteService.obtenerSiguienteSecuencia.mockResolvedValue({
      numeroFormateado: '001-001-000000025',
      secuencia: 25,
    });

    database.query.mockResolvedValue([
      [
        {
          id: 10,
          fecha: '2026-09-20',
          estado: 'ENTREGADO',
          total: '250.00',
          proforma_id: 5,
          cliente_nombre: 'Juan Pérez',
          trabajos_nombres: 'Ventana, Puerta',
        },
      ],
    ]);
  });

  describe('listarFacturas', () => {
    it('debe listar facturas aplicando filtros y paginación', async () => {
      const req = {
        query: {
          fechaDesde: '2026-09-01',
          fechaHasta: '2026-09-24',
          estado: 'EMITIDA',
          estadoSRI: 'AUTORIZADO',
          clienteNombre: 'Juan',
          numeroFactura: '001-001',
          pagina: '2',
          limite: '10',
        },
        empresaId: 7,
      };
      const res = createResponse();

      await listarFacturas(req, res);

      expect(Facturacion.obtenerFacturas).toHaveBeenCalledWith(
        {
          fechaDesde: '2026-09-01',
          fechaHasta: '2026-09-24',
          estado: 'EMITIDA',
          estadoSRI: 'AUTORIZADO',
          clienteNombre: 'Juan',
          numeroFactura: '001-001',
          empresaId: 7,
        },
        {
          limite: 10,
          offset: 10,
        }
      );

      expect(Facturacion.contarFacturas).toHaveBeenCalledWith({
        fechaDesde: '2026-09-01',
        fechaHasta: '2026-09-24',
        estado: 'EMITIDA',
        estadoSRI: 'AUTORIZADO',
        clienteNombre: 'Juan',
        numeroFactura: '001-001',
        empresaId: 7,
      });

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        {
          facturas: [
            {
              id: 1,
              numero_factura: '001-001-000000001',
              total: 100,
            },
          ],
          paginacion: {
            pagina: 2,
            limite: 10,
            total: 21,
            totalPaginas: 3,
          },
        }
      );
    });

    it('debe usar página 1 y límite 20 por defecto', async () => {
      const req = {
        query: {},
        empresaId: 3,
      };
      const res = createResponse();

      await listarFacturas(req, res);

      expect(Facturacion.obtenerFacturas).toHaveBeenCalledWith(
        {
          fechaDesde: undefined,
          fechaHasta: undefined,
          estado: undefined,
          estadoSRI: undefined,
          clienteNombre: undefined,
          numeroFactura: undefined,
          empresaId: 3,
        },
        {
          limite: 20,
          offset: 0,
        }
      );

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          paginacion: expect.objectContaining({
            pagina: 1,
            limite: 20,
            total: 21,
            totalPaginas: 2,
          }),
        })
      );
    });

    it('debe manejar errores al listar facturas', async () => {
      const error = new Error('Error de consulta');

      Facturacion.obtenerFacturas.mockRejectedValue(error);

      const req = {
        query: {},
        empresaId: 4,
      };
      const res = createResponse();

      await listarFacturas(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al listar facturas',
        500,
        error
      );
    });
  });

  describe('obtenerFactura', () => {
    it('debe devolver la factura encontrada', async () => {
      const factura = {
        id: 25,
        numero_factura: '001-001-000000025',
        total: 350,
      };

      comprobanteService.obtenerFacturaPorId.mockResolvedValue(factura);

      const req = {
        params: { id: '25' },
        empresaId: 8,
      };
      const res = createResponse();

      await obtenerFactura(req, res);

      expect(
        comprobanteService.obtenerFacturaPorId
      ).toHaveBeenCalledWith('25', 8);

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        factura
      );
    });

    it('debe devolver 404 cuando la factura no existe', async () => {
      comprobanteService.obtenerFacturaPorId.mockResolvedValue(null);

      const req = {
        params: { id: '999' },
        empresaId: 8,
      };
      const res = createResponse();

      await obtenerFactura(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Factura no encontrada',
        404
      );
    });

    it('debe manejar errores al obtener una factura', async () => {
      const error = new Error('Error de base de datos');

      comprobanteService.obtenerFacturaPorId.mockRejectedValue(error);

      const req = {
        params: { id: '25' },
        empresaId: 8,
      };
      const res = createResponse();

      await obtenerFactura(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al obtener factura',
        500,
        error
      );
    });
  });

  describe('obtenerSiguienteNumero', () => {
    it('debe obtener la siguiente secuencia con los valores proporcionados', async () => {
      const req = {
        query: {
          establecimiento: '002',
          puntoEmision: '003',
        },
        empresaId: 5,
      };
      const res = createResponse();

      await obtenerSiguienteNumero(req, res);

      expect(
        comprobanteService.obtenerSiguienteSecuencia
      ).toHaveBeenCalledWith(
        'FACTURA',
        '002',
        '003',
        5
      );

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        {
          numeroFormateado: '001-001-000000025',
          secuencia: 25,
          mensaje: 'Este número se asignará al crear la factura',
        }
      );
    });

    it('debe usar establecimiento y punto de emisión por defecto', async () => {
      const req = {
        query: {},
        empresaId: 6,
      };
      const res = createResponse();

      await obtenerSiguienteNumero(req, res);

      expect(
        comprobanteService.obtenerSiguienteSecuencia
      ).toHaveBeenCalledWith(
        'FACTURA',
        '001',
        '001',
        6
      );
    });

    it('debe manejar errores al obtener la siguiente secuencia', async () => {
      const error = new Error('Secuencia no disponible');

      comprobanteService.obtenerSiguienteSecuencia.mockRejectedValue(error);

      const req = {
        query: {},
        empresaId: 6,
      };
      const res = createResponse();

      await obtenerSiguienteNumero(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al obtener siguiente número',
        500,
        error
      );
    });
  });

  describe('validarPedidoFacturable', () => {
    it('debe indicar que el pedido no es facturable cuando ya tiene factura', async () => {
      Facturacion.obtenerFacturas.mockResolvedValue([
        [
          {
            numero_factura: '001-001-000000050',
          },
        ],
      ]);

      const req = {
        params: { pedidoId: '50' },
        empresaId: 7,
      };
      const res = createResponse();

      await validarPedidoFacturable(req, res);

      expect(Facturacion.obtenerFacturas).toHaveBeenCalledWith(
        {
          pedidoId: '50',
          empresaId: 7,
        },
        {
          limite: 1,
          offset: 0,
        }
      );

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        {
          facturable: false,
          razon: 'El pedido ya tiene una factura asociada',
          facturaExistente: '001-001-000000050',
        }
      );
    });

    it('debe indicar que el pedido puede ser facturado cuando no tiene factura', async () => {
      Facturacion.obtenerFacturas.mockResolvedValue([[]]);

      const req = {
        params: { pedidoId: '51' },
        empresaId: 7,
      };
      const res = createResponse();

      await validarPedidoFacturable(req, res);

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        {
          facturable: true,
          mensaje: 'El pedido puede ser facturado',
        }
      );
    });

    it('debe manejar errores al validar el pedido', async () => {
      const error = new Error('Consulta fallida');

      Facturacion.obtenerFacturas.mockRejectedValue(error);

      const req = {
        params: { pedidoId: '52' },
        empresaId: 7,
      };
      const res = createResponse();

      await validarPedidoFacturable(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al validar pedido',
        500,
        error
      );
    });
  });

  describe('getPedidosParaFacturar', () => {
    it('debe rechazar un ID de cliente no entero', async () => {
      const req = {
        params: { clienteId: 'abc' },
        empresaId: 3,
        user: { id: 10 },
      };
      const res = createResponse();

      await getPedidosParaFacturar(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'ID de cliente inválido',
        400
      );

      expect(database.query).not.toHaveBeenCalled();
    });

    it('debe rechazar un ID de cliente menor o igual a cero', async () => {
      const req = {
        params: { clienteId: '0' },
        empresaId: 3,
        user: { id: 10 },
      };
      const res = createResponse();

      await getPedidosParaFacturar(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'ID de cliente inválido',
        400
      );

      expect(database.query).not.toHaveBeenCalled();
    });

    it('debe obtener los pedidos facturables del cliente', async () => {
      const rows = [
        {
          id: 10,
          fecha: '2026-09-20',
          estado: 'ENTREGADO',
          total: '250.00',
          proforma_id: 5,
          cliente_nombre: 'Juan Pérez',
          trabajos_nombres: 'Ventana, Puerta',
        },
      ];

      database.query.mockResolvedValue([rows]);

      const req = {
        params: { clienteId: '15' },
        empresaId: 9,
        user: { id: 27 },
      };
      const res = createResponse();

      await getPedidosParaFacturar(req, res);

      expect(database.query).toHaveBeenCalledTimes(1);

      const [sql, params] = database.query.mock.calls[0];

      expect(sql).toContain('WHERE p.empresa_id  = ?');
      expect(sql).toContain('AND p.usuario_id  = ?');
      expect(sql).toContain("AND p.estado      = 'ENTREGADO'");
      expect(sql).toContain('AND p.deleted_at IS NULL');
      expect(sql).toContain('AND f.id         IS NULL');

      expect(params).toEqual([9, 15]);

      expect(logger.info).toHaveBeenCalledWith(
        'PEDIDOS_PARA_FACTURAR',
        {
          event: 'facturacion.pedidos_cliente',
          clienteId: 15,
          cantidad: 1,
          userId: 27,
        }
      );

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        rows,
        'Pedidos facturables obtenidos'
      );
    });

    it('debe registrar cantidad cero cuando no existen pedidos facturables', async () => {
      database.query.mockResolvedValue([[]]);

      const req = {
        params: { clienteId: '20' },
        empresaId: 10,
        user: {},
      };
      const res = createResponse();

      await getPedidosParaFacturar(req, res);

      expect(logger.info).toHaveBeenCalledWith(
        'PEDIDOS_PARA_FACTURAR',
        {
          event: 'facturacion.pedidos_cliente',
          clienteId: 20,
          cantidad: 0,
          userId: undefined,
        }
      );

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        [],
        'Pedidos facturables obtenidos'
      );
    });

    it('debe manejar errores de base de datos al obtener pedidos', async () => {
      const error = new Error('Error SQL');

      database.query.mockRejectedValue(error);

      const req = {
        params: { clienteId: '20' },
        empresaId: 10,
        user: { id: 30 },
      };
      const res = createResponse();

      await getPedidosParaFacturar(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al obtener pedidos del cliente',
        500,
        error
      );
    });
  });
});
