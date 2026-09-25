import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const dbPath = require.resolve(process.cwd() + '/config/database.js');
const fsPath = require.resolve('fs');
const httpsPath = require.resolve('https');
const controllerPath = require.resolve(process.cwd() + '/src/modules/ia/referencia/referencia.controller.js');

const dbMock = {
  query: vi.fn(),
};

const fsMock = {
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
};

const httpsMock = {
  request: vi.fn(),
};

function inject(path, value) {
  require.cache[path] = {
    id: path,
    filename: path,
    loaded: true,
    exports: value,
  };
}

function clear(path) {
  delete require.cache[path];
}

function loadController() {
  inject(dbPath, dbMock);
  inject(fsPath, fsMock);
  inject(httpsPath, httpsMock);
  clear(controllerPath);
  return require(controllerPath);
}

function makeRes() {
  return {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };
}

describe('referencia.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    dbMock.query.mockReset();

    fsMock.existsSync.mockReset();
    fsMock.mkdirSync.mockReset();
    fsMock.writeFileSync.mockReset();
    fsMock.unlinkSync.mockReset();

    httpsMock.request.mockReset();

    delete process.env.ANTHROPIC_API_KEY;
  });

  it('rechaza trabajo_id inválido al subir', async () => {
    const controller = loadController();
    const res = makeRes();

    await controller.subirReferencia(
      { params: { trabajo_id: 'abc' } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'trabajo_id inválido',
    });
  });

  it('rechaza la subida sin archivo', async () => {
    const controller = loadController();
    const res = makeRes();

    await controller.subirReferencia(
      { params: { trabajo_id: '5' } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Se requiere el archivo imagen',
    });
  });

  it('rechaza listar referencias con trabajo_id inválido', async () => {
    const controller = loadController();
    const res = makeRes();

    await controller.listarReferencias(
      { params: { trabajo_id: '0' } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'trabajo_id inválido',
    });
  });

  it('lista referencias y construye sus URLs públicas', async () => {
    const controller = loadController();
    const res = makeRes();

    const refs = [
      {
        id: 10,
        filename: 'ref_10.jpg',
        descriptores: 'black aluminum, glass',
        peso: 0.8,
        activo: 1,
        created_at: '2026-01-01',
      },
    ];

    dbMock.query.mockResolvedValueOnce([refs]);

    await controller.listarReferencias(
      { params: { trabajo_id: '5' } },
      res,
    );

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM trabajo_referencias'),
      [5],
    );

    expect(res.json).toHaveBeenCalledWith({
      trabajo_id: 5,
      referencias: [
        {
          ...refs[0],
          url: '/referencias/5/ref_10.jpg',
        },
      ],
    });
  });

  it('devuelve 500 cuando falla listarReferencias', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query.mockRejectedValueOnce(new Error('DB error'));

    await controller.listarReferencias(
      { params: { trabajo_id: '5' } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al obtener referencias',
    });
  });

  it('rechaza actualizarReferencia con id inválido', async () => {
    const controller = loadController();
    const res = makeRes();

    await controller.actualizarReferencia(
      { params: { id: 'abc' }, body: {} },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'id inválido',
    });
  });

  it('rechaza actualización sin campos', async () => {
    const controller = loadController();
    const res = makeRes();

    await controller.actualizarReferencia(
      { params: { id: '10' }, body: {} },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Nada que actualizar',
    });
  });

  it('actualiza descriptores, peso y estado', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query.mockResolvedValueOnce([{}]);

    await controller.actualizarReferencia(
      {
        params: { id: '10' },
        body: {
          descriptores: 'black aluminum',
          peso: '0.9',
          activo: false,
        },
      },
      res,
    );

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'UPDATE trabajo_referencias SET descriptores = ?, peso = ?, activo = ? WHERE id = ?',
      ),
      ['black aluminum', 0.9, 0, 10],
    );

    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('devuelve 500 cuando falla actualizarReferencia', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query.mockRejectedValueOnce(new Error('DB error'));

    await controller.actualizarReferencia(
      {
        params: { id: '10' },
        body: { peso: 0.9 },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al actualizar',
    });
  });

  it('rechaza eliminarReferencia con id inválido', async () => {
    const controller = loadController();
    const res = makeRes();

    await controller.eliminarReferencia(
      { params: { id: 'abc' } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'id inválido',
    });
  });

  it('devuelve 404 cuando la referencia no existe', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query.mockResolvedValueOnce([[]]);

    await controller.eliminarReferencia(
      { params: { id: '10' } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Referencia no encontrada',
    });
  });

  it('elimina referencia y archivo físico existente', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[{
        trabajo_id: 5,
        filename: 'ref_10.jpg',
      }]])
      .mockResolvedValueOnce([{}]);

    fsMock.existsSync.mockReturnValue(true);

    await controller.eliminarReferencia(
      { params: { id: '10' } },
      res,
    );

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM trabajo_referencias WHERE id = ?',
      [10],
    );

    expect(fsMock.unlinkSync).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('elimina referencia aunque el archivo físico no exista', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[{
        trabajo_id: 5,
        filename: 'ref_10.jpg',
      }]])
      .mockResolvedValueOnce([{}]);

    fsMock.existsSync.mockReturnValue(false);

    await controller.eliminarReferencia(
      { params: { id: '10' } },
      res,
    );

    expect(fsMock.unlinkSync).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('devuelve 500 cuando falla eliminarReferencia', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query.mockRejectedValueOnce(new Error('DB error'));

    await controller.eliminarReferencia(
      { params: { id: '10' } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al eliminar',
    });
  });

  it('sube una referencia usando descriptores proporcionados', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[{ id: 5, nombre: 'Ventana' }]])
      .mockResolvedValueOnce([{ insertId: 99 }]);

    fsMock.existsSync.mockReturnValue(false);

    const archivo = {
      originalname: 'modelo.PNG',
      mimetype: 'image/png',
      buffer: Buffer.from('imagen'),
    };

    await controller.subirReferencia(
      {
        params: { trabajo_id: '5' },
        file: archivo,
        body: {
          descriptores: 'black aluminum, tempered glass',
          peso: '0.95',
        },
      },
      res,
    );

    expect(fsMock.mkdirSync).toHaveBeenCalledWith(
      expect.any(String),
      { recursive: true },
    );

    expect(fsMock.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.png'),
      archivo.buffer,
    );

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO trabajo_referencias'),
      [
        5,
        expect.stringMatching(/^ref_\d+\.png$/),
        'black aluminum, tempered glass',
        0.95,
      ],
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        id: 99,
        trabajo_id: 5,
        descriptores: 'black aluminum, tempered glass',
        peso: 0.95,
      }),
    );
  });


  it('usa .jpg cuando el archivo no tiene extensión', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[{ id: 5, nombre: 'Ventana' }]])
      .mockResolvedValueOnce([{ insertId: 106 }]);

    fsMock.existsSync.mockReturnValue(true);

    await controller.subirReferencia(
      {
        params: { trabajo_id: '5' },
        file: {
          originalname: 'modelo',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('imagen'),
        },
        body: {
          descriptores: 'black aluminum, glass',
        },
      },
      res,
    );

    expect(fsMock.writeFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/ref_\d+\.jpg$/),
      expect.any(Buffer),
    );

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO trabajo_referencias'),
      [
        5,
        expect.stringMatching(/^ref_\d+\.jpg$/),
        'black aluminum, glass',
        0.8,
      ],
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });


  it('usa descriptores de fallback cuando Claude no está configurado', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[{ id: 5, nombre: 'Ventana' }]])
      .mockResolvedValueOnce([{ insertId: 100 }]);

    fsMock.existsSync.mockReturnValue(true);

    await controller.subirReferencia(
      {
        params: { trabajo_id: '5' },
        file: {
          originalname: 'modelo.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('imagen'),
        },
        body: {},
      },
      res,
    );

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO trabajo_referencias'),
      [
        5,
        expect.stringMatching(/^ref_\d+\.jpg$/),
        'ventana, aluminum, glass, architectural quality, professional installation, photorealistic',
        0.8,
      ],
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('devuelve 404 cuando el trabajo no existe al subir', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query.mockResolvedValueOnce([[]]);

    await controller.subirReferencia(
      {
        params: { trabajo_id: '5' },
        file: {
          originalname: 'modelo.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('imagen'),
        },
        body: {},
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Trabajo no encontrado',
    });
  });

  it('devuelve 500 cuando falla subirReferencia', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query.mockRejectedValueOnce(new Error('DB error'));

    await controller.subirReferencia(
      {
        params: { trabajo_id: '5' },
        file: {
          originalname: 'modelo.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('imagen'),
        },
        body: {},
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al guardar la referencia',
    });
  });

  it('elimina referencia y continúa aunque falle eliminar el archivo físico', async () => {
    const controller = loadController();

    dbMock.query
      .mockResolvedValueOnce([[
        { id: 8, trabajo_id: 5, filename: 'ref.png' }
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    fsMock.existsSync.mockReturnValue(true);
    fsMock.unlinkSync.mockImplementation(() => {
      throw new Error('filesystem error');
    });

    const req = { params: { id: '8' } };
    const res = makeRes();

    await controller.eliminarReferencia(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
    });
    expect(fsMock.unlinkSync).toHaveBeenCalled();
  });

  it('actualiza solo el estado activo', async () => {
    const controller = loadController();

    dbMock.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const req = {
      params: { id: '8' },
      body: { activo: true },
    };
    const res = makeRes();

    await controller.actualizarReferencia(req, res);

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE trabajo_referencias'),
      [1, 8]
    );

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
    });
  });


  it('usa descriptores generados por Claude Vision cuando responde correctamente', async () => {
    const controller = loadController();
    const res = makeRes();

    process.env.ANTHROPIC_API_KEY = 'test-api-key';

    const response = {
      on: vi.fn((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({
            content: [
              {
                text: 'matte black aluminum frame, clear tempered glass, modern architectural finish',
              },
            ],
          })),
          );
        }

        if (event === 'end') callback();
        return response;
      }),
    };

    const request = {
      setTimeout: vi.fn(),
      on: vi.fn(() => request),
      write: vi.fn(),
      end: vi.fn(),
      destroy: vi.fn(),
    };

    httpsMock.request.mockImplementation((options, callback) => {
      callback(response);
      return request;
    });

    dbMock.query
      .mockResolvedValueOnce([[{ id: 5, nombre: 'Ventana' }]])
      .mockResolvedValueOnce([{ insertId: 101 }]);

    fsMock.existsSync.mockReturnValue(true);

    await controller.subirReferencia(
      {
        params: { trabajo_id: '5' },
        file: {
          originalname: 'modelo.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('imagen'),
        },
        body: {},
      },
      res,
    );

    expect(httpsMock.request).toHaveBeenCalledTimes(1);
    expect(request.setTimeout).toHaveBeenCalledWith(20_000, expect.any(Function));
    expect(request.write).toHaveBeenCalledWith(expect.any(String));
    expect(request.end).toHaveBeenCalledTimes(1);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO trabajo_referencias'),
      [
        5,
        expect.stringMatching(/^ref_\d+\.jpg$/),
        'matte black aluminum frame, clear tempered glass, modern architectural finish',
        0.8,
      ],
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('usa fallback cuando Claude Vision devuelve descriptores vacíos', async () => {
    const controller = loadController();
    const res = makeRes();

    process.env.ANTHROPIC_API_KEY = 'test-api-key';

    const response = {
      on: vi.fn((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from(JSON.stringify({
            content: [{ text: 'short' }],
          })));
        }

        if (event === 'end') callback();
        return response;
      }),
    };

    const request = {
      setTimeout: vi.fn(),
      on: vi.fn(() => request),
      write: vi.fn(),
      end: vi.fn(),
      destroy: vi.fn(),
    };

    httpsMock.request.mockImplementation((options, callback) => {
      callback(response);
      return request;
    });

    dbMock.query
      .mockResolvedValueOnce([[{ id: 5, nombre: 'Ventana' }]])
      .mockResolvedValueOnce([{ insertId: 102 }]);

    fsMock.existsSync.mockReturnValue(true);

    await controller.subirReferencia(
      {
        params: { trabajo_id: '5' },
        file: {
          originalname: 'modelo.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('imagen'),
        },
        body: {},
      },
      res,
    );

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO trabajo_referencias'),
      [
        5,
        expect.stringMatching(/^ref_\d+\.jpg$/),
        'ventana, aluminum, glass, architectural quality, professional installation, photorealistic',
        0.8,
      ],
    );
  });

  it('usa fallback cuando Claude Vision devuelve JSON inválido', async () => {
    const controller = loadController();
    const res = makeRes();

    process.env.ANTHROPIC_API_KEY = 'test-api-key';

    const response = {
      on: vi.fn((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from('{invalid-json'));
        }

        if (event === 'end') callback();
        return response;
      }),
    };

    const request = {
      setTimeout: vi.fn(),
      on: vi.fn(() => request),
      write: vi.fn(),
      end: vi.fn(),
      destroy: vi.fn(),
    };

    httpsMock.request.mockImplementation((options, callback) => {
      callback(response);
      return request;
    });

    dbMock.query
      .mockResolvedValueOnce([[{ id: 5, nombre: 'Ventana' }]])
      .mockResolvedValueOnce([{ insertId: 103 }]);

    fsMock.existsSync.mockReturnValue(true);

    await controller.subirReferencia(
      {
        params: { trabajo_id: '5' },
        file: {
          originalname: 'modelo.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('imagen'),
        },
        body: {},
      },
      res,
    );

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO trabajo_referencias'),
      [
        5,
        expect.stringMatching(/^ref_\d+\.jpg$/),
        'ventana, aluminum, glass, architectural quality, professional installation, photorealistic',
        0.8,
      ],
    );
  });

  it('usa fallback cuando Claude Vision genera error de red', async () => {
    const controller = loadController();
    const res = makeRes();

    process.env.ANTHROPIC_API_KEY = 'test-api-key';

    const request = {
      setTimeout: vi.fn(),
      on: vi.fn((event, callback) => {
        if (event === 'error') callback(new Error('network error'));
        return request;
      }),
      write: vi.fn(),
      end: vi.fn(),
      destroy: vi.fn(),
    };

    httpsMock.request.mockImplementation(() => request);

    dbMock.query
      .mockResolvedValueOnce([[{ id: 5, nombre: 'Ventana' }]])
      .mockResolvedValueOnce([{ insertId: 104 }]);

    fsMock.existsSync.mockReturnValue(true);

    await controller.subirReferencia(
      {
        params: { trabajo_id: '5' },
        file: {
          originalname: 'modelo.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('imagen'),
        },
        body: {},
      },
      res,
    );

    expect(request.write).toHaveBeenCalledWith(expect.any(String));
    expect(request.end).toHaveBeenCalledTimes(1);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO trabajo_referencias'),
      [
        5,
        expect.stringMatching(/^ref_\d+\.jpg$/),
        'ventana, aluminum, glass, architectural quality, professional installation, photorealistic',
        0.8,
      ],
    );
  });

  it('usa fallback cuando Claude Vision agota el timeout', async () => {
    const controller = loadController();
    const res = makeRes();

    process.env.ANTHROPIC_API_KEY = 'test-api-key';

    const request = {
      setTimeout: vi.fn(),
      on: vi.fn(() => request),
      write: vi.fn(),
      end: vi.fn(),
      destroy: vi.fn(),
    };

    httpsMock.request.mockImplementation((options, callback) => {
      request.setTimeout.mockImplementation((ms, callbackTimeout) => {
        callbackTimeout();
      });

      return request;
    });

    dbMock.query
      .mockResolvedValueOnce([[{ id: 5, nombre: 'Ventana' }]])
      .mockResolvedValueOnce([{ insertId: 105 }]);

    fsMock.existsSync.mockReturnValue(true);

    await controller.subirReferencia(
      {
        params: { trabajo_id: '5' },
        file: {
          originalname: 'modelo.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('imagen'),
        },
        body: {},
      },
      res,
    );

    expect(request.setTimeout).toHaveBeenCalledWith(20_000, expect.any(Function));
    expect(request.destroy).toHaveBeenCalledTimes(1);

    expect(dbMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO trabajo_referencias'),
      [
        5,
        expect.stringMatching(/^ref_\d+\.jpg$/),
        'ventana, aluminum, glass, architectural quality, professional installation, photorealistic',
        0.8,
      ],
    );
  });

});
