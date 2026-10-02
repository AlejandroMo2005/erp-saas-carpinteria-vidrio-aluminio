import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const logger = {
  error: vi.fn(),
};

const originalLoad = Module._load;

const utilsPath = require.resolve(
  `${process.cwd()}/src/modules/comercial/facturacion/handlers/utils.js`
);

delete require.cache[utilsPath];

Module._load = function (request, parent, isMain) {
  if (request === '../../../../shared/utils/logger') {
    return logger;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const { successResponse, errorResponse } = require(utilsPath);

Module._load = originalLoad;

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

describe('facturacion handlers/utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successResponse', () => {
    it('debe responder con 200 y mensaje por defecto', () => {
      const res = createResponse();
      const data = { id: 10 };

      const result = successResponse(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operación exitosa',
        data,
      });
      expect(result).toBe(res);
    });

    it('debe usar mensaje y código de estado personalizados', () => {
      const res = createResponse();
      const data = { id: 20 };

      successResponse(res, data, 'Factura creada', 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Factura creada',
        data,
      });
    });
  });

  describe('errorResponse', () => {
    it('debe responder 500 por defecto y registrar el error', () => {
      const res = createResponse();

      errorResponse(res, 'Error interno');

      expect(logger.error).toHaveBeenCalledWith(
        'FACTURACION_ERROR',
        {
          event: 'facturacion.error',
          message: 'Error interno',
          statusCode: 500,
          httpMessage: 'Error interno',
        }
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno',
        error: undefined,
      });
    });

    it('debe usar el mensaje de la excepción para el log cuando existe error', () => {
      const res = createResponse();
      const error = new Error('Fallo de base de datos');

      errorResponse(res, 'No se pudo procesar', 400, error);

      expect(logger.error).toHaveBeenCalledWith(
        'FACTURACION_ERROR',
        {
          event: 'facturacion.error',
          message: 'Fallo de base de datos',
          statusCode: 400,
          httpMessage: 'No se pudo procesar',
        }
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No se pudo procesar',
        error: undefined,
      });
    });

    it('debe incluir el mensaje técnico en desarrollo cuando existe error', () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        const res = createResponse();
        const error = new Error('Detalle técnico');

        errorResponse(res, 'No se pudo procesar', 500, error);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'No se pudo procesar',
          error: 'Detalle técnico',
        });
      } finally {
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it('no debe incluir el mensaje técnico fuera de desarrollo', () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      try {
        const res = createResponse();
        const error = new Error('Detalle sensible');

        errorResponse(res, 'No se pudo procesar', 500, error);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'No se pudo procesar',
          error: undefined,
        });
      } finally {
        process.env.NODE_ENV = previousNodeEnv;
      }
    });
  });
});
