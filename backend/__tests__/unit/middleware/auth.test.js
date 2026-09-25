'use strict';

import { createRequire } from 'node:module';
import Module from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);

const mocks = vi.hoisted(() => ({
  jwt: {
    verify: vi.fn(),
  },
  timingSafeEqual: vi.fn(),
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    accessDenied: vi.fn(),
  },
  usuario: {
    getById: vi.fn(),
  },
  db: {
    query: vi.fn(),
  },
  redis: {
    get: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: mocks.jwt,
  verify: mocks.jwt.verify,
}));

vi.mock('../../../src/shared/middleware/security', () => ({
  timingSafeEqual: mocks.timingSafeEqual,
}));

vi.mock('../../../utils/logger', () => ({
  default: mocks.logger,
}));

const auth = require('../../../src/shared/middleware/auth');

function createResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);

  return res;
}

function createRequest(overrides = {}) {
  return {
    headers: {},
    ip: '127.0.0.1',
    path: '/api/test',
    ...overrides,
  };
}

function createProtectDependencies() {
  return {
    Usuario: mocks.usuario,
    db: mocks.db,
    redis: mocks.redis,
    jwtLib: mocks.jwt,
    timingSafeEqualFn: mocks.timingSafeEqual,
    loggerInstance: mocks.logger,
  };
}

function configureSuccessfulAuthentication({
  decoded = {
    id: 7,
    jti: 'jti-valid',
  },
  usuario = {
    id: 7,
    nombre: 'Usuario Test',
    email: 'test@example.com',
    rol: 'ADMIN',
    activo: 1,
  },
  dbRows = [
    {
      token_id: 'jti-valid',
      empresa_id: 10,
    },
  ],
  redisValue = null,
} = {}) {
  mocks.jwt.verify.mockReturnValue(decoded);
  mocks.redis.get.mockResolvedValue(redisValue);
  mocks.usuario.getById.mockResolvedValue(usuario);
  mocks.db.query.mockResolvedValue([dbRows]);
  mocks.timingSafeEqual.mockReturnValue(true);
}

