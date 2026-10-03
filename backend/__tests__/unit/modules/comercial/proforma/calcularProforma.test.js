import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const database = {
  getConnection: vi.fn(),
};

const logger = {
  error: vi.fn(),
};

const service = {
  round2: vi.fn((n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100),
  isRecipeItems: vi.fn(),
  safeDate: vi.fn(),
  calcularPorRecetas: vi.fn(),
  buildWhatsAppText: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../../config/database.js') {
    return database;
  }

  if (request === '../../../../shared/utils/logger') {
    return logger;
  }

  if (request === '../proforma.service') {
    return service;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const handler = require(
  `${process.cwd()}/src/modules/comercial/proforma/handlers/calcularProforma.js`
);

Module._load = originalLoad;

function createConnection() {
  return {
    query: vi.fn(),
    release: vi.fn(),
  };
}

function createResponse() {
  return {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };
}

describe('proforma handlers - calcularProforma', () => {
  let connection;

  beforeEach(() => {
    vi.clearAllMocks();

    connection = createConnection();

    database.getConnection.mockResolvedValue(connection);

    service.isRecipeItems.mockReturnValue(false);
    service.calcularPorRecetas.mockResolvedValue({
      subtotal: 100,
      iva: 15,
      total: 115,
    });
    service.buildWhatsAppText.mockReturnValue('Texto WhatsApp');
    service.safeDate.mockImplementation(
      (d) => d || '2026-09-23'
    );
  });

  describe('validación inicial', () => {
    it('debe responder 400 cuando items no es un arreglo', async () => {
      const req = {
        body: {},
      };
      const res = createResponse();

      await handler.calcularProforma(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Debe enviar al menos 1 item para calcular',
      });
      expect(connection.release).toHaveBeenCalled();
    });

    it('debe responder 400 cuando items está vacío', async () => {
      const req = {
        body: {
          items: [],
        },
      };
      const res = createResponse();

      await handler.calcularProforma(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Debe enviar al menos 1 item para calcular',
      });
      expect(connection.release).toHaveBeenCalled();
    });
  });

  describe('modo recetas', () => {
    it('debe calcular una proforma en modo recetas', async () => {
      const req = {
        empresaId: 7,
        body: {
          cliente: 'Juan',
          items: [{ trabajo_id: 10 }],
        },
      };
      const res = createResponse();

      const calc = {
        subtotal: 100,
        iva: 15,
        total: 115,
      };

      service.isRecipeItems.mockReturnValue(true);
      service.calcularPorRecetas.mockResolvedValue(calc);
      service.buildWhatsAppText.mockReturnValue('Texto WhatsApp');

      await handler.calcularProforma(req, res);

      expect(service.calcularPorRecetas).toHaveBeenCalledWith(
        connection,
        req.body,
        7
      );

      expect(service.buildWhatsAppText).toHaveBeenCalledWith(calc);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          ...calc,
          whatsapp_text: 'Texto WhatsApp',
        },
      });

      expect(connection.release).toHaveBeenCalled();
    });
  });

  it('debe responder 400 cuando falta el servicio de cálculo de recetas', async () => {
    const handlerPath = require.resolve(
      `${process.cwd()}/src/modules/comercial/proforma/handlers/calcularProforma.js`
    );

    const originalModule = require.cache[handlerPath];
    const originalLoad = Module._load;
    const originalCalcularPorRecetas = service.calcularPorRecetas;

    try {
      service.isRecipeItems.mockReturnValue(true);
      service.calcularPorRecetas = null;

      delete require.cache[handlerPath];

      Module._load = function (request, parent, isMain) {
        if (request === '../../../../config/database.js') {
          return database;
        }

        if (request === '../../../../shared/utils/logger') {
          return logger;
        }

        if (request === '../proforma.service') {
          return service;
        }

        return originalLoad.call(this, request, parent, isMain);
      };

      const isolatedHandler = require(handlerPath);

      const req = {
        body: {
          items: [{ trabajo_id: 10 }],
        },
      };
      const res = createResponse();

      await isolatedHandler.calcularProforma(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Calculador de proformas no disponible',
      });

      expect(connection.release).toHaveBeenCalled();
    } finally {
      Module._load = originalLoad;
      service.calcularPorRecetas = originalCalcularPorRecetas;

      delete require.cache[handlerPath];

      if (originalModule) {
        require.cache[handlerPath] = originalModule;
      }
    }
  });

  describe('manejo de errores', () => {
    it('debe responder 500 cuando falla una consulta y liberar la conexión', async () => {
      const req = {
        empresaId: 7,
        user: { id: 25 },
        body: {
          items: [
            {
              trabajo_id: 1,
              cantidad: 1,
            },
          ],
        },
      };
      const res = createResponse();
      const error = new Error('Database failure');

      service.isRecipeItems.mockReturnValue(true);
      service.calcularPorRecetas.mockRejectedValueOnce(error);

      await handler.calcularProforma(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROFORMA_CALCULAR',
        {
          event: 'proforma.calcular_error',
          message: 'Database failure',
          userId: 25,
        }
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database failure',
      });

      expect(connection.release).toHaveBeenCalled();
    });
  });
});
