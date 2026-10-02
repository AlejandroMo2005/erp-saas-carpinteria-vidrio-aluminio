import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const logger = {
  warn: vi.fn(),
  error: vi.fn(),
};

const originalLoad = Module._load;

const loggerPath = require.resolve(
  `${process.cwd()}/src/shared/utils/logger.js`
);

const csrfPath = require.resolve(
  `${process.cwd()}/src/shared/middleware/csrf.js`
);

delete require.cache[csrfPath];
delete require.cache[loggerPath];

Module._load = function (request, parent, isMain) {
  if (
    request === '../utils/logger' ||
    request === loggerPath
  ) {
    return logger;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const {
  emitirCsrfCookie,
  verificarCsrf,
} = require(csrfPath);

Module._load = originalLoad;

beforeEach(() => {
  vi.clearAllMocks();
});

function createResponse() {
  return {
    cookie: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

function createRequest(overrides = {}) {
  return {
    method: 'GET',
    path: '/test',
    cookies: {},
    headers: {},
    ip: '127.0.0.1',
    user: {
      id: 10,
    },
    ...overrides,
  };
}

describe('emitirCsrfCookie', () => {
  it('debe generar y emitir una cookie CSRF cuando no existe', () => {
    const req = createRequest({
      cookies: {},
    });
    const res = createResponse();
    const next = vi.fn();

    emitirCsrfCookie(req, res, next);

    expect(res.cookie).toHaveBeenCalledTimes(1);

    const [nombre, token, opciones] = res.cookie.mock.calls[0];

    expect(nombre).toBe('csrf-token');
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(req._csrfToken).toBe(token);

    expect(opciones).toEqual({
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      maxAge: 4 * 60 * 60 * 1000,
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe reutilizar la cookie CSRF existente', () => {
    const req = createRequest({
      cookies: {
        'csrf-token': 'token-existente',
      },
    });
    const res = createResponse();
    const next = vi.fn();

    emitirCsrfCookie(req, res, next);

    expect(res.cookie).not.toHaveBeenCalled();
    expect(req._csrfToken).toBe('token-existente');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe continuar aunque falle la emisión de la cookie', () => {
    const req = createRequest({
      cookies: {},
    });
    const res = createResponse();
    const next = vi.fn();

    res.cookie.mockImplementation(() => {
      throw new Error('Cookie error');
    });

    emitirCsrfCookie(req, res, next);

    expect(logger.warn).toHaveBeenCalledWith(
      'CSRF_EMIT_FAIL',
      {
        event: 'csrf.emit_fail',
        message: 'Cookie error',
      }
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe manejar cookies undefined', () => {
    const req = createRequest({
      cookies: undefined,
    });
    const res = createResponse();
    const next = vi.fn();

    emitirCsrfCookie(req, res, next);

    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(req._csrfToken).toMatch(/^[a-f0-9]{64}$/);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('verificarCsrf', () => {
  it('debe rechazar un token CSRF con misma longitud pero contenido diferente', () => {
    const req = createRequest({
      method: 'POST',
      path: '/clientes',
      cookies: {
        'csrf-token': 'a'.repeat(64),
      },
      headers: {
        'x-csrf-token': 'b'.repeat(64),
      },
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token CSRF inválido.',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'CSRF_TOKEN_MISMATCH',
      expect.objectContaining({
        event: 'csrf.token_mismatch',
        method: 'POST',
        path: '/clientes',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });


  it('debe ignorar métodos no mutantes', () => {
    const req = createRequest({
      method: 'GET',
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('debe ignorar una ruta excluida', () => {
    const req = createRequest({
      method: 'POST',
      path: '/auth/login',
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debe excluir auth/register', () => {
    const req = createRequest({
      method: 'POST',
      path: '/auth/register',
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe excluir auth/refresh', () => {
    const req = createRequest({
      method: 'POST',
      path: '/auth/refresh',
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe excluir csp-report', () => {
    const req = createRequest({
      method: 'POST',
      path: '/csp-report',
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'debe exigir CSRF para %s',
    (method) => {
      const req = createRequest({
        method,
        path: '/clientes',
        cookies: {},
        headers: {},
      });
      const res = createResponse();
      const next = vi.fn();

      verificarCsrf(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token CSRF requerido.',
      });
      expect(next).not.toHaveBeenCalled();

      expect(logger.warn).toHaveBeenCalledWith(
        'CSRF_MISSING_TOKEN',
        expect.objectContaining({
          event: 'csrf.missing_token',
          method,
          path: '/clientes',
          ip: '127.0.0.1',
          userId: 10,
        })
      );
    }
  );

  it('debe usar req._csrfToken cuando no existe cookie', () => {
    const req = createRequest({
      method: 'POST',
      cookies: {},
      _csrfToken: 'token-interno',
      headers: {
        'x-csrf-token': 'token-interno',
      },
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debe aceptar tokens idénticos', () => {
    const token = 'abc123';

    const req = createRequest({
      method: 'POST',
      cookies: {
        'csrf-token': token,
      },
      headers: {
        'x-csrf-token': token,
      },
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debe rechazar tokens diferentes de igual longitud', () => {
    const req = createRequest({
      method: 'PUT',
      cookies: {
        'csrf-token': 'abcdef',
      },
      headers: {
        'x-csrf-token': 'abcdeg',
      },
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token CSRF inválido.',
    });

    expect(logger.warn).toHaveBeenCalledWith(
      'CSRF_TOKEN_MISMATCH',
      expect.objectContaining({
        event: 'csrf.token_mismatch',
        method: 'PUT',
        path: '/test',
        userId: 10,
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar tokens de diferente longitud', () => {
    const req = createRequest({
      method: 'PATCH',
      cookies: {
        'csrf-token': 'abc',
      },
      headers: {
        'x-csrf-token': 'abcdef',
      },
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token CSRF inválido.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe manejar errores al convertir los tokens a Buffer', () => {
    const req = createRequest({
      method: 'DELETE',
      cookies: {
        'csrf-token': Symbol('token-invalido'),
      },
      headers: {
        'x-csrf-token': 'token',
      },
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token CSRF inválido.',
    });
    expect(next).not.toHaveBeenCalled();

    expect(logger.warn).toHaveBeenCalledWith(
      'CSRF_TOKEN_MISMATCH',
      expect.objectContaining({
        event: 'csrf.token_mismatch',
      })
    );
  });

  it('debe manejar req.user inexistente al registrar token ausente', () => {
    const req = createRequest({
      method: 'POST',
      cookies: {},
      headers: {},
      user: undefined,
    });
    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(logger.warn).toHaveBeenCalledWith(
      'CSRF_MISSING_TOKEN',
      expect.objectContaining({
        userId: null,
      })
    );
  });

  it('debe manejar error externo y continuar con next', () => {
    const req = createRequest();
    Object.defineProperty(req, 'method', {
      configurable: true,
      get() {
        throw new Error('Request error');
      },
    });

    const res = createResponse();
    const next = vi.fn();

    verificarCsrf(req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      'CSRF_VERIFY_FAIL',
      {
        event: 'csrf.verify_error',
        message: 'Request error',
      }
    );

    expect(next).toHaveBeenCalledTimes(1);
  });
});
