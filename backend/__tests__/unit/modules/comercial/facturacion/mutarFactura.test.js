import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const Facturacion = {
  obtenerFacturaPorId: vi.fn(),
  actualizarFactura: vi.fn(),
};

const comprobanteService = {
  anularFactura: vi.fn(),
  obtenerFacturaPorId: vi.fn(),
};

const logger = {
  info: vi.fn(),
};

const responseUtils = {
  successResponse: vi.fn(),
  errorResponse: vi.fn(),
};

const pdfService = {
  generarRIDE: vi.fn(),
  obtenerDatosEmpresa: vi.fn(),
};

const originalLoad = Module._load;

const handlerPath = require.resolve(
  `${process.cwd()}/src/modules/comercial/facturacion/handlers/mutarFactura.js`
);

const pdfServicePath = require.resolve(
  `${process.cwd()}/src/shared/services/pdfService.js`
);

delete require.cache[handlerPath];
delete require.cache[pdfServicePath];

require.cache[pdfServicePath] = {
  id: pdfServicePath,
  filename: pdfServicePath,
  loaded: true,
  exports: pdfService,
};

Module._load = function (request, parent, isMain) {
  if (request === '../facturacion.repository') {
    return Facturacion;
  }

  if (request === '../facturacion.service') {
    return comprobanteService;
  }

  if (request === '../../../shared/utils/logger') {
    return logger;
  }

  if (request === './utils') {
    return responseUtils;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const {
  actualizarFactura,
  anularFactura,
  descargarPDF,
} = require(handlerPath);

Module._load = originalLoad;

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
});

