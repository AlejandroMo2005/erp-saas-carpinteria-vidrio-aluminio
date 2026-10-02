import { beforeEach, describe, expect, it, vi } from 'vitest';
import Module from 'node:module';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
};

const logger = {
  error: vi.fn(),
  info: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../config/database.js') {
    return db;
  }

  if (request === '../../shared/utils/logger') {
    return logger;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const controller = require(
  `${process.cwd()}/src/modules/cliente/cliente.controller.js`
);

const {
  listar,
  buscarPorTelefono,
  crear,
  getMisDatos,
  updateMisDatos,
} = controller;

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

function createRequest(overrides = {}) {
  return {
    query: {},
    body: {},
    empresaId: 7,
    user: {
      id: 10,
      nombre: 'Juan Pérez',
    },
    ...overrides,
  };
}

describe('cliente.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listar', () => {
    it('retorna lista vacía cuando no se proporciona búsqueda', async () => {
      const req = createRequest({
        query: {},
      });
      const res = createResponse();

      await listar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
      expect(db.query).not.toHaveBeenCalled();
    });

    it('retorna lista vacía cuando la búsqueda tiene un solo carácter', async () => {
      const req = createRequest({
        query: {
          busqueda: 'A',
        },
      });
      const res = createResponse();

      await listar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
      expect(db.query).not.toHaveBeenCalled();
    });

    it('consulta clientes con búsqueda y límite por defecto', async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            nombre: 'Juan Pérez',
            telefono: '0999999999',
          },
        ],
      ]);

      const req = createRequest({
        query: {
          busqueda: ' Juan ',
        },
      });
      const res = createResponse();

      await listar(req, res);

      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('WHERE empresa_id = ?');
      expect(sql).toContain('AND activo = 1');
      expect(sql).toContain('(nombre LIKE ? OR telefono LIKE ?)');
      expect(sql).toContain('ORDER BY nombre ASC LIMIT ?');

      expect(params).toEqual([
        7,
        '%Juan%',
        '%Juan%',
        8,
      ]);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            id: 1,
            nombre: 'Juan Pérez',
            telefono: '0999999999',
          },
        ],
      });
    });

    it('limita el máximo a 50 resultados', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const req = createRequest({
        query: {
          busqueda: 'Juan',
          limite: '100',
        },
      });
      const res = createResponse();

      await listar(req, res);

      const [, params] = db.query.mock.calls[0];

      expect(params).toEqual([
        7,
        '%Juan%',
        '%Juan%',
        50,
      ]);
    });

    it('usa 8 cuando el límite no es válido', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const req = createRequest({
        query: {
          busqueda: 'Juan',
          limite: 'abc',
        },
      });
      const res = createResponse();

      await listar(req, res);

      const [, params] = db.query.mock.calls[0];

      expect(params).toEqual([
        7,
        '%Juan%',
        '%Juan%',
        8,
      ]);
    });

    it('maneja valores vacíos al sanitizar nombre y teléfono', async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            id: 3,
            nombre: null,
            telefono: null,
          },
        ],
      ]);

      const req = createRequest({
        query: {
          busqueda: 'Juan',
        },
      });
      const res = createResponse();

      await listar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            id: 3,
            nombre: '',
            telefono: '',
          },
        ],
      });
    });

    it('sanitiza HTML en nombre y teléfono', async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            id: 2,
            nombre: '<script>alert("x")</script>',
            telefono: `0999<script>'/"`,
          },
        ],
      ]);

      const req = createRequest({
        query: {
          busqueda: 'Juan',
        },
      });
      const res = createResponse();

      await listar(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            id: 2,
            nombre:
              '&lt;script&gt;alert(&quot;x&quot;)&lt;&#x2F;script&gt;',
            telefono:
              '0999&lt;script&gt;&#x27;&#x2F;&quot;',
          },
        ],
      });
    });

    it('maneja errores de base de datos', async () => {
      db.query.mockRejectedValueOnce(
        new Error('DB error')
      );

      const req = createRequest({
        query: {
          busqueda: 'Juan',
        },
      });
      const res = createResponse();

      await listar(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'CLIENTE_LISTAR_ERROR',
        expect.objectContaining({
          event: 'clientes.listar_error',
          message: 'DB error',
          userId: 10,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al buscar clientes',
      });
    });
  });

  describe('buscarPorTelefono', () => {
    it('retorna 400 cuando no se proporciona teléfono', async () => {
      const req = createRequest({
        query: {},
      });
      const res = createResponse();

      await buscarPorTelefono(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Teléfono es requerido',
      });

      expect(db.query).not.toHaveBeenCalled();
    });

    it('retorna 400 cuando el teléfono está vacío', async () => {
      const req = createRequest({
        query: {
          telefono: '   ',
        },
      });
      const res = createResponse();

      await buscarPorTelefono(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(db.query).not.toHaveBeenCalled();
    });

    it('busca clientes por teléfono', async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            nombre: 'Juan Pérez',
            telefono: '0999999999',
            activo: 1,
          },
        ],
      ]);

      const req = createRequest({
        query: {
          telefono: ' 0999 ',
        },
      });
      const res = createResponse();

      await buscarPorTelefono(req, res);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('WHERE empresa_id = ?');
      expect(sql).toContain('telefono LIKE ?');
      expect(sql).toContain('activo = 1');
      expect(sql).toContain('LIMIT 20');

      expect(params).toEqual([
        7,
        '%0999%',
      ]);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            id: 1,
            nombre: 'Juan Pérez',
            telefono: '0999999999',
            activo: 1,
          },
        ],
      });
    });

    it('sanitiza los datos encontrados', async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            id: 2,
            nombre: '<b>Juan</b>',
            telefono: `<script>'/"`,
          },
        ],
      ]);

      const req = createRequest({
        query: {
          telefono: '0999',
        },
      });
      const res = createResponse();

      await buscarPorTelefono(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            id: 2,
            nombre: '&lt;b&gt;Juan&lt;&#x2F;b&gt;',
            telefono:
              '&lt;script&gt;&#x27;&#x2F;&quot;',
          },
        ],
      });
    });

    it('maneja errores de base de datos', async () => {
      db.query.mockRejectedValueOnce(
        new Error('DB error')
      );

      const req = createRequest({
        query: {
          telefono: '0999',
        },
      });
      const res = createResponse();

      await buscarPorTelefono(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'CLIENTE_BUSCAR_TELEFONO_ERROR',
        expect.objectContaining({
          event: 'clientes.buscarTelefono_error',
          message: 'DB error',
          userId: 10,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al buscar cliente',
      });
    });
  });

  describe('crear', () => {
    it('retorna 400 cuando falta el nombre', async () => {
      const req = createRequest({
        body: {
          telefono: '0999999999',
        },
      });
      const res = createResponse();

      await crear(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Nombre es requerido',
      });

      expect(db.query).not.toHaveBeenCalled();
    });

    it('retorna 400 cuando falta el teléfono', async () => {
      const req = createRequest({
        body: {
          nombre: 'Juan Pérez',
        },
      });
      const res = createResponse();

      await crear(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Teléfono es requerido',
      });

      expect(db.query).not.toHaveBeenCalled();
    });

    it('retorna 400 cuando el nombre está vacío', async () => {
      const req = createRequest({
        body: {
          nombre: '   ',
          telefono: '0999999999',
        },
      });
      const res = createResponse();

      await crear(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(db.query).not.toHaveBeenCalled();
    });

    it('retorna 400 cuando el teléfono está vacío', async () => {
      const req = createRequest({
        body: {
          nombre: 'Juan Pérez',
          telefono: '   ',
        },
      });
      const res = createResponse();

      await crear(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(db.query).not.toHaveBeenCalled();
    });

    it('retorna 409 cuando el teléfono ya existe', async () => {
      db.query.mockResolvedValueOnce([
        [{ id: 20 }],
      ]);

      const req = createRequest({
        body: {
          nombre: 'Juan Pérez',
          telefono: ' 0999999999 ',
        },
      });
      const res = createResponse();

      await crear(req, res);

      expect(db.query).toHaveBeenCalledTimes(1);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Ya existe un cliente con ese teléfono',
      });
    });

    it('crea correctamente un cliente', async () => {
      db.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([
          {
            insertId: 25,
          },
        ]);

      const req = createRequest({
        body: {
          nombre: '  Juan Pérez  ',
          telefono: ' 0999999999 ',
        },
      });
      const res = createResponse();

      await crear(req, res);

      expect(db.query).toHaveBeenCalledTimes(2);

      const [insertSql, insertParams] =
        db.query.mock.calls[1];

      expect(insertSql).toContain(
        'INSERT INTO clientes'
      );

      expect(insertParams).toEqual([
        7,
        'Juan Pérez',
        '0999999999',
      ]);

      expect(logger.info).toHaveBeenCalledWith(
        'CLIENTE_CREADO',
        expect.objectContaining({
          event: 'clientes.creado',
          clienteId: 25,
          nombre: 'Juan Pérez',
          userId: 10,
          empresaId: 7,
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cliente creado correctamente',
        data: {
          id: 25,
          nombre: 'Juan Pérez',
          telefono: '0999999999',
        },
      });
    });

    it('sanitiza nombre y teléfono antes de insertar', async () => {
      db.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([
          {
            insertId: 26,
          },
        ]);

      const req = createRequest({
        body: {
          nombre: `<b>Juan</b>`,
          telefono: `0999<script>'/"`,
        },
      });
      const res = createResponse();

      await crear(req, res);

      const [, params] = db.query.mock.calls[1];

      expect(params).toEqual([
        7,
        '&lt;b&gt;Juan&lt;&#x2F;b&gt;',
        '0999&lt;script&gt;&#x27;&#x2F;&quot;',
      ]);
    });

    it('maneja ER_DUP_ENTRY durante la inserción', async () => {
      db.query
        .mockResolvedValueOnce([[]])
        .mockRejectedValueOnce(
          Object.assign(
            new Error('Duplicate entry'),
            { code: 'ER_DUP_ENTRY' }
          )
        );

      const req = createRequest({
        body: {
          nombre: 'Juan Pérez',
          telefono: '0999999999',
        },
      });
      const res = createResponse();

      await crear(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Ya existe un cliente con ese teléfono',
      });
    });

    it('maneja errores genéricos durante la creación', async () => {
      db.query.mockRejectedValueOnce(
        new Error('DB error')
      );

      const req = createRequest({
        body: {
          nombre: 'Juan Pérez',
          telefono: '0999999999',
        },
      });
      const res = createResponse();

      await crear(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'CLIENTE_CREAR_ERROR',
        expect.objectContaining({
          event: 'clientes.crear_error',
          message: 'DB error',
          userId: 10,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al crear cliente',
      });
    });
  });

  describe('getMisDatos', () => {
    it('retorna datos no vinculados cuando no existe cliente', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const req = createRequest();
      const res = createResponse();

      await getMisDatos(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'FROM clientes c'
        ),
        [7, 10]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          nombre: 'Juan Pérez',
          telefono: null,
          vinculado: false,
        },
      });
    });

    it('retorna los datos del cliente cuando está vinculado', async () => {
      const cliente = {
        id: 15,
        nombre: 'Juan Pérez',
        telefono: '0999999999',
        activo: 1,
        created_at: '2026-09-23',
      };

      db.query.mockResolvedValueOnce([
        [cliente],
      ]);

      const req = createRequest();
      const res = createResponse();

      await getMisDatos(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          ...cliente,
          vinculado: true,
        },
      });
    });

    it('maneja errores de base de datos', async () => {
      db.query.mockRejectedValueOnce(
        new Error('DB error')
      );

      const req = createRequest();
      const res = createResponse();

      await getMisDatos(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'CLIENTE_MIS_DATOS_ERROR',
        expect.objectContaining({
          event: 'clientes.getMisDatos_error',
          message: 'DB error',
          userId: 10,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al obtener tus datos',
      });
    });
  });

  describe('updateMisDatos', () => {
    it('retorna 400 cuando no se envía ningún campo', async () => {
      const req = createRequest({
        body: {},
      });
      const res = createResponse();

      await updateMisDatos(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          'Debes enviar al menos nombre o teléfono para actualizar',
      });

      expect(db.query).not.toHaveBeenCalled();
    });

    it('actualiza solamente el nombre', async () => {
      db.query.mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
      ]);

      const req = createRequest({
        body: {
          nombre: '  Pedro Gómez  ',
        },
      });
      const res = createResponse();

      await updateMisDatos(req, res);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('nombre = ?');
      expect(sql).toContain('updated_at = NOW()');
      expect(params).toEqual([
        'Pedro Gómez',
        7,
        10,
      ]);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message:
          'Tus datos han sido actualizados correctamente',
      });
    });

    it('actualiza solamente el teléfono', async () => {
      db.query.mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
      ]);

      const req = createRequest({
        body: {
          telefono: ' 0988888888 ',
        },
      });
      const res = createResponse();

      await updateMisDatos(req, res);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('telefono = ?');
      expect(params).toEqual([
        '0988888888',
        7,
        10,
      ]);
    });

    it('actualiza nombre y teléfono simultáneamente', async () => {
      db.query.mockResolvedValueOnce([
        {
          affectedRows: 1,
        },
      ]);

      const req = createRequest({
        body: {
          nombre: 'Pedro Gómez',
          telefono: '0988888888',
        },
      });
      const res = createResponse();

      await updateMisDatos(req, res);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('nombre = ?');
      expect(sql).toContain('telefono = ?');
      expect(sql).toContain('updated_at = NOW()');

      expect(params).toEqual([
        'Pedro Gómez',
        '0988888888',
        7,
        10,
      ]);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message:
          'Tus datos han sido actualizados correctamente',
      });
    });

    it('retorna 404 cuando no encuentra el cliente', async () => {
      db.query.mockResolvedValueOnce([
        {
          affectedRows: 0,
        },
      ]);

      const req = createRequest({
        body: {
          nombre: 'Pedro Gómez',
        },
      });
      const res = createResponse();

      await updateMisDatos(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          'No se encontró tu registro de cliente para actualizar',
      });
    });

    it('maneja ER_DUP_ENTRY', async () => {
      db.query.mockRejectedValueOnce(
        Object.assign(
          new Error('Duplicate entry'),
          { code: 'ER_DUP_ENTRY' }
        )
      );

      const req = createRequest({
        body: {
          telefono: '0988888888',
        },
      });
      const res = createResponse();

      await updateMisDatos(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          'Ese teléfono ya está registrado por otro cliente',
      });
    });

    it('maneja errores genéricos', async () => {
      db.query.mockRejectedValueOnce(
        new Error('DB error')
      );

      const req = createRequest({
        body: {
          nombre: 'Pedro Gómez',
        },
      });
      const res = createResponse();

      await updateMisDatos(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'CLIENTE_UPDATE_ERROR',
        expect.objectContaining({
          event: 'clientes.updateMisDatos_error',
          message: 'DB error',
          userId: 10,
        })
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al actualizar tus datos',
      });
    });
  });
});