function mockRuntimeModules() {
  const originalLoad = Module._load;

  Module._load = function patchedModuleLoad(request, parent, isMain) {
    if (
      request === '../../modules/usuario/usuario.repository' ||
      request.endsWith('/src/modules/usuario/usuario.repository') ||
      request.endsWith('/src/modules/usuario/usuario.repository.js')
    ) {
      return mocks.usuario;
    }

    if (
      request === '../../../config/database' ||
      request.endsWith('/src/config/database') ||
      request.endsWith('/src/config/database.js')
    ) {
      return mocks.db;
    }

    if (
      request === '../../../config/redis' ||
      request.endsWith('/src/config/redis') ||
      request.endsWith('/src/config/redis.js')
    ) {
      return mocks.redis;
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  return () => {
    Module._load = originalLoad;
  };
}

describe('auth middleware - protect', () => {
  let protect;
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.JWT_SECRET = 'test-secret';

    protect = auth.createProtect(createProtectDependencies());

    req = createRequest();
    res = createResponse();
    next = vi.fn();
  });

  it('debe rechazar una petición sin token', async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No autorizado. Token no proporcionado',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar Authorization con un esquema diferente a Bearer', async () => {
    req.headers.authorization = 'Basic abc123';

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No autorizado. Token no proporcionado',
    });
    expect(mocks.jwt.verify).not.toHaveBeenCalled();
  });

  it('debe rechazar Bearer sin token', async () => {
    req.headers.authorization = 'Bearer ';

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No autorizado. Token no proporcionado',
    });
    expect(mocks.jwt.verify).not.toHaveBeenCalled();
  });

  it('debe extraer correctamente el token Bearer', async () => {
    configureSuccessfulAuthentication();

    req.headers.authorization = 'Bearer token-123';

    await protect(req, res, next);

    expect(mocks.jwt.verify).toHaveBeenCalledWith(
      'token-123',
      'test-secret'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe registrar y rechazar un JWT expirado', async () => {
    const error = new Error('expired');
    error.name = 'TokenExpiredError';

    mocks.jwt.verify.mockImplementation(() => {
      throw error;
    });

    req.headers.authorization = 'Bearer expired-token';

    await protect(req, res, next);

    expect(mocks.logger.warn).toHaveBeenCalledWith(
      'JWT_VERIFY_FAIL',
      {
        event: 'auth.token_invalid',
        tipo: 'TokenExpiredError',
        ip: '127.0.0.1',
        path: '/api/test',
      }
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Sesión expirada. Inicia sesión nuevamente.',
      expired: true,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe registrar y rechazar un JWT inválido', async () => {
    const error = new Error('invalid');
    error.name = 'JsonWebTokenError';

    mocks.jwt.verify.mockImplementation(() => {
      throw error;
    });

    req.headers.authorization = 'Bearer invalid-token';

    await protect(req, res, next);

    expect(mocks.logger.warn).toHaveBeenCalledWith(
      'JWT_VERIFY_FAIL',
      {
        event: 'auth.token_invalid',
        tipo: 'JsonWebTokenError',
        ip: '127.0.0.1',
        path: '/api/test',
      }
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token inválido.',
      expired: false,
    });
  });

  it('debe consultar Redis cuando el JWT contiene jti', async () => {
    configureSuccessfulAuthentication();

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(mocks.redis.get).toHaveBeenCalledWith('bl:jti-valid');
  });

  it('debe continuar sin consultar Redis cuando el JWT no contiene jti', async () => {
    configureSuccessfulAuthentication({
      decoded: {
        id: 7,
      },
      dbRows: [
        {
          token_id: null,
          empresa_id: 10,
        },
      ],
    });

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(mocks.redis.get).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe rechazar un token incluido en la blacklist', async () => {
    configureSuccessfulAuthentication({
      redisValue: '1',
    });

    req.headers.authorization = 'Bearer blacklisted-token';

    await protect(req, res, next);

    expect(mocks.logger.warn).toHaveBeenCalledWith(
      'JWT_BLACKLISTED',
      {
        event: 'auth.token_blacklisted',
        userId: 7,
        ip: '127.0.0.1',
      }
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Sesión cerrada. Inicia sesión nuevamente.',
      expired: true,
    });

    expect(mocks.usuario.getById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar cuando el usuario no existe', async () => {
    mocks.jwt.verify.mockReturnValue({
      id: 7,
      jti: 'jti-valid',
    });
    mocks.redis.get.mockResolvedValue(null);
    mocks.usuario.getById.mockResolvedValue(null);

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Usuario no encontrado',
    });

    expect(mocks.db.query).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar un usuario inactivo', async () => {
    mocks.jwt.verify.mockReturnValue({
      id: 7,
      jti: 'jti-valid',
    });
    mocks.redis.get.mockResolvedValue(null);
    mocks.usuario.getById.mockResolvedValue({
      id: 7,
      nombre: 'Usuario Inactivo',
      email: 'inactive@example.com',
      rol: 'ADMIN',
      activo: 0,
    });

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(mocks.logger.warn).toHaveBeenCalledWith(
      'ACCESS_INACTIVE_USER',
      {
        event: 'auth.inactive_user',
        userId: 7,
        ip: '127.0.0.1',
      }
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Usuario desactivado',
    });

    expect(mocks.db.query).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar cuando jti existe pero token_id no está registrado', async () => {
    configureSuccessfulAuthentication({
      dbRows: [
        {
          token_id: null,
          empresa_id: 10,
        },
      ],
    });

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(mocks.logger.warn).toHaveBeenCalledWith(
      'JWT_TOKEN_ID_NULL',
      {
        event: 'auth.token_id_null',
        userId: 7,
        ip: '127.0.0.1',
      }
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Sesión cerrada. Inicia sesión nuevamente.',
      expired: true,
    });

    expect(mocks.timingSafeEqual).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar cuando jti no coincide con token_id', async () => {
    configureSuccessfulAuthentication({
      dbRows: [
        {
          token_id: 'otro-jti',
          empresa_id: 10,
        },
      ],
    });
    mocks.timingSafeEqual.mockReturnValue(false);

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(mocks.timingSafeEqual).toHaveBeenCalledWith(
      'jti-valid',
      'otro-jti'
    );

    expect(mocks.logger.warn).toHaveBeenCalledWith(
      'JWT_REVOKED',
      {
        event: 'auth.token_revoked',
        userId: 7,
        ip: '127.0.0.1',
      }
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token revocado. Inicia sesión nuevamente.',
      expired: true,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it('debe omitir la validación jti cuando el JWT no tiene jti', async () => {
    configureSuccessfulAuthentication({
      decoded: {
        id: 7,
      },
      dbRows: [
        {
          token_id: 'stored-token-id',
          empresa_id: 10,
        },
      ],
    });

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(mocks.timingSafeEqual).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe rechazar cuando el usuario no tiene empresa asignada', async () => {
    configureSuccessfulAuthentication({
      dbRows: [
        {
          token_id: 'jti-valid',
          empresa_id: null,
        },
      ],
    });

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(mocks.logger.warn).toHaveBeenCalledWith(
      'EMPRESA_ID_NULL',
      {
        event: 'auth.empresa_id_null',
        userId: 7,
        ip: '127.0.0.1',
        note: 'Ejecutar migración Sprint 19: 02_agregar_empresa_id_safe.sql',
      }
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Usuario sin empresa asignada. Contacta al administrador.',
    });

    expect(next).not.toHaveBeenCalled();
  });

  it('debe usar null como empresa_id cuando la fila no tiene empresa_id', async () => {
    configureSuccessfulAuthentication({
      dbRows: [
        {
          token_id: 'jti-valid',
        },
      ],
    });

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Usuario sin empresa asignada. Contacta al administrador.',
    });
  });

  it('debe usar null como token_id cuando la fila no tiene token_id', async () => {
    configureSuccessfulAuthentication({
      dbRows: [
        {
          empresa_id: 10,
        },
      ],
    });

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(mocks.logger.warn).toHaveBeenCalledWith(
      'JWT_TOKEN_ID_NULL',
      {
        event: 'auth.token_id_null',
        userId: 7,
        ip: '127.0.0.1',
      }
    );

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('debe poblar req.user y llamar next en una autenticación válida', async () => {
    configureSuccessfulAuthentication();

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(req.user).toEqual({
      id: 7,
      nombre: 'Usuario Test',
      email: 'test@example.com',
      rol: 'ADMIN',
      empresa_id: 10,
      jti: 'jti-valid',
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debe colocar jti null en req.user cuando el JWT no tiene jti', async () => {
    configureSuccessfulAuthentication({
      decoded: {
        id: 7,
      },
      dbRows: [
        {
          token_id: null,
          empresa_id: 10,
        },
      ],
    });

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(req.user).toEqual({
      id: 7,
      nombre: 'Usuario Test',
      email: 'test@example.com',
      rol: 'ADMIN',
      empresa_id: 10,
      jti: null,
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe enviar 500 cuando Redis lanza un error', async () => {
    mocks.jwt.verify.mockReturnValue({
      id: 7,
      jti: 'jti-valid',
    });
    mocks.redis.get.mockRejectedValue(new Error('Redis unavailable'));

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(mocks.logger.error).toHaveBeenCalledWith(
      'AUTH_MIDDLEWARE_ERROR',
      {
        event: 'auth.middleware_error',
        message: 'Redis unavailable',
        ip: '127.0.0.1',
        path: '/api/test',
      }
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error en la autenticación',
    });

    expect(next).not.toHaveBeenCalled();
  });

  it('debe enviar 500 cuando Usuario.getById lanza un error', async () => {
    mocks.jwt.verify.mockReturnValue({
      id: 7,
      jti: 'jti-valid',
    });
    mocks.redis.get.mockResolvedValue(null);
    mocks.usuario.getById.mockRejectedValue(
      new Error('Usuario repository failure')
    );

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(mocks.logger.error).toHaveBeenCalledWith(
      'AUTH_MIDDLEWARE_ERROR',
      {
        event: 'auth.middleware_error',
        message: 'Usuario repository failure',
        ip: '127.0.0.1',
        path: '/api/test',
      }
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error en la autenticación',
    });
  });

  it('debe enviar 500 cuando la consulta de BD falla', async () => {
    mocks.jwt.verify.mockReturnValue({
      id: 7,
      jti: 'jti-valid',
    });
    mocks.redis.get.mockResolvedValue(null);
    mocks.usuario.getById.mockResolvedValue({
      id: 7,
      nombre: 'Usuario Test',
      email: 'test@example.com',
      rol: 'ADMIN',
      activo: 1,
    });
    mocks.db.query.mockRejectedValue(
      new Error('Database query failure')
    );

    req.headers.authorization = 'Bearer valid-token';

    await protect(req, res, next);

    expect(mocks.logger.error).toHaveBeenCalledWith(
      'AUTH_MIDDLEWARE_ERROR',
      {
        event: 'auth.middleware_error',
        message: 'Database query failure',
        ip: '127.0.0.1',
        path: '/api/test',
      }
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error en la autenticación',
    });
  });
});

describe('auth middleware - authorize', () => {
  let authorize;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();

    authorize = auth.createAuthorize({
      loggerInstance: mocks.logger,
    });

    res = createResponse();
    next = vi.fn();
  });

  it('debe rechazar una petición sin req.user', () => {
    const req = createRequest();

    authorize('ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No autenticado',
    });

    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar un rol que no está autorizado', () => {
    const req = createRequest({
      user: {
        id: 1,
        rol: 'VENDEDOR',
      },
    });

    authorize('ADMIN')(req, res, next);

    expect(mocks.logger.accessDenied).toHaveBeenCalledWith(
      'VENDEDOR',
      '/api/test',
      '127.0.0.1'
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No tienes permisos para acceder a este recurso',
    });

    expect(next).not.toHaveBeenCalled();
  });

  it('debe permitir un rol autorizado', () => {
    const req = createRequest({
      user: {
        id: 1,
        rol: 'ADMIN',
      },
    });

    authorize('ADMIN')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debe permitir un rol cuando coincide exactamente', () => {
    const req = createRequest({
      user: {
        id: 2,
        rol: 'VENDEDOR',
      },
    });

    authorize('VENDEDOR')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe soportar múltiples roles autorizados', () => {
    const req = createRequest({
      user: {
        id: 3,
        rol: 'SUPERVISOR',
      },
    });

    authorize('ADMIN', 'SUPERVISOR', 'VENDEDOR')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('auth middleware - exports runtime', () => {
  let restoreModuleLoad;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.JWT_SECRET = 'runtime-test-secret';

    mocks.redis.get.mockResolvedValue(null);
    mocks.timingSafeEqual.mockReturnValue(true);

    mocks.usuario.getById.mockResolvedValue({
      id: 99,
      nombre: 'Runtime User',
      email: 'runtime@example.com',
      rol: 'ADMIN',
      activo: 1,
    });

    mocks.db.query.mockResolvedValue([
      [
        {
          token_id: 'runtime-jti',
          empresa_id: 55,
        },
      ],
    ]);

    restoreModuleLoad = mockRuntimeModules();
  });

  afterEach(() => {
    restoreModuleLoad?.();
  });

  it('debe ejecutar protect mediante getRuntimeProtect', async () => {
    const token = require('jsonwebtoken').sign(
      {
        id: 99,
        jti: 'runtime-jti',
      },
      process.env.JWT_SECRET
    );

    const req = createRequest({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const res = createResponse();
    const next = vi.fn();

    await auth.protect(req, res, next);

    expect(req.user).toEqual({
      id: 99,
      nombre: 'Runtime User',
      email: 'runtime@example.com',
      rol: 'ADMIN',
      empresa_id: 55,
      jti: 'runtime-jti',
    });

    expect(mocks.redis.get).toHaveBeenCalledWith('bl:runtime-jti');

    expect(mocks.usuario.getById).toHaveBeenCalledWith(99);

    expect(mocks.db.query).toHaveBeenCalledWith(
      'SELECT token_id, empresa_id FROM usuarios WHERE id = ? LIMIT 1',
      [99]
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe reutilizar la instancia runtimeProtect en una segunda llamada', async () => {
    const firstToken = require('jsonwebtoken').sign(
      {
        id: 99,
        jti: 'runtime-jti',
      },
      process.env.JWT_SECRET
    );

    const firstReq = createRequest({
      headers: {
        authorization: `Bearer ${firstToken}`,
      },
    });
    const firstRes = createResponse();
    const firstNext = vi.fn();

    await auth.protect(firstReq, firstRes, firstNext);

    expect(firstNext).toHaveBeenCalledTimes(1);

    mocks.usuario.getById.mockResolvedValue({
      id: 100,
      nombre: 'Second Runtime User',
      email: 'second@example.com',
      rol: 'VENDEDOR',
      activo: 1,
    });

    mocks.db.query.mockResolvedValue([
      [
        {
          token_id: 'runtime-jti-2',
          empresa_id: 77,
        },
      ],
    ]);

    const secondToken = require('jsonwebtoken').sign(
      {
        id: 100,
        jti: 'runtime-jti-2',
      },
      process.env.JWT_SECRET
    );

    const secondReq = createRequest({
      headers: {
        authorization: `Bearer ${secondToken}`,
      },
    });
    const secondRes = createResponse();
    const secondNext = vi.fn();

    await auth.protect(secondReq, secondRes, secondNext);

    expect(secondReq.user).toEqual({
      id: 100,
      nombre: 'Second Runtime User',
      email: 'second@example.com',
      rol: 'VENDEDOR',
      empresa_id: 77,
      jti: 'runtime-jti-2',
    });

    expect(mocks.redis.get).toHaveBeenLastCalledWith(
      'bl:runtime-jti-2'
    );

    expect(secondNext).toHaveBeenCalledTimes(1);
  });

  it('debe ejecutar la exportación authorize usando el logger real del módulo', () => {
    const req = createRequest({
      user: {
        id: 99,
        rol: 'VENDEDOR',
      },
    });
    const res = createResponse();
    const next = vi.fn();

    auth.authorize('ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No tienes permisos para acceder a este recurso',
    });

    expect(next).not.toHaveBeenCalled();
  });
});
