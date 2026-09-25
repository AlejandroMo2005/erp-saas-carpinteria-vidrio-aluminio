import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
};

const redis = {
  set: vi.fn(),
};

const logger = {
  warn: vi.fn(),
  info: vi.fn(),
};

const originalLoad = Module._load;
const originalSetInterval = globalThis.setInterval;

const servicePath = require.resolve(
  `${process.cwd()}/src/modules/auth/auth.service.js`
);

delete require.cache[servicePath];

globalThis.setInterval = vi.fn(() => ({
  unref: vi.fn(),
}));

Module._load = function (request, parent, isMain) {
  if (request === '../../../config/database') {
    return db;
  }

  if (request === '../../../config/redis') {
    return redis;
  }

  if (request === '../../../utils/logger') {
    return logger;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const authService = require(servicePath);

Module._load = originalLoad;
globalThis.setInterval = originalSetInterval;

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRE = '15m';
    process.env.JWT_EXPIRE_MINUTES = '15';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('COOKIE_OPTIONS', () => {
    it('debe configurar correctamente las cookies de sesión', () => {
      expect(authService.COOKIE_OPTIONS).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    });

    it('debe configurar correctamente las opciones para limpiar la cookie', () => {
      expect(authService.COOKIE_CLEAR_OPTIONS).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
      });
    });
  });

  describe('generateAccessToken', () => {
    it('debe generar un token con id, rol, empresa_id y jti', async () => {
      const jwt = require('jsonwebtoken');

      const result = authService.generateAccessToken(
        15,
        'ADMIN',
        3
      );

      expect(result.token).toEqual(expect.any(String));
      expect(result.jti).toEqual(expect.any(String));

      const decoded = jwt.verify(result.token, 'test-secret');

      expect(decoded.id).toBe(15);
      expect(decoded.rol).toBe('ADMIN');
      expect(decoded.empresa_id).toBe(3);
      expect(decoded.jti).toBe(result.jti);
    });

    it('debe usar JWT_EXPIRE cuando está configurado', () => {
      process.env.JWT_EXPIRE = '30m';

      const jwt = require('jsonwebtoken');
      const result = authService.generateAccessToken(1, 'VENDEDOR', 2);
      const decoded = jwt.verify(result.token, 'test-secret');

      expect(decoded.exp - decoded.iat).toBe(30 * 60);
    });

    it('debe usar 15m cuando JWT_EXPIRE no está definido', () => {
      delete process.env.JWT_EXPIRE;

      const jwt = require('jsonwebtoken');
      const result = authService.generateAccessToken(1, 'VENDEDOR', 2);
      const decoded = jwt.verify(result.token, 'test-secret');

      expect(decoded.exp - decoded.iat).toBe(15 * 60);
    });
  });

  describe('generateRefreshToken', () => {
    it('debe generar un token y su hash SHA-256', () => {
      const crypto = require('crypto');

      const result = authService.generateRefreshToken();

      expect(result.token).toEqual(expect.any(String));
      expect(result.token).toHaveLength(128);
      expect(result.tokenHash).toEqual(expect.any(String));
      expect(result.tokenHash).toHaveLength(64);

      const expectedHash = crypto
        .createHash('sha256')
        .update(result.token)
        .digest('hex');

      expect(result.tokenHash).toBe(expectedHash);
    });

    it('debe generar tokens diferentes en llamadas sucesivas', () => {
      const first = authService.generateRefreshToken();
      const second = authService.generateRefreshToken();

      expect(first.token).not.toBe(second.token);
      expect(first.tokenHash).not.toBe(second.tokenHash);
    });
  });

  describe('getIp', () => {
    it('debe usar req.ip cuando está disponible', () => {
      expect(
        authService.getIp({
          ip: '192.168.1.10',
          headers: {
            'x-forwarded-for': '10.0.0.1',
          },
        })
      ).toBe('192.168.1.10');
    });

    it('debe usar la primera IP de x-forwarded-for', () => {
      expect(
        authService.getIp({
          headers: {
            'x-forwarded-for': '10.0.0.5, 10.0.0.6, 10.0.0.7',
          },
        })
      ).toBe('10.0.0.5');
    });

    it('debe retornar unknown cuando no existe IP', () => {
      expect(
        authService.getIp({
          headers: {},
        })
      ).toBe('unknown');
    });

    it('debe limpiar espacios de la primera IP reenviada', () => {
      expect(
        authService.getIp({
          headers: {
            'x-forwarded-for': ' 10.0.0.8, 10.0.0.9',
          },
        })
      ).toBe('10.0.0.8');
    });
  });

  describe('crearSesion', () => {
    it('debe crear una sesión con IP y user-agent', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const req = {
        ip: '192.168.1.20',
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      };

      const before = Date.now();

      await authService.crearSesion(
        10,
        'hash-token',
        req,
        7
      );

      const after = Date.now();

      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('INSERT INTO usuarios_sesiones');
      expect(params[0]).toBe(10);
      expect(params[1]).toBe('hash-token');
      expect(params[2]).toBe('192.168.1.20');
      expect(params[3]).toBe('Mozilla/5.0');
      expect(params[4]).toBeInstanceOf(Date);

      expect(params[4].getTime()).toBeGreaterThanOrEqual(
        before + 7 * 24 * 60 * 60 * 1000
      );
      expect(params[4].getTime()).toBeLessThanOrEqual(
        after + 7 * 24 * 60 * 60 * 1000
      );
    });

    it('debe truncar el user-agent a 255 caracteres', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const longUserAgent = 'A'.repeat(300);

      await authService.crearSesion(
        5,
        'hash',
        {
          ip: '127.0.0.1',
          headers: {
            'user-agent': longUserAgent,
          },
        },
        1
      );

      const params = db.query.mock.calls[0][1];

      expect(params[3]).toHaveLength(255);
    });

    it('debe usar null cuando no existe user-agent', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await authService.crearSesion(
        5,
        'hash',
        {
          ip: '127.0.0.1',
          headers: {},
        },
        1
      );

      const params = db.query.mock.calls[0][1];

      expect(params[3]).toBeNull();
    });

    it('debe propagar errores de la base de datos', async () => {
      const error = new Error('DB_ERROR');
      db.query.mockRejectedValueOnce(error);

      await expect(
        authService.crearSesion(
          5,
          'hash',
          {
            ip: '127.0.0.1',
            headers: {},
          },
          1
        )
      ).rejects.toThrow('DB_ERROR');
    });
  });

  describe('addToBlacklist', () => {
    it('debe ignorar un jti vacío', async () => {
      await authService.addToBlacklist();

      expect(redis.set).not.toHaveBeenCalled();
      expect(db.query).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('debe guardar el jti en Redis y MySQL', async () => {
      redis.set.mockResolvedValueOnce('OK');
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await authService.addToBlacklist('jti-123');

      expect(redis.set).toHaveBeenCalledTimes(1);
      expect(redis.set).toHaveBeenCalledWith(
        'bl:jti-123',
        '1',
        'EX',
        900
      );

      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('INSERT IGNORE INTO token_blacklist');
      expect(params[0]).toBe('jti-123');
      expect(params[1]).toBeInstanceOf(Date);
    });

    it('debe usar JWT_EXPIRE_MINUTES para calcular el TTL', async () => {
      process.env.JWT_EXPIRE_MINUTES = '30';

      redis.set.mockResolvedValueOnce('OK');
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await authService.addToBlacklist('jti-30');

      expect(redis.set).toHaveBeenCalledWith(
        'bl:jti-30',
        '1',
        'EX',
        1800
      );
    });

    it('debe calcular expiresAt a partir del TTL antes de guardar en MySQL', async () => {
      const ahora = 1_750_000_000_000;

      vi.spyOn(Date, 'now').mockReturnValue(ahora);
      process.env.JWT_EXPIRE_MINUTES = '30';

      redis.set.mockResolvedValueOnce('OK');
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await authService.addToBlacklist('jti-expira');

      expect(redis.set).toHaveBeenCalledWith(
        'bl:jti-expira',
        '1',
        'EX',
        1800
      );

      expect(db.query).toHaveBeenCalledWith(
        'INSERT IGNORE INTO token_blacklist (jti, expires_at) VALUES (?, ?)',
        [
          'jti-expira',
          new Date(ahora + 1800 * 1000),
        ]
      );
    });

    it('debe registrar warning si falla Redis o MySQL', async () => {
      redis.set.mockRejectedValueOnce(new Error('REDIS_ERROR'));

      await authService.addToBlacklist('jti-error');

      expect(logger.warn).toHaveBeenCalledWith(
        'BLACKLIST_INSERT_FAIL',
        expect.objectContaining({
          event: 'auth.blacklist_insert_fail',
          jti: 'jti-error',
          message: 'REDIS_ERROR',
        })
      );
    });

    it('debe registrar warning si falla la auditoría MySQL después de Redis', async () => {
      redis.set.mockResolvedValueOnce('OK');
      db.query.mockRejectedValueOnce(new Error('MYSQL_ERROR'));

      await authService.addToBlacklist('jti-mysql-error');

      expect(redis.set).toHaveBeenCalledWith(
        'bl:jti-mysql-error',
        '1',
        'EX',
        900
      );

      expect(db.query).toHaveBeenCalledWith(
        'INSERT IGNORE INTO token_blacklist (jti, expires_at) VALUES (?, ?)',
        expect.arrayContaining([
          'jti-mysql-error',
          expect.any(Date),
        ])
      );

      expect(logger.warn).toHaveBeenCalledWith(
        'BLACKLIST_INSERT_FAIL',
        expect.objectContaining({
          event: 'auth.blacklist_insert_fail',
          jti: 'jti-mysql-error',
          message: 'MYSQL_ERROR',
        })
      );
    });
  });

  describe('cleanupBlacklist', () => {
  it('no debe registrar información cuando no existen tokens expirados', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

    await authService.cleanupBlacklist();

    expect(db.query).toHaveBeenCalledWith(
      'DELETE FROM token_blacklist WHERE expires_at < NOW()'
    );

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

    it('debe registrar información cuando elimina tokens expirados', async () => {
      db.query.mockResolvedValueOnce([
        { affectedRows: 5 },
      ]);

      await authService.cleanupBlacklist();

      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM token_blacklist WHERE expires_at < NOW()'
      );

      expect(logger.info).toHaveBeenCalledWith(
        'BLACKLIST_CLEANUP',
        {
          event: 'auth.blacklist_cleanup',
          deleted: 5,
        }
      );
    });

    it('no debe registrar información cuando no elimina registros', async () => {
      db.query.mockResolvedValueOnce([
        { affectedRows: 0 },
      ]);

      await authService.cleanupBlacklist();

      expect(logger.info).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('debe registrar warning cuando falla la limpieza', async () => {
      db.query.mockRejectedValueOnce(
        new Error('CLEANUP_ERROR')
      );

      await authService.cleanupBlacklist();

      expect(logger.warn).toHaveBeenCalledWith(
        'BLACKLIST_CLEANUP_FAIL',
        {
          event: 'auth.blacklist_cleanup_fail',
          message: 'CLEANUP_ERROR',
        }
      );
    });
  });

  describe('actualizarActividad', () => {
    it('debe actualizar la última actividad del usuario', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      authService.actualizarActividad(25);

      await new Promise(resolve => setImmediate(resolve));

      expect(db.query).toHaveBeenCalledWith(
        'UPDATE usuarios SET last_activity = NOW() WHERE id = ?',
        [25]
      );

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('debe registrar warning cuando falla la actualización', async () => {
      db.query.mockRejectedValueOnce(
        new Error('ACTIVITY_ERROR')
      );

      authService.actualizarActividad(25);

      await new Promise(resolve => setImmediate(resolve));

      expect(logger.warn).toHaveBeenCalledWith(
        'ACTIVITY_UPDATE_FAIL',
        {
          event: 'auth.activity_update_fail',
          userId: 25,
          message: 'ACTIVITY_ERROR',
        }
      );
    });
  });
});
