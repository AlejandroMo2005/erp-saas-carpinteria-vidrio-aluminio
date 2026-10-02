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
  isLegacyItems: vi.fn(),
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
    service.isLegacyItems.mockReturnValue(false);
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
        req.body
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

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Modo recetas no disponible: falta services/proformaCalculator.js',
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

  describe('modo legacy', () => {
    it('debe calcular correctamente usando precios enviados en los items', async () => {
      const req = {
        empresaId: 7,
        body: {
          cliente: 'Juan Pérez',
          fecha: '2026-09-23',
          items: [
            {
              material_id: 1,
              cantidad: 2,
              precio_unitario: 10,
            },
            {
              material_id: 2,
              cantidad: 3,
              precio_unitario: 5,
            },
          ],
        },
      };
      const res = createResponse();

      service.isLegacyItems.mockReturnValue(true);

      connection.query.mockResolvedValueOnce([[{ valor: 0.15 }]]);

      await handler.calcularProforma(req, res);

      expect(connection.query).toHaveBeenCalledWith(
        "SELECT valor FROM configuracion WHERE empresa_id = ? AND clave = 'IVA' LIMIT 1",
        [7]
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          cliente: 'Juan Pérez',
          fecha: '2026-09-23',
          subtotal: 35,
          iva: 5.25,
          total: 40.25,
          iva_valor: 0.15,
          items: req.body.items,
          whatsapp_text: expect.stringContaining('$40.25'),
        }),
      });

      expect(connection.release).toHaveBeenCalled();
    });

    it('debe usar SIN NOMBRE cuando el cliente está vacío', async () => {
      const req = {
        empresaId: 7,
        body: {
          cliente: '   ',
          fecha: '2026-09-23',
          items: [
            {
              material_id: 1,
              cantidad: 1,
              precio_unitario: 20,
            },
          ],
        },
      };
      const res = createResponse();

      service.isLegacyItems.mockReturnValue(true);
      connection.query.mockResolvedValueOnce([[{ valor: 0.15 }]]);

      await handler.calcularProforma(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          cliente: 'SIN NOMBRE',
        }),
      });
    });

    it('debe usar IVA 0.15 cuando no existe configuración', async () => {
      const req = {
        empresaId: 7,
        body: {
          items: [
            {
              material_id: 1,
              cantidad: 2,
              precio_unitario: 10,
            },
          ],
        },
      };
      const res = createResponse();

      service.isLegacyItems.mockReturnValue(true);
      connection.query.mockResolvedValueOnce([[]]);

      await handler.calcularProforma(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          subtotal: 20,
          iva: 3,
          total: 23,
          iva_valor: 0.15,
        }),
      });
    });

    it('debe buscar el precio del material cuando no se envía precio_unitario', async () => {
      const req = {
        empresaId: 7,
        body: {
          items: [
            {
              material_id: 10,
              cantidad: 2,
            },
          ],
        },
      };
      const res = createResponse();

      service.isLegacyItems.mockReturnValue(true);

      connection.query
        .mockResolvedValueOnce([[{ valor: 0.15 }]])
        .mockResolvedValueOnce([[{ precio: 12 }]]);

      await handler.calcularProforma(req, res);

      expect(connection.query).toHaveBeenNthCalledWith(
        2,
        'SELECT precio FROM materiales WHERE id = ? AND empresa_id = ? LIMIT 1',
        [10, 7]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          subtotal: 24,
          iva: 3.6,
          total: 27.6,
        }),
      });
    });

    it('debe responder 400 cuando falta material_id', async () => {
      const req = {
        empresaId: 7,
        body: {
          items: [
            {
              cantidad: 2,
              precio_unitario: 10,
            },
          ],
        },
      };
      const res = createResponse();

      service.isLegacyItems.mockReturnValue(true);
      connection.query.mockResolvedValueOnce([[{ valor: 0.15 }]]);

      await handler.calcularProforma(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Falta material_id en item #1',
      });
    });

    it('debe responder 400 cuando la cantidad es inválida', async () => {
      const req = {
        empresaId: 7,
        body: {
          items: [
            {
              material_id: 1,
              cantidad: 0,
              precio_unitario: 10,
            },
          ],
        },
      };
      const res = createResponse();

      service.isLegacyItems.mockReturnValue(true);
      connection.query.mockResolvedValueOnce([[{ valor: 0.15 }]]);

      await handler.calcularProforma(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cantidad invalida en item #1',
      });
    });

    it('debe responder 400 cuando el material no existe', async () => {
      const req = {
        empresaId: 7,
        body: {
          items: [
            {
              material_id: 99,
              cantidad: 1,
            },
          ],
        },
      };
      const res = createResponse();

      service.isLegacyItems.mockReturnValue(true);

      connection.query
        .mockResolvedValueOnce([[{ valor: 0.15 }]])
        .mockResolvedValueOnce([[]]);

      await handler.calcularProforma(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Material no existe: material_id=99',
      });
    });

    it('debe responder 400 cuando el precio es inválido', async () => {
      const req = {
        empresaId: 7,
        body: {
          items: [
            {
              material_id: 1,
              cantidad: 1,
              precio_unitario: -5,
            },
          ],
        },
      };
      const res = createResponse();

      service.isLegacyItems.mockReturnValue(true);
      connection.query.mockResolvedValueOnce([[{ valor: 0.15 }]]);

      await handler.calcularProforma(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Precio invalido en item #1',
      });
    });

    it('debe responder 400 cuando ningún modo de items es válido', async () => {
      const req = {
        empresaId: 7,
        body: {
          items: [{ descripcion: 'item inválido' }],
        },
      };
      const res = createResponse();

      service.isRecipeItems.mockReturnValue(false);
      service.isLegacyItems.mockReturnValue(false);

      await handler.calcularProforma(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          'Payload invalido. Envie items con trabajo_id (recetas) o material_id (legacy).',
      });
    });
  });

  describe('manejo de errores', () => {
    it('debe responder 500 cuando falla una consulta y liberar la conexión', async () => {
      const req = {
        empresaId: 7,
        user: { id: 25 },
        body: {
          items: [
            {
              material_id: 1,
              cantidad: 1,
              precio_unitario: 10,
            },
          ],
        },
      };
      const res = createResponse();
      const error = new Error('Database failure');

      service.isLegacyItems.mockReturnValue(true);

      connection.query.mockRejectedValueOnce(error);

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
