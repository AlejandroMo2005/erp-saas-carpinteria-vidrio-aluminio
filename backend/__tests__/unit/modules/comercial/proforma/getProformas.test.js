import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const database = {
  query: vi.fn(),
};

const logger = {
  error: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../../../config/database') {
    return database;
  }

  if (request === '../../../../../utils/logger') {
    return logger;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const handlers = require(
  `${process.cwd()}/src/modules/comercial/proforma/handlers/getProformas.js`
);

Module._load = originalLoad;

function createResponse() {
  return {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };
}

describe('proforma handlers - getProformas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllProformas', () => {
    it('debe obtener todas las proformas de la empresa cuando no se filtra por usuario', async () => {
      const req = {
        empresaId: 7,
        filtroUsuario: {
          soloPropio: false,
          usuarioId: 15,
        },
      };
      const res = createResponse();
      const rows = [
        { id: 1, empresa_id: 7, cliente: 'Cliente 1' },
        { id: 2, empresa_id: 7, cliente: 'Cliente 2' },
      ];

      database.query.mockResolvedValueOnce([rows]);

      await handlers.getAllProformas(req, res);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'WHERE empresa_id = ? AND deleted_at IS NULL'
        ),
        [7]
      );
      expect(database.query.mock.calls[0][0]).toContain(
        'ORDER BY created_at DESC'
      );
      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('debe filtrar por usuario cuando soloPropio está activo', async () => {
      const req = {
        empresaId: 7,
        filtroUsuario: {
          soloPropio: true,
          usuarioId: 15,
        },
      };
      const res = createResponse();
      const rows = [{ id: 3, empresa_id: 7, usuario_id: 15 }];

      database.query.mockResolvedValueOnce([rows]);

      await handlers.getAllProformas(req, res);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'WHERE empresa_id = ? AND usuario_id = ? AND deleted_at IS NULL'
        ),
        [7, 15]
      );
      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('debe usar el filtro vacío cuando filtroUsuario no existe', async () => {
      const req = {
        empresaId: 7,
      };
      const res = createResponse();

      database.query.mockResolvedValueOnce([[]]);

      await handlers.getAllProformas(req, res);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'WHERE empresa_id = ? AND deleted_at IS NULL'
        ),
        [7]
      );
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('debe responder 500 cuando falla la consulta', async () => {
      const req = {
        empresaId: 7,
        user: { id: 20 },
      };
      const res = createResponse();
      const error = new Error('DB error');

      database.query.mockRejectedValueOnce(error);

      await handlers.getAllProformas(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROFORMA_GET_ALL',
        expect.objectContaining({
          event: 'proforma.getAll_error',
          message: 'DB error',
          userId: 20,
        })
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'DB error',
      });
    });
  });

  describe('searchByCliente', () => {
    it('debe buscar proformas por nombre de cliente', async () => {
      const req = {
        empresaId: 7,
        query: {
          cliente: 'Juan',
        },
      };
      const res = createResponse();
      const rows = [{ id: 1, cliente: 'Juan Pérez' }];

      database.query.mockResolvedValueOnce([rows]);

      await handlers.searchByCliente(req, res);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'WHERE empresa_id = ? AND cliente LIKE ? AND deleted_at IS NULL'
        ),
        [7, '%Juan%']
      );
      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('debe usar una búsqueda vacía cuando cliente no está definido', async () => {
      const req = {
        empresaId: 7,
        query: {},
      };
      const res = createResponse();

      database.query.mockResolvedValueOnce([[]]);

      await handlers.searchByCliente(req, res);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'WHERE empresa_id = ? AND cliente LIKE ? AND deleted_at IS NULL'
        ),
        [7, '%%']
      );
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('debe responder 500 cuando falla la búsqueda', async () => {
      const req = {
        empresaId: 7,
        user: { id: 21 },
        query: { cliente: 'Ana' },
      };
      const res = createResponse();
      const error = new Error('Search error');

      database.query.mockRejectedValueOnce(error);

      await handlers.searchByCliente(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROFORMA_SEARCH',
        expect.objectContaining({
          event: 'proforma.search_error',
          message: 'Search error',
          userId: 21,
        })
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Search error',
      });
    });
  });

  describe('getProformaById', () => {
    it('debe obtener una proforma por ID cuando no se filtra por usuario', async () => {
      const req = {
        params: { id: '25' },
        empresaId: 7,
        filtroUsuario: {
          soloPropio: false,
          usuarioId: 15,
        },
      };
      const res = createResponse();
      const proforma = {
        id: 25,
        empresa_id: 7,
        cliente: 'Carlos',
      };

      database.query.mockResolvedValueOnce([[proforma]]);

      await handlers.getProformaById(req, res);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL'
        ),
        ['25', 7]
      );
      expect(res.json).toHaveBeenCalledWith(proforma);
    });

    it('debe filtrar la proforma por usuario cuando soloPropio está activo', async () => {
      const req = {
        params: { id: '25' },
        empresaId: 7,
        filtroUsuario: {
          soloPropio: true,
          usuarioId: 15,
        },
      };
      const res = createResponse();
      const proforma = {
        id: 25,
        empresa_id: 7,
        usuario_id: 15,
      };

      database.query.mockResolvedValueOnce([[proforma]]);

      await handlers.getProformaById(req, res);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'WHERE id = ? AND empresa_id = ? AND usuario_id = ? AND deleted_at IS NULL'
        ),
        ['25', 7, 15]
      );
      expect(res.json).toHaveBeenCalledWith(proforma);
    });

    it('debe responder 404 cuando la proforma no existe', async () => {
      const req = {
        params: { id: '999' },
        empresaId: 7,
      };
      const res = createResponse();

      database.query.mockResolvedValueOnce([[]]);

      await handlers.getProformaById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Proforma no encontrada',
      });
    });

    it('debe responder 500 cuando falla la consulta por ID', async () => {
      const req = {
        params: { id: '25' },
        empresaId: 7,
        user: { id: 30 },
      };
      const res = createResponse();
      const error = new Error('Get by ID error');

      database.query.mockRejectedValueOnce(error);

      await handlers.getProformaById(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'PROFORMA_GET_BY_ID',
        expect.objectContaining({
          event: 'proforma.getById_error',
          proformaId: '25',
          message: 'Get by ID error',
          userId: 30,
        })
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Get by ID error',
      });
    });
  });
});
