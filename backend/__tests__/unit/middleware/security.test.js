import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const logger = {
  security: {
    loginBlocked: vi.fn(),
    sqliDetected: vi.fn(),
  },
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

const rateLimit = vi.fn((options) => {
  const middleware = vi.fn((req, res, next) => {
    next();
  });

  middleware.options = options;
  return middleware;
});

const xss = vi.fn((value) => value.replace(/<script.*?>.*?<\/script>/gis, ''));

const originalLoad = Module._load;

const loggerPath = require.resolve(`${process.cwd()}/src/shared/utils/logger.js`);
const securityPath = require.resolve(
  `${process.cwd()}/src/shared/middleware/security.js`
);

delete require.cache[securityPath];
delete require.cache[loggerPath];

Module._load = function (request, parent, isMain) {
  if (request === '../utils/logger' || request === loggerPath) {
    return logger;
  }

  if (request === 'express-rate-limit') {
    return rateLimit;
  }

  if (request === 'xss') {
    return xss;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const {
  globalLimiter,
  authLimiter,
  xssProtect,
  sqlInjectionProtect,
  timingSafeEqual,
  timingNormalize,
  additionalSecurityHeaders,
  httpLogger,
  hasSQLInjection,
} = require(securityPath);

Module._load = originalLoad;

const createResponse = (statusCode = 200) => {
  const listeners = {};
  const res = {
    statusCode,
    status: vi.fn(function (code) {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    removeHeader: vi.fn(),
    on: vi.fn((event, callback) => {
      listeners[event] = callback;
    }),
    emit: (event) => {
      if (listeners[event]) listeners[event]();
    },
  };

  return res;
};

const rateLimitCalls = [...rateLimit.mock.calls];

beforeEach(() => {
  vi.clearAllMocks();
  rateLimit.mock.calls.push(...rateLimitCalls);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('rate limiters', () => {
  it('debe configurar correctamente el globalLimiter', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        windowMs: 60000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
      })
    );
    expect(typeof globalLimiter).toBe('function');
  });

  it('debe ejecutar el handler del globalLimiter cuando se alcanza el límite', () => {
    const options = globalLimiter.options;
    const res = createResponse();
    const req = { ip: '127.0.0.1', path: '/api/test' };

    options.handler(req, res);

    expect(logger.security.loginBlocked).toHaveBeenCalledWith(
      '127.0.0.1',
      '/api/test'
    );
    expect(res.statusCode).toBe(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Demasiadas peticiones. Intenta nuevamente en 1 minuto.',
      retryAfter: 60,
    });
  });

  it('debe configurar correctamente el authLimiter', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        windowMs: 60000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
      })
    );
    expect(typeof authLimiter).toBe('function');
  });

  it('debe ejecutar el handler del authLimiter cuando se alcanza el límite', () => {
    const options = authLimiter.options;
    const res = createResponse();
    const req = { ip: '10.0.0.1' };

    options.handler(req, res);

    expect(logger.warn).toHaveBeenCalledWith(
      'Rate limit AUTH',
      expect.objectContaining({
        ip: '10.0.0.1',
        timestamp: expect.any(String),
      })
    );
    expect(res.statusCode).toBe(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        'Demasiados intentos de autenticación. Intenta nuevamente en 1 minuto.',
      retryAfter: 60,
    });
  });
});

describe('hasSQLInjection', () => {
  it('debe devolver false para valores que no son string', () => {
    expect(hasSQLInjection(null)).toBe(false);
    expect(hasSQLInjection(undefined)).toBe(false);
    expect(hasSQLInjection(123)).toBe(false);
    expect(hasSQLInjection({})).toBe(false);
  });

  it.each([
    'SELECT * FROM usuarios',
    'INSERT INTO usuarios VALUES',
    'UPDATE usuarios SET nombre = x',
    'DELETE FROM usuarios',
    'DROP TABLE usuarios',
    'TRUNCATE TABLE usuarios',
    'ALTER TABLE usuarios',
    'CREATE TABLE usuarios',
    'EXEC procedimiento',
    'EXECUTE procedimiento',
    'UNION SELECT password FROM usuarios',
    'CAST(id AS CHAR)',
    'CONVERT(id, CHAR)',
  ])('debe detectar palabra SQL peligrosa: %s', (value) => {
    expect(hasSQLInjection(value)).toBe(true);
  });

  it.each([
    '-- comentario',
    '/* comentario */',
    'usuario=1; DROP TABLE usuarios',
    '1 OR usuario=usuario',
    '1 AND id=id',
    'INFORMATION_SCHEMA.TABLES',
    'SYSOBJECTS',
    'SYSCOLUMNS',
    'SLEEP(5)',
    'BENCHMARK(1000000,MD5(1))',
    'WAITFOR DELAY',
  ])('debe detectar patrón de SQL injection: %s', (value) => {
    expect(hasSQLInjection(value)).toBe(true);
  });

  it('debe devolver false para texto normal', () => {
    expect(hasSQLInjection('Juan Pérez')).toBe(false);
    expect(hasSQLInjection('ventana de aluminio')).toBe(false);
    expect(hasSQLInjection('cliente@example.com')).toBe(false);
  });

  it('debe reutilizar correctamente los patrones globales', () => {
    expect(hasSQLInjection('SELECT 1')).toBe(true);
    expect(hasSQLInjection('texto normal')).toBe(false);
    expect(hasSQLInjection('DROP TABLE test')).toBe(true);
  });
});

