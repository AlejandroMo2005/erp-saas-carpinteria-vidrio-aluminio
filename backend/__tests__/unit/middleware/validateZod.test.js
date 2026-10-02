import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const logger = {
  warn: vi.fn(),
};

const loggerPath = require.resolve(
  `${process.cwd()}/src/shared/utils/logger.js`
);

const modulePath = require.resolve(
  `${process.cwd()}/src/shared/middleware/validateZod.js`
);

require.cache[loggerPath] = {
  id: loggerPath,
  filename: loggerPath,
  loaded: true,
  exports: logger,
};

delete require.cache[modulePath];

const { validateBody } = require(modulePath);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateBody', () => {
  it('debe continuar y reemplazar req.body cuando la validación es exitosa', () => {
    const parsedData = {
      nombre: 'Juan',
      edad: 30,
    };

    const schema = {
      safeParse: vi.fn().mockReturnValue({
        success: true,
        data: parsedData,
      }),
    };

    const req = {
      body: {
        nombre: 'Juan',
        edad: '30',
      },
      path: '/api/clientes',
      method: 'POST',
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    const next = vi.fn();

    const middleware = validateBody(schema);

    middleware(req, res, next);

    expect(schema.safeParse).toHaveBeenCalledWith({
      nombre: 'Juan',
      edad: '30',
    });

    expect(req.body).toBe(parsedData);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('debe responder 400 cuando la validación falla', () => {
    const schema = {
      safeParse: vi.fn().mockReturnValue({
        success: false,
        error: {
          errors: [
            {
              path: ['nombre'],
              message: 'El nombre es obligatorio',
            },
          ],
        },
      }),
    };

    const req = {
      body: {},
      path: '/api/clientes',
      method: 'POST',
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    const next = vi.fn();

    const middleware = validateBody(schema);

    const result = middleware(req, res, next);

    expect(result).toBe(res);

    expect(schema.safeParse).toHaveBeenCalledWith({});

    expect(logger.warn).toHaveBeenCalledWith(
      'ZOD_VALIDATION_FAIL',
      {
        event: 'validation.body_fail',
        path: '/api/clientes',
        method: 'POST',
        errors: [
          {
            campo: 'nombre',
            mensaje: 'El nombre es obligatorio',
          },
        ],
      }
    );

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'El nombre es obligatorio',
      errors: [
        {
          campo: 'nombre',
          mensaje: 'El nombre es obligatorio',
        },
      ],
    });

    expect(next).not.toHaveBeenCalled();
  });

  it('debe convertir correctamente una ruta anidada del error Zod', () => {
    const schema = {
      safeParse: vi.fn().mockReturnValue({
        success: false,
        error: {
          errors: [
            {
              path: ['cliente', 'direccion', 'ciudad'],
              message: 'La ciudad es obligatoria',
            },
          ],
        },
      }),
    };

    const req = {
      body: {},
      path: '/api/proformas',
      method: 'POST',
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'La ciudad es obligatoria',
      errors: [
        {
          campo: 'cliente.direccion.ciudad',
          mensaje: 'La ciudad es obligatoria',
        },
      ],
    });

    expect(logger.warn).toHaveBeenCalledWith(
      'ZOD_VALIDATION_FAIL',
      expect.objectContaining({
        errors: [
          {
            campo: 'cliente.direccion.ciudad',
            mensaje: 'La ciudad es obligatoria',
          },
        ],
      })
    );
  });

  it('debe usar body cuando el error no tiene una ruta', () => {
    const schema = {
      safeParse: vi.fn().mockReturnValue({
        success: false,
        error: {
          errors: [
            {
              path: [],
              message: 'El cuerpo de la solicitud no es válido',
            },
          ],
        },
      }),
    };

    const req = {
      body: null,
      path: '/api/clientes',
      method: 'PUT',
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'El cuerpo de la solicitud no es válido',
      errors: [
        {
          campo: 'body',
          mensaje: 'El cuerpo de la solicitud no es válido',
        },
      ],
    });

    expect(logger.warn).toHaveBeenCalledWith(
      'ZOD_VALIDATION_FAIL',
      expect.objectContaining({
        event: 'validation.body_fail',
        path: '/api/clientes',
        method: 'PUT',
        errors: [
          {
            campo: 'body',
            mensaje: 'El cuerpo de la solicitud no es válido',
          },
        ],
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it('debe procesar múltiples errores de validación', () => {
    const schema = {
      safeParse: vi.fn().mockReturnValue({
        success: false,
        error: {
          errors: [
            {
              path: ['nombre'],
              message: 'El nombre es obligatorio',
            },
            {
              path: ['precio'],
              message: 'El precio debe ser positivo',
            },
            {
              path: [],
              message: 'Datos incompletos',
            },
          ],
        },
      }),
    };

    const req = {
      body: {},
      path: '/api/materiales',
      method: 'POST',
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'El nombre es obligatorio',
      errors: [
        {
          campo: 'nombre',
          mensaje: 'El nombre es obligatorio',
        },
        {
          campo: 'precio',
          mensaje: 'El precio debe ser positivo',
        },
        {
          campo: 'body',
          mensaje: 'Datos incompletos',
        },
      ],
    });

    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
