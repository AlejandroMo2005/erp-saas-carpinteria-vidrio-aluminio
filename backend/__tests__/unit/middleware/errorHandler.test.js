import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const logger = require('../../../utils/logger');

vi.spyOn(logger, 'error').mockImplementation(() => {});
vi.spyOn(logger, 'warn').mockImplementation(() => {});
vi.spyOn(logger, 'info').mockImplementation(() => {});

const {
  errorHandler,
  notFoundHandler,
} = require('../../../src/shared/middleware/errorHandler.js');

function createRequest(overrides = {}) {
  return {
    method: 'GET',
    path: '/api/test',
    originalUrl: '/api/test',
    ip: '127.0.0.1',
    user: {
      id: 10,
      rol: 'ADMIN',
    },
    ...overrides,
  };
}

function createResponse() {
  return {
    headersSent: false,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  process.env.NODE_ENV = 'test';
});

describe('errorHandler', () => {
  it('debe usar err.status cuando está disponible', () => {
    const err = Object.assign(new Error('Bad request'), {
      status: 400,
      code: 'BAD_REQUEST',
    });
    const req = createRequest();
    const res = createResponse();

    errorHandler(err, req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bad request',
      error: 'Bad request',
      code: 'BAD_REQUEST',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'Bad request',
      expect.objectContaining({
        status: 400,
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
        userId: 10,
        userRol: 'ADMIN',
      })
    );
  });

  it('debe usar err.statusCode cuando no existe err.status', () => {
    const err = Object.assign(new Error('Forbidden'), {
      statusCode: 403,
      code: 'FORBIDDEN',
    });
    const res = createResponse();

    errorHandler(err, createRequest(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Forbidden',
      error: 'Forbidden',
      code: 'FORBIDDEN',
    });
  });

  it('debe mapear errores MySQL mediante err.code', () => {
    const cases = [
      ['ER_DUP_ENTRY', 409],
      ['ER_NO_REFERENCED_ROW', 400],
      ['ER_ROW_IS_REFERENCED', 409],
      ['ER_DATA_TOO_LONG', 400],
    ];

    for (const [code, status] of cases) {
      const err = Object.assign(new Error(`DB ${code}`), { code });
      const res = createResponse();

      errorHandler(err, createRequest(), res);

      expect(res.status).toHaveBeenCalledWith(status);
    }
  });

  it('debe mapear errores JWT mediante err.name', () => {
    const cases = [
      ['JsonWebTokenError', 401],
      ['TokenExpiredError', 401],
      ['NotBeforeError', 401],
      ['ValidationError', 422],
      ['CastError', 400],
    ];

    for (const [name, status] of cases) {
      const err = Object.assign(new Error(`JWT ${name}`), { name });
      const res = createResponse();

      errorHandler(err, createRequest(), res);

      expect(res.status).toHaveBeenCalledWith(status);
    }
  });

  it('debe usar 500 cuando no existe un estado ni un mapeo', () => {
    const err = new Error('Internal error');
    const res = createResponse();

    errorHandler(err, createRequest(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal error',
      error: 'Internal error',
      code: 'Error',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Internal error',
      expect.objectContaining({
        status: 500,
        errorName: 'Error',
        stack: expect.any(String),
      })
    );
  });

  it('debe registrar warn para errores 4xx', () => {
    const err = Object.assign(new Error('Client error'), {
      status: 404,
    });
    const res = createResponse();

    errorHandler(err, createRequest(), res);

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('debe registrar error para errores 5xx', () => {
    const err = Object.assign(new Error('Server error'), {
      status: 503,
    });
    const res = createResponse();

    errorHandler(err, createRequest(), res);

    expect(logger.error).toHaveBeenCalledWith(
      'Server error',
      expect.objectContaining({
        status: 503,
        stack: expect.any(String),
      })
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('debe usar los valores nulos cuando req no tiene usuario', () => {
    const err = Object.assign(new Error('Unauthorized'), {
      status: 401,
    });
    const res = createResponse();

    errorHandler(
      err,
      createRequest({
        user: undefined,
      }),
      res
    );

    expect(logger.warn).toHaveBeenCalledWith(
      'Unauthorized',
      expect.objectContaining({
        userId: null,
        userRol: null,
      })
    );
  });

  it('debe usar el mensaje público cuando el error no tiene message', () => {
    const err = {
      status: 404,
      code: 'NOT_FOUND',
    };
    const res = createResponse();

    errorHandler(err, createRequest(), res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Recurso no encontrado.',
      error: undefined,
      code: 'NOT_FOUND',
    });
  });

  it('debe construir el error 404 y pasarlo al siguiente middleware', () => {
    const req = createRequest({
      method: 'POST',
      originalUrl: '/api/recurso-inexistente',
    });
    const res = createResponse();
    const next = vi.fn();

    notFoundHandler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(
      'Ruta no encontrada: POST /api/recurso-inexistente'
    );
    expect(error.status).toBe(404);
  });

  it('debe retornar sin responder cuando headersSent ya es true', () => {
    const err = Object.assign(new Error('Already sent'), {
      status: 400,
    });
    const res = createResponse();
    res.headersSent = true;

    const result = errorHandler(err, createRequest(), res);

    expect(result).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('debe conservar el code cuando existe', () => {
    const err = Object.assign(new Error('Conflict'), {
      status: 409,
      code: 'CUSTOM_CONFLICT',
    });
    const res = createResponse();

    errorHandler(err, createRequest(), res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Conflict',
      error: 'Conflict',
      code: 'CUSTOM_CONFLICT',
    });
  });

  it('debe usar err.name como code cuando no existe err.code', () => {
    const err = Object.assign(new Error('Validation failed'), {
      status: 422,
      name: 'ValidationError',
    });
    const res = createResponse();

    errorHandler(err, createRequest(), res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      error: 'Validation failed',
      code: 'ValidationError',
    });
  });

  it('debe construir correctamente el error 404 para una ruta POST inexistente', () => {
    const req = {
      method: 'POST',
      originalUrl: '/api/ruta-inexistente',
    };
    const res = createResponse();
    const next = vi.fn();

    notFoundHandler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = next.mock.calls[0][0];

    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.message).toBe(
      'Ruta no encontrada: POST /api/ruta-inexistente'
    );
  });

  it('debe construir correctamente el error 404 para una ruta DELETE inexistente', () => {
    const req = {
      method: 'DELETE',
      originalUrl: '/api/recurso/999',
    };
    const res = createResponse();
    const next = vi.fn();

    notFoundHandler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = next.mock.calls[0][0];

    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.message).toBe(
      'Ruta no encontrada: DELETE /api/recurso/999'
    );
  });

  it('debe ejecutar next con un error 404 en notFoundHandler', () => {
    const req = {
      method: 'GET',
      originalUrl: '/ruta-inexistente',
    };
    const res = createResponse();
    const next = vi.fn();

    notFoundHandler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = next.mock.calls[0][0];

    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.message).toBe(
      'Ruta no encontrada: GET /ruta-inexistente'
    );
  });

  it('debe generar correctamente el contexto de logging', () => {
    const err = Object.assign(new Error('Unauthorized'), {
      status: 401,
      code: 'AUTH_ERROR',
      name: 'JsonWebTokenError',
    });
    const req = createRequest({
      method: 'POST',
      path: '/api/auth/login',
      ip: '10.0.0.5',
      user: {
        id: 25,
        rol: 'VENDEDOR',
      },
    });
    const res = createResponse();

    errorHandler(err, req, res);

    expect(logger.warn).toHaveBeenCalledWith(
      'Unauthorized',
      {
        status: 401,
        method: 'POST',
        path: '/api/auth/login',
        ip: '10.0.0.5',
        userId: 25,
        userRol: 'VENDEDOR',
        errorCode: 'AUTH_ERROR',
        errorName: 'JsonWebTokenError',
      }
    );
  });

  it('debe usar el mensaje público en producción para 500', () => {
    process.env.NODE_ENV = 'production';

    const productionErrorHandler = errorHandler;

    const err = Object.assign(
      new Error('SQL connection password leaked'),
      {
        status: 500,
        code: 'ER_INTERNAL',
      }
    );
    const req = createRequest();
    const res = createResponse();

    productionErrorHandler(err, req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error interno del servidor. Intenta más tarde.',
    });

    process.env.NODE_ENV = 'test';
  });

  it('debe usar el mensaje público en producción para 401', () => {
    process.env.NODE_ENV = 'production';

    const productionErrorHandler = errorHandler;

    const err = Object.assign(new Error('JWT secreto'), {
      status: 401,
      name: 'JsonWebTokenError',
    });
    const req = createRequest();
    const res = createResponse();

    productionErrorHandler(err, req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No autorizado. Verifica tu sesión.',
    });

    process.env.NODE_ENV = 'test';
  });

  it('debe usar el mensaje público 500 cuando el status no tiene mensaje', () => {
    process.env.NODE_ENV = 'production';

    const productionErrorHandler = errorHandler;

    const err = Object.assign(new Error('Error desconocido'), {
      status: 418,
    });
    const req = createRequest();
    const res = createResponse();

    productionErrorHandler(err, req, res);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error interno del servidor. Intenta más tarde.',
    });

    process.env.NODE_ENV = 'test';
  });
});


describe('notFoundHandler', () => {
  it('crea un error 404 con método y ruta original y lo entrega al siguiente middleware', () => {
    const req = {
      method: 'GET',
      originalUrl: '/api/recurso-inexistente',
    };
    const res = {};
    const next = vi.fn();

    notFoundHandler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const [error] = next.mock.calls[0];

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(404);
    expect(error.message).toBe(
      'Ruta no encontrada: GET /api/recurso-inexistente'
    );
  });
});
