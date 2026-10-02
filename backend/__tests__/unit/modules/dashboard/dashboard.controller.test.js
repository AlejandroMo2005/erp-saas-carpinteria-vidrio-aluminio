import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const repository = {
  getResumenGeneral: vi.fn(),
  getIngresosPorPeriodo: vi.fn(),
  getPedidosRecientes: vi.fn(),
  getIngresosPorUsuario: vi.fn(),
  getTopProductos: vi.fn(),
  getMaterialesVariantes: vi.fn(),
  getTrabajoStats: vi.fn(),
  getVentasPorEstado: vi.fn(),
};

const logger = {
  error: vi.fn(),
};

const loggerPath = require.resolve(
  `${process.cwd()}/src/shared/utils/logger.js`
);
require.cache[loggerPath] = {
  id: loggerPath,
  filename: loggerPath,
  loaded: true,
  exports: logger,
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === './dashboard.repository') return repository;
  if (request === '../../../shared/utils/logger') return logger;
  return originalLoad.call(this, request, parent, isMain);
};

const controller = require(
  `${process.cwd()}/src/modules/dashboard/dashboard.controller.js`
);

Module._load = originalLoad;

const makeRes = () => ({
  json: vi.fn(),
  status: vi.fn().mockReturnThis(),
});

const makeReq = (query = {}, empresaId = 7) => ({
  query,
  empresaId,
  user: { id: 99 },
});

