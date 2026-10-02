import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const comprobanteService = {
  crearFacturaDesdePedido: vi.fn(),
  obtenerSiguienteSecuencia: vi.fn(),
};

const Facturacion = {
  crearFacturaConDetalle: vi.fn(),
  obtenerFacturaPorId: vi.fn(),
};

const Configuracion = {
  obtenerTasaIva: vi.fn(),
};

const validacionService = {
  validarIdentificacion: vi.fn(),
};

const logger = {
  info: vi.fn(),
};

const responseUtils = {
  successResponse: vi.fn((res, data, message, statusCode) => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
    return res;
  }),
  errorResponse: vi.fn((res, message, statusCode = 500, error = null) => {
    res.status(statusCode).json({
      success: false,
      message,
      error,
    });
    return res;
  }),
};

const originalLoad = Module._load;

const handlerPath = require.resolve(
  `${process.cwd()}/src/modules/comercial/facturacion/handlers/crearFactura.js`
);

delete require.cache[handlerPath];

Module._load = function (request, parent, isMain) {
  if (request === '../facturacion.service') {
    return comprobanteService;
  }

  if (request === '../facturacion.repository') {
    return Facturacion;
  }

  if (request === '../../../configuracion/configuracion.repository') {
    return Configuracion;
  }

  if (request === '../../../../shared/services/validacionService') {
    return validacionService;
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
  crearFacturaDesdePedido,
  crearFacturaManual,
} = require(handlerPath);

Module._load = originalLoad;

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

describe('facturacion handlers/crearFactura', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Configuracion.obtenerTasaIva.mockResolvedValue(0.15);

    comprobanteService.obtenerSiguienteSecuencia.mockResolvedValue({
      numeroFormateado: '001-001-000000123',
      claveAcceso: '123456789',
    });

    Facturacion.crearFacturaConDetalle.mockResolvedValue(25);
    Facturacion.obtenerFacturaPorId.mockResolvedValue({
      id: 25,
      numero_factura: '001-001-000000123',
      total: 115,
    });

    validacionService.validarIdentificacion.mockReturnValue({
      valida: true,
      mensaje: 'Identificación válida',
    });
  });

  describe('crearFacturaDesdePedido', () => {
    it('debe rechazar la solicitud cuando no existe pedidoId', async () => {
      const req = {
        body: {},
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaDesdePedido(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'El pedidoId es requerido',
        400
      );
      expect(comprobanteService.crearFacturaDesdePedido).not.toHaveBeenCalled();
    });

    it('debe rechazar la solicitud cuando no existe usuario autenticado', async () => {
      const req = {
        body: { pedidoId: 50 },
        user: {},
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaDesdePedido(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Usuario no autenticado',
        401
      );
      expect(comprobanteService.crearFacturaDesdePedido).not.toHaveBeenCalled();
    });

    it('debe crear la factura desde pedido con los datos recibidos', async () => {
      const req = {
        body: {
          pedidoId: 50,
          datosAdicionales: {
            observaciones: 'Pago inmediato',
          },
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      const factura = {
        id: 80,
        numero: '001-001-000000080',
      };

      comprobanteService.crearFacturaDesdePedido.mockResolvedValue(factura);

      await crearFacturaDesdePedido(req, res);

      expect(
        comprobanteService.crearFacturaDesdePedido
      ).toHaveBeenCalledWith(
        50,
        10,
        { observaciones: 'Pago inmediato' },
        3
      );

      expect(logger.info).toHaveBeenCalledWith(
        'FACTURA_CREADA_DESDE_PEDIDO',
        {
          event: 'facturacion.creada_desde_pedido',
          pedidoId: 50,
          empresaId: 3,
          userId: 10,
        }
      );

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        factura,
        'Factura creada exitosamente',
        201
      );
    });

    it('debe usar objeto vacío cuando datosAdicionales no se proporciona', async () => {
      const req = {
        body: {
          pedidoId: 51,
        },
        user: { id: 11 },
        empresaId: 4,
      };
      const res = createResponse();

      comprobanteService.crearFacturaDesdePedido.mockResolvedValue({
        id: 81,
      });

      await crearFacturaDesdePedido(req, res);

      expect(
        comprobanteService.crearFacturaDesdePedido
      ).toHaveBeenCalledWith(51, 11, {}, 4);
    });

    it('debe manejar errores del servicio al crear desde pedido', async () => {
      const req = {
        body: {
          pedidoId: 52,
        },
        user: { id: 12 },
        empresaId: 5,
      };
      const res = createResponse();

      const error = new Error('Pedido no facturable');
      comprobanteService.crearFacturaDesdePedido.mockRejectedValue(error);

      await crearFacturaDesdePedido(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Pedido no facturable',
        500,
        error
      );
    });

    it('debe usar el mensaje genérico cuando el error no tiene message', async () => {
      const req = {
        body: {
          pedidoId: 53,
        },
        user: { id: 13 },
        empresaId: 6,
      };
      const res = createResponse();

      comprobanteService.crearFacturaDesdePedido.mockRejectedValue({});

      await crearFacturaDesdePedido(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al crear factura',
        500,
        {}
      );
    });
  });

  describe('crearFacturaManual', () => {
    it('debe rechazar cuando no existe usuario autenticado', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: [{ descripcion: 'Ventana', cantidad: 1 }],
        },
        user: {},
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Usuario no autenticado',
        401
      );
    });

    it('debe rechazar cuando el nombre del cliente está vacío', async () => {
      const req = {
        body: {
          cliente_nombre: '   ',
          items: [{ descripcion: 'Ventana', cantidad: 1 }],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'El nombre del cliente es requerido',
        400
      );
    });

    it('debe rechazar cuando no existen items', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Debe incluir al menos un item',
        400
      );
    });

    it('debe rechazar cuando items no es un arreglo', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: {},
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Debe incluir al menos un item',
        400
      );
    });

    it('debe rechazar cuando el arreglo de items está vacío', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: [],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Debe incluir al menos un item',
        400
      );
    });

    it('debe rechazar una identificación inválida', async () => {
      validacionService.validarIdentificacion.mockReturnValue({
        valida: false,
        mensaje: 'Cédula inválida',
      });

      const req = {
        body: {
          cliente_nombre: 'Juan',
          cliente_identificacion: ' 1234567890 ',
          cliente_tipo_identificacion: 'CEDULA',
          items: [{ descripcion: 'Puerta', cantidad: 1 }],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(
        validacionService.validarIdentificacion
      ).toHaveBeenCalledWith('1234567890', 'CEDULA');

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Cédula inválida',
        400
      );
    });

    it('debe aceptar identificación válida y calcular los valores de la factura', async () => {
      const req = {
        body: {
          cliente_id: 7,
          cliente_nombre: '  Juan Pérez  ',
          cliente_identificacion: ' 1234567890 ',
          cliente_tipo_identificacion: 'CEDULA',
          cliente_direccion: '  Calle Principal ',
          cliente_telefono: ' 0999999999 ',
          cliente_email: ' juan@example.com ',
          pedido_id: 20,
          observaciones: '  Entrega urgente ',
          items: [
            {
              material_id: 4,
              descripcion: '  Ventana de aluminio ',
              cantidad: '2',
              precio_unitario: '50',
              descuento: '10',
              porcentaje_iva: '15',
              detalles_adicionales: {
                ancho: 1.5,
              },
            },
            {
              material_id: 5,
              descripcion: 'Vidrio',
              cantidad: 1,
              precio_unitario: 20,
              descuento: 0,
              porcentaje_iva: 0,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(Configuracion.obtenerTasaIva).toHaveBeenCalledWith(3);

      expect(
        comprobanteService.obtenerSiguienteSecuencia
      ).toHaveBeenCalledWith(
        'FACTURA',
        '001',
        '001',
        3
      );

      expect(Facturacion.crearFacturaConDetalle).toHaveBeenCalledTimes(1);

      const [facturaData, itemsCalculados] =
        Facturacion.crearFacturaConDetalle.mock.calls[0];

      expect(facturaData).toMatchObject({
        empresa_id: 3,
        numero_factura: '001-001-000000123',
        clave_acceso: '123456789',
        pedido_id: 20,
        cliente_id: 7,
        usuario_id: 10,
        cliente_nombre: 'Juan Pérez',
        cliente_identificacion: '1234567890',
        cliente_tipo_identificacion: 'CEDULA',
        cliente_direccion: 'Calle Principal',
        cliente_telefono: '0999999999',
        cliente_email: 'juan@example.com',
        subtotal_sin_iva: 20,
        subtotal_con_iva: 90,
        iva: 13.5,
        total: 123.5,
        descuento: 0,
        propina: 0,
        estado: 'EMITIDA',
        estado_sri: 'SIN_ENVIAR',
        observaciones: 'Entrega urgente',
      });

      expect(itemsCalculados).toEqual([
        {
          material_id: 4,
          descripcion: 'Ventana de aluminio',
          cantidad: 2,
          precio_unitario: 50,
          descuento: 10,
          precio_total_sin_iva: 90,
          porcentaje_iva: 15,
          valor_iva: 13.5,
          detalles_adicionales: {
            ancho: 1.5,
          },
        },
        {
          material_id: 5,
          descripcion: 'Vidrio',
          cantidad: 1,
          precio_unitario: 20,
          descuento: 0,
          precio_total_sin_iva: 20,
          porcentaje_iva: 0,
          valor_iva: 0,
          detalles_adicionales: null,
        },
      ]);

      expect(Facturacion.obtenerFacturaPorId).toHaveBeenCalledWith(25, 3);

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        {
          id: 25,
          numero_factura: '001-001-000000123',
          total: 115,
        },
        'Factura creada exitosamente',
        201
      );
    });

    it('debe usar la tasa de IVA configurada cuando el item no define porcentaje_iva', async () => {
      Configuracion.obtenerTasaIva.mockResolvedValue(0.12);

      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: [
            {
              descripcion: 'Puerta',
              cantidad: 2,
              precio_unitario: 100,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 8,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      const [, itemsCalculados] =
        Facturacion.crearFacturaConDetalle.mock.calls[0];

      expect(itemsCalculados[0]).toMatchObject({
        descripcion: 'Puerta',
        cantidad: 2,
        precio_unitario: 100,
        descuento: 0,
        precio_total_sin_iva: 200,
        porcentaje_iva: 12,
        valor_iva: 24,
        detalles_adicionales: null,
      });
    });

    it('debe usar consumidor final por defecto cuando no se especifica tipo de identificación', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente final',
          cliente_identificacion: '9999999999999',
          items: [
            {
              descripcion: 'Vidrio',
              cantidad: 1,
              precio_unitario: 10,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 9,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(
        validacionService.validarIdentificacion
      ).not.toHaveBeenCalled();

      const [facturaData] =
        Facturacion.crearFacturaConDetalle.mock.calls[0];

      expect(facturaData.cliente_tipo_identificacion).toBe(
        'CONSUMIDOR_FINAL'
      );
    });

    it('debe permitir una identificación opcional vacía para un tipo distinto de consumidor final', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          cliente_tipo_identificacion: 'CEDULA',
          cliente_identificacion: '   ',
          items: [
            {
              descripcion: 'Vidrio',
              cantidad: 1,
              precio_unitario: 10,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 10,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(
        validacionService.validarIdentificacion
      ).not.toHaveBeenCalled();

      expect(Facturacion.crearFacturaConDetalle).toHaveBeenCalled();
    });

    it('debe rechazar un item sin descripción', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: [
            {
              descripcion: '   ',
              cantidad: 1,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Item 1: la descripción es requerida',
        400
      );
    });

    it('debe rechazar un item con cantidad cero', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: [
            {
              descripcion: 'Vidrio',
              cantidad: 0,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Item 1: la cantidad debe ser mayor a 0',
        400
      );
    });

    it('debe rechazar un item con cantidad negativa', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: [
            {
              descripcion: 'Vidrio',
              cantidad: -1,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Item 1: la cantidad debe ser mayor a 0',
        400
      );
    });

    it('debe rechazar un item con precio negativo', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: [
            {
              descripcion: 'Vidrio',
              cantidad: 1,
              precio_unitario: -5,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Item 1: el precio no puede ser negativo',
        400
      );
    });

    it('debe aceptar precio unitario omitido y mantener valores nulos como null', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          cliente_identificacion: null,
          cliente_direccion: null,
          cliente_telefono: null,
          cliente_email: null,
          pedido_id: null,
          observaciones: null,
          items: [
            {
              material_id: null,
              descripcion: 'Servicio',
              cantidad: 1,
              precio_unitario: null,
              descuento: null,
              porcentaje_iva: null,
              detalles_adicionales: null,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      const [facturaData, itemsCalculados] =
        Facturacion.crearFacturaConDetalle.mock.calls[0];

      expect(facturaData).toMatchObject({
        pedido_id: null,
        cliente_id: null,
        cliente_identificacion: null,
        cliente_direccion: null,
        cliente_telefono: null,
        cliente_email: null,
        observaciones: null,
      });

      expect(itemsCalculados[0]).toMatchObject({
        material_id: null,
        precio_unitario: 0,
        descuento: 0,
        porcentaje_iva: 15,
        precio_total_sin_iva: 0,
        valor_iva: 0,
        detalles_adicionales: null,
      });
    });

    it('debe manejar descuento superior al subtotal sin generar subtotal negativo', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: [
            {
              descripcion: 'Material',
              cantidad: 1,
              precio_unitario: 10,
              descuento: 50,
              porcentaje_iva: 15,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      const [facturaData, itemsCalculados] =
        Facturacion.crearFacturaConDetalle.mock.calls[0];

      expect(itemsCalculados[0].precio_total_sin_iva).toBe(0);
      expect(itemsCalculados[0].valor_iva).toBe(0);
      expect(facturaData.total).toBe(0);
    });

    it('debe manejar clave de acceso ausente en la secuencia', async () => {
      comprobanteService.obtenerSiguienteSecuencia.mockResolvedValue({
        numeroFormateado: '001-001-000000999',
      });

      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: [
            {
              descripcion: 'Material',
              cantidad: 1,
              precio_unitario: 10,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      await crearFacturaManual(req, res);

      const [facturaData] =
        Facturacion.crearFacturaConDetalle.mock.calls[0];

      expect(facturaData.clave_acceso).toBeNull();
    });

    it('debe manejar errores durante la creación manual', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: [
            {
              descripcion: 'Material',
              cantidad: 1,
              precio_unitario: 10,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      const error = new Error('Error de base de datos');
      Configuracion.obtenerTasaIva.mockRejectedValue(error);

      await crearFacturaManual(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error de base de datos',
        500,
        error
      );
    });

    it('debe usar mensaje genérico cuando ocurre una excepción sin message', async () => {
      const req = {
        body: {
          cliente_nombre: 'Cliente',
          items: [
            {
              descripcion: 'Material',
              cantidad: 1,
              precio_unitario: 10,
            },
          ],
        },
        user: { id: 10 },
        empresaId: 3,
      };
      const res = createResponse();

      Configuracion.obtenerTasaIva.mockRejectedValue({});

      await crearFacturaManual(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al crear factura',
        500,
        {}
      );
    });
  });
});
