import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const Configuracion = {
  obtenerTodos: vi.fn(),
  obtenerValor: vi.fn(),
  guardarValor: vi.fn(),
  obtenerTasaIva: vi.fn(),
};

const logger = {
  error: vi.fn(),
  info: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === './configuracion.repository') return Configuracion;
  if (request === '../../shared/utils/logger') return logger;

  return originalLoad.call(this, request, parent, isMain);
};

const controller = require(
  `${process.cwd()}/src/modules/configuracion/configuracion.controller.js`
);

Module._load = originalLoad;

const createRes = () => ({
  json: vi.fn(),
  status: vi.fn().mockReturnThis(),
});

describe('configuracion.controller', () => {
  it('obtenerTodos debe retornar la configuración de la empresa', async () => {
    const req = {
      empresaId: 7,
    };
    const res = createRes();
    const datos = [
      { clave: 'IVA', valor: '0.15' },
      { clave: 'MONEDA', valor: 'USD' },
    ];

    Configuracion.obtenerTodos.mockResolvedValueOnce(datos);

    await controller.obtenerTodos(req, res);

    expect(Configuracion.obtenerTodos).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: datos,
    });
  });

  it('obtenerTodos debe retornar 500 cuando falla el repository', async () => {
    const req = {
      empresaId: 7,
    };
    const res = createRes();
    const error = new Error('DB error');

    Configuracion.obtenerTodos.mockRejectedValueOnce(error);

    await controller.obtenerTodos(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'CONFIG_OBTENER_TODOS',
      expect.objectContaining({
        event: 'configuracion.obtenerTodos_error',
        message: 'DB error',
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al obtener configuración',
    });
  });

  it('obtenerPorClave debe rechazar una clave ausente', async () => {
    const req = {
      params: {},
      empresaId: 7,
    };
    const res = createRes();

    await controller.obtenerPorClave(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Clave inválida',
    });

    expect(Configuracion.obtenerValor).not.toHaveBeenCalled();
  });

  it('obtenerPorClave debe rechazar una clave que no sea string', async () => {
    const req = {
      params: {
        clave: 123,
      },
      empresaId: 7,
    };
    const res = createRes();

    await controller.obtenerPorClave(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Clave inválida',
    });
  });

  it('obtenerPorClave debe retornar el valor usando la clave en mayúsculas', async () => {
    const req = {
      params: {
        clave: 'iva',
      },
      empresaId: 7,
    };
    const res = createRes();

    Configuracion.obtenerValor.mockResolvedValueOnce('0.15');

    await controller.obtenerPorClave(req, res);

    expect(Configuracion.obtenerValor).toHaveBeenCalledWith('IVA', 7);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        clave: 'IVA',
        valor: '0.15',
      },
    });
  });

  it('obtenerPorClave debe retornar 404 cuando la clave no existe', async () => {
    const req = {
      params: {
        clave: 'moneda',
      },
      empresaId: 7,
    };
    const res = createRes();

    Configuracion.obtenerValor.mockResolvedValueOnce(null);

    await controller.obtenerPorClave(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Clave 'moneda' no encontrada",
    });
  });

  it('obtenerPorClave debe retornar 500 cuando falla el repository', async () => {
    const req = {
      params: {
        clave: 'IVA',
      },
      empresaId: 7,
    };
    const res = createRes();

    Configuracion.obtenerValor.mockRejectedValueOnce(
      new Error('DB error')
    );

    await controller.obtenerPorClave(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'CONFIG_OBTENER_CLAVE',
      expect.objectContaining({
        event: 'configuracion.obtenerPorClave_error',
        clave: 'IVA',
        message: 'DB error',
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('actualizarValor debe rechazar clave ausente', async () => {
    const req = {
      params: {},
      body: {
        valor: '0.15',
      },
      empresaId: 7,
    };
    const res = createRes();

    await controller.actualizarValor(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Clave y valor son requeridos',
    });
  });

  it('actualizarValor debe rechazar valor undefined', async () => {
    const req = {
      params: {
        clave: 'MONEDA',
      },
      body: {},
      empresaId: 7,
    };
    const res = createRes();

    await controller.actualizarValor(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('actualizarValor debe rechazar valor null', async () => {
    const req = {
      params: {
        clave: 'MONEDA',
      },
      body: {
        valor: null,
      },
      empresaId: 7,
    };
    const res = createRes();

    await controller.actualizarValor(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('actualizarValor debe rechazar IVA no numérico', async () => {
    const req = {
      params: {
        clave: 'iva',
      },
      body: {
        valor: 'abc',
      },
      empresaId: 7,
    };
    const res = createRes();

    await controller.actualizarValor(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'El IVA debe ser un número entre 0 y 1 (ej: 0.15 para 15%)',
    });
  });

  it('actualizarValor debe rechazar IVA menor que 0', async () => {
    const req = {
      params: {
        clave: 'IVA',
      },
      body: {
        valor: -0.01,
      },
      empresaId: 7,
    };
    const res = createRes();

    await controller.actualizarValor(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('actualizarValor debe rechazar IVA mayor que 1', async () => {
    const req = {
      params: {
        clave: 'IVA',
      },
      body: {
        valor: 1.01,
      },
      empresaId: 7,
    };
    const res = createRes();

    await controller.actualizarValor(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('actualizarValor debe aceptar IVA igual a 0', async () => {
    const req = {
      params: {
        clave: 'IVA',
      },
      body: {
        valor: 0,
      },
      empresaId: 7,
      user: {
        id: 15,
      },
    };
    const res = createRes();

    Configuracion.guardarValor.mockResolvedValueOnce();

    await controller.actualizarValor(req, res);

    expect(Configuracion.guardarValor).toHaveBeenCalledWith(
      'IVA',
      0,
      7
    );

    expect(logger.info).toHaveBeenCalledWith(
      'CONFIG_ACTUALIZADO',
      expect.objectContaining({
        event: 'configuracion.actualizado',
        clave: 'IVA',
        userId: 15,
      })
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Configuración actualizada',
      data: {
        clave: 'IVA',
        valor: '0',
      },
    });
  });

  it('actualizarValor debe aceptar IVA igual a 1', async () => {
    const req = {
      params: {
        clave: 'iva',
      },
      body: {
        valor: 1,
      },
      empresaId: 7,
    };
    const res = createRes();

    Configuracion.guardarValor.mockResolvedValueOnce();

    await controller.actualizarValor(req, res);

    expect(Configuracion.guardarValor).toHaveBeenCalledWith(
      'IVA',
      1,
      7
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Configuración actualizada',
      data: {
        clave: 'IVA',
        valor: '1',
      },
    });
  });

  it('actualizarValor debe actualizar una configuración que no sea IVA', async () => {
    const req = {
      params: {
        clave: 'moneda',
      },
      body: {
        valor: 'USD',
      },
      empresaId: 7,
    };
    const res = createRes();

    Configuracion.guardarValor.mockResolvedValueOnce();

    await controller.actualizarValor(req, res);

    expect(Configuracion.guardarValor).toHaveBeenCalledWith(
      'MONEDA',
      'USD',
      7
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Configuración actualizada',
      data: {
        clave: 'MONEDA',
        valor: 'USD',
      },
    });
  });

  it('actualizarValor debe retornar 500 cuando falla guardarValor', async () => {
    const req = {
      params: {
        clave: 'MONEDA',
      },
      body: {
        valor: 'USD',
      },
      empresaId: 7,
    };
    const res = createRes();

    Configuracion.guardarValor.mockRejectedValueOnce(
      new Error('DB error')
    );

    await controller.actualizarValor(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'CONFIG_ACTUALIZAR',
      expect.objectContaining({
        event: 'configuracion.actualizarValor_error',
        clave: 'MONEDA',
        message: 'DB error',
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al actualizar configuración',
    });
  });

  it('obtenerTasaIva debe retornar tasa y porcentaje formateado', async () => {
    const req = {
      empresaId: 7,
    };
    const res = createRes();

    Configuracion.obtenerTasaIva.mockResolvedValueOnce(0.15);

    await controller.obtenerTasaIva(req, res);

    expect(Configuracion.obtenerTasaIva).toHaveBeenCalledWith(7);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        clave: 'IVA',
        valor: '0.15',
        porcentaje: '15%',
      },
    });
  });

  it('obtenerTasaIva debe retornar 500 cuando falla el repository', async () => {
    const req = {
      empresaId: 7,
    };
    const res = createRes();

    Configuracion.obtenerTasaIva.mockRejectedValueOnce(
      new Error('DB error')
    );

    await controller.obtenerTasaIva(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'CONFIG_TASA_IVA',
      expect.objectContaining({
        event: 'configuracion.obtenerTasaIva_error',
        message: 'DB error',
      })
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al obtener tasa de IVA',
    });
  });
});