describe('dashboard.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getResumen responde con la primera fila', async () => {
    repository.getResumenGeneral.mockResolvedValueOnce([
      [{ total_pedidos: 5 }],
    ]);

    const req = makeReq({
      desde: '2026-01-01',
      hasta: '2026-01-31',
    });
    const res = makeRes();

    await controller.getResumen(req, res);

    expect(repository.getResumenGeneral).toHaveBeenCalledWith(
      '2026-01-01',
      '2026-01-31',
      7
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { total_pedidos: 5 },
    });
  });

  it('getResumen usa fechas null por defecto', async () => {
    repository.getResumenGeneral.mockResolvedValueOnce([
      [{ total_pedidos: 0 }],
    ]);

    const req = makeReq();
    const res = makeRes();

    await controller.getResumen(req, res);

    expect(repository.getResumenGeneral).toHaveBeenCalledWith(
      null,
      null,
      7
    );
  });

  it('getResumen maneja error', async () => {
    repository.getResumenGeneral.mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = makeReq();
    const res = makeRes();

    await controller.getResumen(req, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al obtener resumen',
    });
  });

  it.each(['dia', 'semana', 'mes', 'anio'])(
    'getIngresos acepta periodo %s',
    async periodo => {
      repository.getIngresosPorPeriodo.mockResolvedValueOnce([
        [{ ingresos: 100 }],
      ]);

      const req = makeReq({ periodo });
      const res = makeRes();

      await controller.getIngresos(req, res);

      expect(repository.getIngresosPorPeriodo).toHaveBeenCalledWith(
        periodo,
        7
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        periodo,
        data: [{ ingresos: 100 }],
      });
    }
  );

  it('getIngresos usa mes por defecto', async () => {
    repository.getIngresosPorPeriodo.mockResolvedValueOnce([[]]);

    const req = makeReq();
    const res = makeRes();

    await controller.getIngresos(req, res);

    expect(repository.getIngresosPorPeriodo).toHaveBeenCalledWith(
      'mes',
      7
    );
  });

  it('getIngresos rechaza periodo inválido', async () => {
    const req = makeReq({ periodo: 'hora' });
    const res = makeRes();

    await controller.getIngresos(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(repository.getIngresosPorPeriodo).not.toHaveBeenCalled();
  });

  it('getIngresos maneja error', async () => {
    repository.getIngresosPorPeriodo.mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = makeReq({ periodo: 'mes' });
    const res = makeRes();

    await controller.getIngresos(req, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al obtener ingresos',
    });
  });

  it.each([
    [undefined, 10],
    ['5', 5],
    ['0', 10],
    ['-5', 1],
    ['100', 50],
    ['abc', 10],
  ])(
    'getPedidosRecientes normaliza limite %s a %s',
    async (limite, esperado) => {
      repository.getPedidosRecientes.mockResolvedValueOnce([[]]);

      const req = makeReq(
        limite === undefined ? {} : { limite }
      );
      const res = makeRes();

      await controller.getPedidosRecientes(req, res);

      expect(repository.getPedidosRecientes).toHaveBeenCalledWith(
        esperado,
        7
      );
    }
  );

  it('getPedidosRecientes responde datos', async () => {
    repository.getPedidosRecientes.mockResolvedValueOnce([
      [{ id: 1 }],
    ]);

    const req = makeReq({ limite: '15' });
    const res = makeRes();

    await controller.getPedidosRecientes(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: 1 }],
    });
  });

  it('getPedidosRecientes maneja error', async () => {
    repository.getPedidosRecientes.mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = makeReq();
    const res = makeRes();

    await controller.getPedidosRecientes(req, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getUsuariosIngresos responde datos', async () => {
    repository.getIngresosPorUsuario.mockResolvedValueOnce([
      [{ nombre: 'Admin', ingresos_totales: 500 }],
    ]);

    const req = makeReq();
    const res = makeRes();

    await controller.getUsuariosIngresos(req, res);

    expect(repository.getIngresosPorUsuario).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ nombre: 'Admin', ingresos_totales: 500 }],
    });
  });

  it('getUsuariosIngresos maneja error', async () => {
    repository.getIngresosPorUsuario.mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = makeReq();
    const res = makeRes();

    await controller.getUsuariosIngresos(req, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getTopProductos normaliza límite y usa fechas', async () => {
    repository.getTopProductos.mockResolvedValueOnce([
      [{ producto: 'Vidrio' }],
    ]);

    const req = makeReq({
      limite: '100',
      desde: '2026-01-01',
      hasta: '2026-02-01',
    });
    const res = makeRes();

    await controller.getTopProductos(req, res);

    expect(repository.getTopProductos).toHaveBeenCalledWith(
      50,
      '2026-01-01',
      '2026-02-01',
      7
    );
  });

  it('getTopProductos usa valores por defecto', async () => {
    repository.getTopProductos.mockResolvedValueOnce([[]]);

    const req = makeReq();
    const res = makeRes();

    await controller.getTopProductos(req, res);

    expect(repository.getTopProductos).toHaveBeenCalledWith(
      12,
      null,
      null,
      7
    );
  });

  it('getTopProductos usa 12 cuando límite no es numérico', async () => {
    repository.getTopProductos.mockResolvedValueOnce([[]]);

    const req = makeReq({
      limite: 'abc',
    });
    const res = makeRes();

    await controller.getTopProductos(req, res);

    expect(repository.getTopProductos).toHaveBeenCalledWith(
      12,
      null,
      null,
      7
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
    });
  });

  it('getTopProductos responde datos', async () => {
    repository.getTopProductos.mockResolvedValueOnce([
      [{ producto: 'Aluminio' }],
    ]);

    const req = makeReq({ limite: '5' });
    const res = makeRes();

    await controller.getTopProductos(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ producto: 'Aluminio' }],
    });
  });

  it('getTopProductos maneja error', async () => {
    repository.getTopProductos.mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = makeReq();
    const res = makeRes();

    await controller.getTopProductos(req, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getMaterialesVariantes agrupa materiales y variantes', async () => {
    repository.getMaterialesVariantes.mockResolvedValueOnce([
      [
        {
          material_id: 1,
          material: 'Aluminio',
          precio_base: 10,
          color_id: 2,
          color_nombre: 'Negro',
          color_hex: '#000000',
          color_tipo: 'NORMAL',
          stock: 20,
          precio_variante: 12,
        },
        {
          material_id: 1,
          material: 'Aluminio',
          precio_base: 10,
          color_id: null,
          color_nombre: null,
          color_hex: null,
          color_tipo: null,
          stock: null,
          precio_variante: null,
        },
        {
          material_id: 2,
          material: 'Vidrio',
          precio_base: 25,
          color_id: 3,
          color_nombre: 'Azul',
          color_hex: '#0000FF',
          color_tipo: 'NORMAL',
          stock: 5,
          precio_variante: 27,
        },
      ],
    ]);

    const req = makeReq();
    const res = makeRes();

    await controller.getMaterialesVariantes(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        {
          material_id: 1,
          material: 'Aluminio',
          precio_base: 10,
          variantes: [
            {
              color_id: 2,
              color_nombre: 'Negro',
              color_hex: '#000000',
              color_tipo: 'NORMAL',
              stock: 20,
              precio_variante: 12,
            },
          ],
        },
        {
          material_id: 2,
          material: 'Vidrio',
          precio_base: 25,
          variantes: [
            {
              color_id: 3,
              color_nombre: 'Azul',
              color_hex: '#0000FF',
              color_tipo: 'NORMAL',
              stock: 5,
              precio_variante: 27,
            },
          ],
        },
      ],
    });
  });

  it('getMaterialesVariantes maneja lista vacía', async () => {
    repository.getMaterialesVariantes.mockResolvedValueOnce([[]]);

    const req = makeReq();
    const res = makeRes();

    await controller.getMaterialesVariantes(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
    });
  });

  it('getMaterialesVariantes maneja error', async () => {
    repository.getMaterialesVariantes.mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = makeReq();
    const res = makeRes();

    await controller.getMaterialesVariantes(req, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getTrabajoStats responde datos', async () => {
    repository.getTrabajoStats.mockResolvedValueOnce([
      [{ id: 1, nombre: 'Ventana' }],
    ]);

    const req = makeReq();
    const res = makeRes();

    await controller.getTrabajoStats(req, res);

    expect(repository.getTrabajoStats).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: 1, nombre: 'Ventana' }],
    });
  });

  it('getTrabajoStats maneja error', async () => {
    repository.getTrabajoStats.mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = makeReq();
    const res = makeRes();

    await controller.getTrabajoStats(req, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getEstados responde datos', async () => {
    repository.getVentasPorEstado.mockResolvedValueOnce([
      [{ estado: 'PENDIENTE', cantidad: 3 }],
    ]);

    const req = makeReq();
    const res = makeRes();

    await controller.getEstados(req, res);

    expect(repository.getVentasPorEstado).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ estado: 'PENDIENTE', cantidad: 3 }],
    });
  });

  it('getEstados maneja error', async () => {
    repository.getVentasPorEstado.mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = makeReq();
    const res = makeRes();

    await controller.getEstados(req, res);

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('dashboard.controller - cobertura adicional', () => {
  it('getMaterialesVariantes ignora variante con color_id cero', async () => {
    vi.clearAllMocks();
    repository.getMaterialesVariantes.mockResolvedValueOnce([
      [
        {
          material_id: 10,
          material: 'Perfil',
          precio_base: 8,
          color_id: 0,
          color_nombre: null,
          color_hex: null,
          color_tipo: null,
          stock: 10,
          precio_variante: 8,
        },
      ],
    ]);

    const req = makeReq();
    const res = makeRes();

    await controller.getMaterialesVariantes(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        {
          material_id: 10,
          material: 'Perfil',
          precio_base: 8,
          variantes: [],
        },
      ],
    });
  });
});
