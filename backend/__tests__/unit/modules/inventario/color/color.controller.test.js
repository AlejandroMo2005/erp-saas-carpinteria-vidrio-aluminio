import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const dbPath = require.resolve(process.cwd() + '/src/config/database.js');
const loggerPath = require.resolve(process.cwd() + '/src/shared/utils/logger.js');
const controllerPath = require.resolve(process.cwd() + '/src/modules/inventario/color/color.controller.js');

const dbMock = {
  query: vi.fn(),
};

const loggerMock = {
  info: vi.fn(),
  error: vi.fn(),
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
  inject(loggerPath, loggerMock);
  clear(controllerPath);
  return require(controllerPath);
}

function makeRes() {
  return {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };
}

describe('color.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.query.mockReset();
    loggerMock.info.mockReset();
    loggerMock.error.mockReset();
  });

  it('obtiene los colores activos de la empresa y registra auditoría informativa', async () => {
    const controller = loadController();
    const res = makeRes();
    const rows = [
      { id: 1, nombre: 'Negro', valor: '#000000', tipo: 'ALUMINIO' },
      { id: 2, nombre: 'Blanco', valor: '#FFFFFF', tipo: 'ALUMINIO' },
    ];

    dbMock.query.mockResolvedValueOnce([rows]);

    await controller.getColores(
      { empresaId: 7, user: { id: 15 } },
      res,
    );

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE empresa_id = ? AND activo = 1'),
      [7],
    );

    expect(res.json).toHaveBeenCalledWith(rows);
    expect(loggerMock.info).toHaveBeenCalledWith(
      'COLOR_GET_ALL',
      {
        event: 'color.getAll',
        cantidad: 2,
        empresaId: 7,
      },
    );
  });

  it('devuelve 500 cuando falla la consulta', async () => {
    const controller = loadController();
    const res = makeRes();

    dbMock.query.mockRejectedValueOnce(new Error('DB unavailable'));

    await controller.getColores(
      { empresaId: 7, user: { id: 15 } },
      res,
    );

    expect(loggerMock.error).toHaveBeenCalledWith(
      'COLOR_GET_ALL_ERROR',
      {
        event: 'color.getAll_error',
        message: 'DB unavailable',
        userId: 15,
      },
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al obtener colores',
    });
  });
});