describe('facturacion handlers/mutarFactura', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Facturacion.obtenerFacturaPorId.mockResolvedValue({
      id: 15,
      numero_factura: '001-001-000000015',
      estado: 'EMITIDA',
      total: 250,
    });

    Facturacion.actualizarFactura.mockResolvedValue(undefined);

    comprobanteService.obtenerFacturaPorId.mockResolvedValue({
      id: 15,
      numero_factura: '001-001-000000015',
      estado: 'EMITIDA',
      total: 250,
    });

    comprobanteService.anularFactura.mockResolvedValue(undefined);

    pdfService.obtenerDatosEmpresa.mockReturnValue({
      razonSocial: 'Empresa de Prueba',
      ruc: '1234567890001',
    });

    pdfService.generarRIDE.mockResolvedValue(
      Buffer.from('PDF DE PRUEBA')
    );
  });

  describe('actualizarFactura', () => {
    it('debe devolver 404 cuando la factura no existe', async () => {
      Facturacion.obtenerFacturaPorId.mockResolvedValue(null);

      const req = {
        params: { id: '99' },
        body: {
          observaciones: 'Actualización de prueba',
        },
        empresaId: 7,
      };
      const res = createResponse();

      await actualizarFactura(req, res);

      expect(
        Facturacion.obtenerFacturaPorId
      ).toHaveBeenCalledWith('99', 7);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Factura no encontrada',
        404
      );

      expect(Facturacion.actualizarFactura).not.toHaveBeenCalled();
    });

    it('debe rechazar la actualización de una factura anulada', async () => {
      Facturacion.obtenerFacturaPorId.mockResolvedValue({
        id: 20,
        numero_factura: '001-001-000000020',
        estado: 'ANULADA',
      });

      const req = {
        params: { id: '20' },
        body: {
          observaciones: 'Intento de actualización',
        },
        empresaId: 7,
      };
      const res = createResponse();

      await actualizarFactura(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'No se puede actualizar una factura anulada',
        400
      );

      expect(Facturacion.actualizarFactura).not.toHaveBeenCalled();
    });

    it('debe actualizar la factura y devolver la versión actualizada', async () => {
      const facturaActualizada = {
        id: 15,
        numero_factura: '001-001-000000015',
        estado: 'EMITIDA',
        total: 250,
        observaciones: 'Nueva observación',
      };

      Facturacion.obtenerFacturaPorId
        .mockResolvedValueOnce({
          id: 15,
          numero_factura: '001-001-000000015',
          estado: 'EMITIDA',
          total: 250,
        })
        .mockResolvedValueOnce(facturaActualizada);

      const body = {
        observaciones: 'Nueva observación',
        cliente_direccion: 'Av. Principal',
      };

      const req = {
        params: { id: '15' },
        body,
        empresaId: 9,
      };
      const res = createResponse();

      await actualizarFactura(req, res);

      expect(Facturacion.obtenerFacturaPorId).toHaveBeenNthCalledWith(
        1,
        '15',
        9
      );

      expect(Facturacion.actualizarFactura).toHaveBeenCalledWith(
        '15',
        body,
        9
      );

      expect(Facturacion.obtenerFacturaPorId).toHaveBeenNthCalledWith(
        2,
        '15',
        9
      );

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        facturaActualizada,
        'Factura actualizada exitosamente'
      );
    });

    it('debe manejar errores durante la actualización', async () => {
      const error = new Error('Error de actualización');

      Facturacion.obtenerFacturaPorId.mockRejectedValue(error);

      const req = {
        params: { id: '15' },
        body: {
          observaciones: 'Prueba',
        },
        empresaId: 9,
      };
      const res = createResponse();

      await actualizarFactura(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al actualizar factura',
        500,
        error
      );
    });

    it('debe manejar errores producidos por actualizarFactura', async () => {
      const error = new Error('Error SQL');

      Facturacion.actualizarFactura.mockRejectedValue(error);

      const req = {
        params: { id: '15' },
        body: {
          observaciones: 'Prueba',
        },
        empresaId: 9,
      };
      const res = createResponse();

      await actualizarFactura(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al actualizar factura',
        500,
        error
      );
    });
  });

  describe('anularFactura', () => {
    it('debe rechazar un motivo inexistente', async () => {
      const req = {
        params: { id: '15' },
        body: {},
        empresaId: 7,
        user: { id: 30 },
      };
      const res = createResponse();

      await anularFactura(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'El motivo debe tener al menos 10 caracteres',
        400
      );

      expect(Facturacion.obtenerFacturaPorId).not.toHaveBeenCalled();
    });

    it('debe rechazar un motivo con menos de 10 caracteres', async () => {
      const req = {
        params: { id: '15' },
        body: {
          motivo: 'Muy corto',
        },
        empresaId: 7,
        user: { id: 30 },
      };
      const res = createResponse();

      await anularFactura(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'El motivo debe tener al menos 10 caracteres',
        400
      );

      expect(Facturacion.obtenerFacturaPorId).not.toHaveBeenCalled();
    });

    it('debe rechazar la operación cuando no existe usuario autenticado', async () => {
      const req = {
        params: { id: '15' },
        body: {
          motivo: 'Factura anulada por solicitud',
        },
        empresaId: 7,
        user: {},
      };
      const res = createResponse();

      await anularFactura(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Usuario no autenticado',
        401
      );

      expect(Facturacion.obtenerFacturaPorId).not.toHaveBeenCalled();
    });

    it('debe rechazar la operación cuando req.user no existe', async () => {
      const req = {
        params: { id: '15' },
        body: {
          motivo: 'Factura anulada por solicitud',
        },
        empresaId: 7,
      };
      const res = createResponse();

      await anularFactura(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Usuario no autenticado',
        401
      );
    });

    it('debe devolver 404 cuando la factura no existe', async () => {
      Facturacion.obtenerFacturaPorId.mockResolvedValue(null);

      const req = {
        params: { id: '99' },
        body: {
          motivo: 'Factura anulada por solicitud',
        },
        empresaId: 7,
        user: { id: 30 },
      };
      const res = createResponse();

      await anularFactura(req, res);

      expect(
        Facturacion.obtenerFacturaPorId
      ).toHaveBeenCalledWith('99', 7);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Factura no encontrada',
        404
      );

      expect(comprobanteService.anularFactura).not.toHaveBeenCalled();
    });

    it('debe anular la factura y registrar la operación', async () => {
      const req = {
        params: { id: '15' },
        body: {
          motivo: '  Solicitud expresa del cliente  ',
        },
        empresaId: 9,
        user: { id: 42 },
      };
      const res = createResponse();

      await anularFactura(req, res);

      expect(
        Facturacion.obtenerFacturaPorId
      ).toHaveBeenCalledWith('15', 9);

      expect(
        comprobanteService.anularFactura
      ).toHaveBeenCalledWith(
        '15',
        42,
        '  Solicitud expresa del cliente  '
      );

      expect(logger.info).toHaveBeenCalledWith(
        'FACTURA_ANULADA',
        {
          event: 'facturacion.anulada',
          facturaId: '15',
          motivo: 'Solicitud expresa del cliente',
          empresaId: 9,
          userId: 42,
        }
      );

      expect(responseUtils.successResponse).toHaveBeenCalledWith(
        res,
        null,
        'Factura anulada exitosamente'
      );
    });

    it('debe manejar errores de comprobanteService al anular', async () => {
      const error = new Error('No se pudo anular');

      comprobanteService.anularFactura.mockRejectedValue(error);

      const req = {
        params: { id: '15' },
        body: {
          motivo: 'Solicitud expresa del cliente',
        },
        empresaId: 9,
        user: { id: 42 },
      };
      const res = createResponse();

      await anularFactura(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'No se pudo anular',
        500,
        error
      );
    });

    it('debe usar el mensaje genérico cuando el error no tiene message', async () => {
      comprobanteService.anularFactura.mockRejectedValue({});

      const req = {
        params: { id: '15' },
        body: {
          motivo: 'Solicitud expresa del cliente',
        },
        empresaId: 9,
        user: { id: 42 },
      };
      const res = createResponse();

      await anularFactura(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al anular factura',
        500,
        {}
      );
    });
  });

  describe('descargarPDF', () => {
    it('debe devolver 404 cuando la factura no existe', async () => {
      comprobanteService.obtenerFacturaPorId.mockResolvedValue(null);

      const req = {
        params: { id: '99' },
        empresaId: 7,
      };
      const res = createResponse();

      await descargarPDF(req, res);

      expect(
        comprobanteService.obtenerFacturaPorId
      ).toHaveBeenCalledWith('99', 7);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Factura no encontrada',
        404
      );

      expect(pdfService.obtenerDatosEmpresa).not.toHaveBeenCalled();
      expect(pdfService.generarRIDE).not.toHaveBeenCalled();
    });

    it('debe generar y enviar el PDF de la factura', async () => {
      const factura = {
        id: 15,
        numero_factura: '001-002-000000123',
        estado: 'EMITIDA',
      };

      const empresa = {
        razonSocial: 'Empresa de Prueba',
        ruc: '1234567890001',
      };

      const pdfBuffer = Buffer.from('CONTENIDO PDF');

      comprobanteService.obtenerFacturaPorId.mockResolvedValue(factura);
      pdfService.obtenerDatosEmpresa.mockReturnValue(empresa);
      pdfService.generarRIDE.mockResolvedValue(pdfBuffer);

      const req = {
        params: { id: '15' },
        empresaId: 9,
      };
      const res = createResponse();

      await descargarPDF(req, res);

      expect(
        comprobanteService.obtenerFacturaPorId
      ).toHaveBeenCalledWith('15', 9);

      expect(pdfService.obtenerDatosEmpresa).toHaveBeenCalledTimes(1);

      expect(pdfService.generarRIDE).toHaveBeenCalledWith(
        factura,
        empresa
      );

      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="RIDE_001_002_000000123.pdf"',
        'Content-Length': pdfBuffer.length,
      });

      expect(res.send).toHaveBeenCalledWith(pdfBuffer);
    });

    it('debe manejar errores al obtener la factura para el PDF', async () => {
      const error = new Error('Error al consultar factura');

      comprobanteService.obtenerFacturaPorId.mockRejectedValue(error);

      const req = {
        params: { id: '15' },
        empresaId: 9,
      };
      const res = createResponse();

      await descargarPDF(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al generar PDF',
        500,
        error
      );
    });

    it('debe manejar errores al generar el PDF', async () => {
      const error = new Error('Error generando RIDE');

      pdfService.generarRIDE.mockRejectedValue(error);

      const req = {
        params: { id: '15' },
        empresaId: 9,
      };
      const res = createResponse();

      await descargarPDF(req, res);

      expect(responseUtils.errorResponse).toHaveBeenCalledWith(
        res,
        'Error al generar PDF',
        500,
        error
      );
    });
  });
});

Module._load = originalLoad;
