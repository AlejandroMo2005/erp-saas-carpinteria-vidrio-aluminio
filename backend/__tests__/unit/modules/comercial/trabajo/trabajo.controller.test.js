import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
};

const logger = {
  error: vi.fn(),
  warn: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../config/database') return db;
  if (request === '../../../shared/utils/logger') return logger;

  return originalLoad.call(this, request, parent, isMain);
};

const controller = require(
  `${process.cwd()}/src/modules/comercial/trabajo/trabajo.controller.js`
);

Module._load = originalLoad;

function createResponse() {
  return {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };
}

function createRequest(overrides = {}) {
  return {
    query: {},
    params: {},
    empresaId: 7,
    user: {
      id: 25,
    },
    ...overrides,
  };
}

describe('trabajo.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTrabajos', () => {
    it('debe obtener todos los trabajos activos de la empresa', async () => {
      const rows = [
        { id: 1, nombre: 'Ventana', variante: null },
        { id: 2, nombre: 'Puerta', variante: 'Corrediza' },
      ];

      db.query.mockResolvedValueOnce([rows]);

      const req = createRequest({
        query: {},
      });
      const res = createResponse();

      await controller.getTrabajos(req, res);

      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('FROM trabajos');
      expect(sql).toContain('WHERE empresa_id = ? AND activo = 1');
      expect(sql).not.toContain('variante IS NULL OR variante = ""');
      expect(sql).toContain('ORDER BY nombre');
      expect(params).toEqual([7]);

      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('debe filtrar únicamente trabajos base cuando solo_base=1', async () => {
      const rows = [
        { id: 1, nombre: 'Ventana', variante: null },
      ];

      db.query.mockResolvedValueOnce([rows]);

      const req = createRequest({
        query: {
          solo_base: '1',
        },
      });
      const res = createResponse();

      await controller.getTrabajos(req, res);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain(
        'AND (variante IS NULL OR variante = "")'
      );
      expect(params).toEqual([7]);
      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('debe responder 500 cuando falla la consulta', async () => {
      const error = new Error('DB error');

      db.query.mockRejectedValueOnce(error);

      const req = createRequest();
      const res = createResponse();

      await controller.getTrabajos(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'TRABAJO_GET_ALL',
        expect.objectContaining({
          event: 'trabajo.getAll_error',
          message: 'DB error',
          userId: 25,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'DB error',
      });
    });
  });

  describe('getRecetasPorTrabajo', () => {
    it('debe obtener las recetas de un trabajo', async () => {
      const rows = [
        {
          id: 10,
          trabajo_id: 3,
          material_id: 20,
          material: 'Aluminio',
          precio: 12.5,
          unidad_calculo: 'M2',
          factor: 1.2,
        },
      ];

      db.query.mockResolvedValueOnce([rows]);

      const req = createRequest({
        params: {
          id: '3',
        },
      });
      const res = createResponse();

      await controller.getRecetasPorTrabajo(req, res);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('FROM recetas r');
      expect(sql).toContain('INNER JOIN materiales m');
      expect(sql).toContain('r.trabajo_id = ?');
      expect(sql).toContain('m.empresa_id = ?');
      expect(sql).toContain('m.deleted_at IS NULL');
      expect(params).toEqual(['3', 7]);

      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('debe responder 500 cuando falla la consulta de recetas', async () => {
      const error = new Error('Error de recetas');

      db.query.mockRejectedValueOnce(error);

      const req = createRequest({
        params: {
          id: '99',
        },
      });
      const res = createResponse();

      await controller.getRecetasPorTrabajo(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'TRABAJO_GET_RECETAS',
        expect.objectContaining({
          event: 'trabajo.getRecetas_error',
          trabajoId: '99',
          message: 'Error de recetas',
          userId: 25,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener recetas del trabajo',
      });
    });
  });

  describe('getColores', () => {
    it('debe obtener los colores activos de la empresa', async () => {
      const rows = [
        {
          id: 1,
          nombre: 'Natural',
          valor: '#FFFFFF',
          tipo: 'ALUMINIO',
        },
      ];

      db.query.mockResolvedValueOnce([rows]);

      const req = createRequest();
      const res = createResponse();

      await controller.getColores(req, res);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('FROM colores');
      expect(sql).toContain('WHERE empresa_id = ? AND activo = 1');
      expect(sql).toContain('ORDER BY tipo, nombre');
      expect(params).toEqual([7]);

      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('debe responder 500 cuando falla la consulta de colores', async () => {
      const error = new Error('Error de colores');

      db.query.mockRejectedValueOnce(error);

      const req = createRequest();
      const res = createResponse();

      await controller.getColores(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'TRABAJO_GET_COLORES',
        expect.objectContaining({
          event: 'trabajo.getColores_error',
          message: 'Error de colores',
          userId: 25,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener colores',
      });
    });
  });

  describe('agendarPedido', () => {
    it('debe responder 501 y registrar advertencia por endpoint legacy', async () => {
      const req = createRequest();
      const res = createResponse();

      await controller.agendarPedido(req, res);

      expect(logger.warn).toHaveBeenCalledWith(
        'TRABAJO_AGENDAR_LEGACY',
        expect.objectContaining({
          event: 'trabajo.agendarPedido_not_implemented',
          userId: 25,
        })
      );

      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          'Endpoint legacy no implementado. Usar POST /api/proformas/agendar',
      });
    });
  });
});