describe('xssProtect', () => {
  it('debe sanitizar body, query y params', () => {
    const req = {
      body: { nombre: '<script>alert(1)</script>' },
      query: { busqueda: '<script>alert(2)</script>' },
      params: { id: '<script>alert(3)</script>' },
    };
    const res = createResponse();
    const next = vi.fn();

    xssProtect(req, res, next);

    expect(xss).toHaveBeenCalledTimes(3);
    expect(req.body.nombre).toBe('');
    expect(req.query.busqueda).toBe('');
    expect(req.params.id).toBe('');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe funcionar cuando body, query y params no existen', () => {
    const req = {};
    const res = createResponse();
    const next = vi.fn();

    xssProtect(req, res, next);

    expect(xss).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe sanitizar arrays y objetos anidados', () => {
    const req = {
      body: {
        nombre: '<script>x</script>',
        items: [
          '<script>y</script>',
          {
            descripcion: '<script>z</script>',
            cantidad: 2,
          },
        ],
      },
    };
    const res = createResponse();
    const next = vi.fn();

    xssProtect(req, res, next);

    expect(xss).toHaveBeenCalledTimes(3);
    expect(req.body.nombre).toBe('');
    expect(req.body.items[0]).toBe('');
    expect(req.body.items[1].descripcion).toBe('');
    expect(req.body.items[1].cantidad).toBe(2);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe preservar valores null, booleanos y números', () => {
    const req = {
      body: {
        a: null,
        b: true,
        c: false,
        d: 123,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    xssProtect(req, res, next);

    expect(req.body).toEqual({
      a: null,
      b: true,
      c: false,
      d: 123,
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('sqlInjectionProtect', () => {
  it('debe rechazar SQL injection en body', () => {
    const req = {
      body: { nombre: 'SELECT * FROM usuarios' },
      query: {},
      params: {},
      ip: '127.0.0.1',
      path: '/api/clientes',
    };
    const res = createResponse();
    const next = vi.fn();

    sqlInjectionProtect(req, res, next);

    expect(logger.security.sqliDetected).toHaveBeenCalledWith(
      '127.0.0.1',
      '/api/clientes',
      JSON.stringify(req.body).slice(0, 100)
    );
    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Solicitud inválida. Caracteres no permitidos detectados.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar SQL injection en query', () => {
    const req = {
      body: {},
      query: { search: 'DROP TABLE usuarios' },
      params: {},
      ip: '127.0.0.1',
      path: '/api/clientes',
    };
    const res = createResponse();
    const next = vi.fn();

    sqlInjectionProtect(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar SQL injection en params', () => {
    const req = {
      body: {},
      query: {},
      params: { id: '1 OR id=id' },
      ip: '127.0.0.1',
      path: '/api/clientes/1',
    };
    const res = createResponse();
    const next = vi.fn();

    sqlInjectionProtect(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('debe permitir una solicitud sin SQL injection', () => {
    const req = {
      body: { nombre: 'Juan Pérez' },
      query: { page: '1' },
      params: { id: '10' },
      ip: '127.0.0.1',
      path: '/api/clientes/10',
    };
    const res = createResponse();
    const next = vi.fn();

    sqlInjectionProtect(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debe detectar SQL injection dentro de objetos anidados', () => {
    const req = {
      body: {
        cliente: {
          datos: {
            nombre: 'UNION SELECT password FROM usuarios',
          },
        },
      },
      query: {},
      params: {},
      ip: '127.0.0.1',
      path: '/api/test',
    };
    const res = createResponse();
    const next = vi.fn();

    sqlInjectionProtect(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('debe permitir estructuras con objetos y arrays sin SQL injection', () => {
    const req = {
      body: {
        cliente: {
          nombre: 'Juan',
          items: [
            { descripcion: 'Ventana' },
            { cantidad: 2 },
          ],
        },
      },
      query: {},
      params: {},
    };
    const res = createResponse();
    const next = vi.fn();

    sqlInjectionProtect(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('timingSafeEqual', () => {
  it('debe devolver false si alguno de los valores no es string', () => {
    expect(timingSafeEqual(null, 'abc')).toBe(false);
    expect(timingSafeEqual('abc', null)).toBe(false);
    expect(timingSafeEqual(123, '123')).toBe(false);
    expect(timingSafeEqual('123', 123)).toBe(false);
  });

  it('debe devolver true para strings idénticos', () => {
    expect(timingSafeEqual('token-123', 'token-123')).toBe(true);
  });

  it('debe devolver false para strings diferentes de igual longitud', () => {
    expect(timingSafeEqual('token-123', 'token-456')).toBe(false);
  });

  it('debe devolver false para strings de diferente longitud', () => {
    expect(timingSafeEqual('abc', 'abcdef')).toBe(false);
    expect(timingSafeEqual('abcdef', 'abc')).toBe(false);
  });

  it('debe comparar correctamente strings vacíos', () => {
    expect(timingSafeEqual('', '')).toBe(true);
  });
});

describe('timingNormalize', () => {
  it('debe llamar next y reemplazar res.json', () => {
    const req = {};
    const res = createResponse();
    const next = vi.fn();

    timingNormalize()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.json).toBeTypeOf('function');
  });

  it('debe ejecutar json inmediatamente cuando no queda tiempo', () => {
    vi.useFakeTimers();

    const req = {};
    const res = createResponse();
    const originalJson = res.json;
    const next = vi.fn();

    timingNormalize(0)(req, res, next);

    res.json({ success: true });

    expect(originalJson).toHaveBeenCalledWith({ success: true });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe retrasar json cuando todavía queda tiempo', () => {
    vi.useFakeTimers();

    const req = {};
    const res = createResponse();
    const originalJson = res.json;
    const next = vi.fn();

    timingNormalize(200)(req, res, next);

    res.json({ success: true });

    expect(originalJson).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);

    expect(originalJson).toHaveBeenCalledWith({ success: true });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe aceptar un tiempo mínimo personalizado', () => {
    vi.useFakeTimers();

    const req = {};
    const res = createResponse();
    const next = vi.fn();

    timingNormalize(50)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    res.json({ message: 'ok' });

    vi.advanceTimersByTime(50);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('additionalSecurityHeaders', () => {
  it('debe establecer todos los headers de seguridad en desarrollo', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const req = {};
    const res = createResponse();
    const next = vi.fn();

    additionalSecurityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Frame-Options',
      'DENY'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-DNS-Prefetch-Control',
      'off'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );
    expect(res.setHeader).not.toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.anything()
    );
    expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    expect(next).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = originalEnv;
  });

  it('debe establecer HSTS en producción', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const req = {};
    const res = createResponse();
    const next = vi.fn();

    additionalSecurityHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    expect(next).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = originalEnv;
  });
});

describe('httpLogger', () => {
  it('debe registrar respuestas 5xx como error', () => {
    const req = {
      method: 'GET',
      path: '/api/test',
      ip: '127.0.0.1',
      user: { id: 15 },
    };
    const res = createResponse(500);
    const next = vi.fn();

    httpLogger(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    res.emit('finish');

    expect(logger.error).toHaveBeenCalledWith(
      'HTTP',
      expect.objectContaining({
        method: 'GET',
        path: '/api/test',
        status: 500,
        ip: '127.0.0.1',
        userId: 15,
        ms: expect.any(Number),
      })
    );
  });

  it('debe registrar respuestas 4xx como warn', () => {
    const req = {
      method: 'POST',
      path: '/api/test',
      ip: '127.0.0.1',
      user: { id: 20 },
    };
    const res = createResponse(404);
    const next = vi.fn();

    httpLogger(req, res, next);

    res.emit('finish');

    expect(logger.warn).toHaveBeenCalledWith(
      'HTTP',
      expect.objectContaining({
        method: 'POST',
        path: '/api/test',
        status: 404,
        userId: 20,
      })
    );
  });

  it('debe registrar respuestas exitosas si tardan más de un segundo', () => {
    vi.useFakeTimers();

    const req = {
      method: 'GET',
      path: '/api/lento',
      ip: '127.0.0.1',
      user: { id: 30 },
    };
    const res = createResponse(200);
    const next = vi.fn();

    httpLogger(req, res, next);

    vi.advanceTimersByTime(1001);
    res.emit('finish');

    expect(logger.info).toHaveBeenCalledWith(
      'HTTP',
      expect.objectContaining({
        method: 'GET',
        path: '/api/lento',
        status: 200,
        userId: 30,
        ms: 1001,
      })
    );
  });

  it('debe registrar respuestas 4xx con usuario inexistente', () => {
    const req = {
      method: 'GET',
      path: '/api/test',
      ip: '127.0.0.1',
    };
    const res = createResponse(401);
    const next = vi.fn();

    httpLogger(req, res, next);
    res.emit('finish');

    expect(logger.warn).toHaveBeenCalledWith(
      'HTTP',
      expect.objectContaining({
        userId: null,
      })
    );
  });

  it('no debe registrar respuestas exitosas rápidas', () => {
    const req = {
      method: 'GET',
      path: '/api/ok',
      ip: '127.0.0.1',
    };
    const res = createResponse(200);
    const next = vi.fn();

    httpLogger(req, res, next);
    res.emit('finish');

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });
});
