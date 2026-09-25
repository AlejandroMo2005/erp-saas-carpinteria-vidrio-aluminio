import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
};

const logger = {
  error: vi.fn(),
  warn: vi.fn(),
};

const originalLoad = Module._load;

const databasePath = require.resolve(
  `${process.cwd()}/config/database.js`
);

const loggerPath = require.resolve(
  `${process.cwd()}/utils/logger.js`
);

const activityTrackerPath = require.resolve(
  `${process.cwd()}/src/shared/middleware/activityTracker.js`
);

delete require.cache[activityTrackerPath];
delete require.cache[databasePath];
delete require.cache[loggerPath];

Module._load = function (request, parent, isMain) {
  if (
    request === '../../../config/database' ||
    request === databasePath
  ) {
    return db;
  }

  if (
    request === '../../../utils/logger' ||
    request === loggerPath
  ) {
    return logger;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const {
  trackActivity,
  inactivityGuard,
  clearActivityCache,
} = require(activityTrackerPath);

Module._load = originalLoad;

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  for (let userId = 1; userId <= 10; userId++) {
    clearActivityCache(userId);
  }

  process.env.SESSION_INACTIVITY_MINUTES = '15';
  process.env.JWT_EXPIRE_MINUTES = '15';
});

describe('trackActivity', () => {
  it('debe continuar sin consultar BD cuando no existe usuario', async () => {
    const req = {};
    const res = createResponse();
    const next = vi.fn();

    await trackActivity(req, res, next);

    expect(db.query).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe actualizar last_activity cuando ha pasado el intervalo mínimo', async () => {
    const req = {
      user: {
        id: 1,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    vi.spyOn(Date, 'now').mockReturnValue(120000);

    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await trackActivity(req, res, next);

    expect(db.query).toHaveBeenCalledWith(
      'UPDATE usuarios SET last_activity = NOW() WHERE id = ?',
      [1]
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('no debe actualizar BD si la actividad reciente está dentro del intervalo', async () => {
    const req = {
      user: {
        id: 2,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(120000)
      .mockReturnValueOnce(120000);

    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await trackActivity(req, res, next);
    await trackActivity(req, res, next);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('debe actualizar nuevamente después de superar el intervalo mínimo', async () => {
    const req = {
      user: {
        id: 3,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(120000)
      .mockReturnValueOnce(181000);

    db.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await trackActivity(req, res, next);
    await trackActivity(req, res, next);

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('debe registrar advertencia y continuar si falla la actualización de actividad', async () => {
    const req = {
      user: {
        id: 4,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    vi.spyOn(Date, 'now').mockReturnValue(120000);

    db.query.mockRejectedValueOnce(new Error('DB activity error'));

    await trackActivity(req, res, next);

    expect(logger.warn).toHaveBeenCalledWith(
      'TRACK_ACTIVITY_FAIL',
      {
        event: 'activity.track_fail',
        userId: 4,
        message: 'DB activity error',
      }
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('inactivityGuard', () => {
  it('debe continuar sin consultar BD cuando no existe usuario', async () => {
    const req = {};
    const res = createResponse();
    const next = vi.fn();

    await inactivityGuard(req, res, next);

    expect(db.query).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe responder 401 cuando el usuario no existe en BD', async () => {
    const req = {
      user: {
        id: 1,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    db.query.mockResolvedValueOnce([[]]);

    await inactivityGuard(req, res, next);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT last_activity FROM usuarios WHERE id = ? LIMIT 1',
      [1]
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Sesión inválida.',
      expired: true,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe continuar cuando last_activity es null', async () => {
    const req = {
      user: {
        id: 2,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    db.query.mockResolvedValueOnce([
      [{ last_activity: null }],
    ]);

    await inactivityGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('debe continuar cuando la sesión sigue activa', async () => {
    const req = {
      user: {
        id: 3,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    const now = 1000000;
    const lastActivity = new Date(now - 5 * 60 * 1000);

    vi.spyOn(Date, 'now').mockReturnValue(now);

    db.query.mockResolvedValueOnce([
      [{ last_activity: lastActivity }],
    ]);

    await inactivityGuard(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('debe invalidar y limpiar la sesión cuando supera el límite de inactividad', async () => {
    const req = {
      user: {
        id: 4,
        jti: 'jti-expired-123',
      },
      ip: '10.0.0.5',
    };
    const res = createResponse();
    const next = vi.fn();

    const now = 2000000;
    const lastActivity = new Date(now - 16 * 60 * 1000);

    vi.spyOn(Date, 'now').mockReturnValue(now);

    db.query
      .mockResolvedValueOnce([
        [{ last_activity: lastActivity }],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await inactivityGuard(req, res, next);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      'SELECT last_activity FROM usuarios WHERE id = ? LIMIT 1',
      [4]
    );

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      'INSERT IGNORE INTO token_blacklist (jti, expires_at) VALUES (?, ?)',
      ['jti-expired-123', expect.any(Date)]
    );

    expect(db.query).toHaveBeenNthCalledWith(
      3,
      'DELETE FROM usuarios_sesiones WHERE usuario_id = ?',
      [4]
    );

    expect(db.query).toHaveBeenNthCalledWith(
      4,
      'UPDATE usuarios SET token_id = NULL WHERE id = ?',
      [4]
    );

    expect(logger.warn).toHaveBeenCalledWith(
      'SESSION_EXPIRED_INACTIVITY',
      expect.objectContaining({
        event: 'activity.session_expired',
        userId: 4,
        ip: '10.0.0.5',
        inactivoMinutos: 16,
        limiteMinutos: 15,
      })
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Sesión expirada por inactividad (15 min). Inicia sesión nuevamente.',
      expired: true,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe continuar con la expiración aunque falle la inserción en blacklist', async () => {
    const req = {
      user: {
        id: 5,
        jti: 'jti-blacklist-fail',
      },
      ip: '10.0.0.6',
    };
    const res = createResponse();
    const next = vi.fn();

    const now = 3000000;
    const lastActivity = new Date(now - 20 * 60 * 1000);

    vi.spyOn(Date, 'now').mockReturnValue(now);

    db.query
      .mockResolvedValueOnce([
        [{ last_activity: lastActivity }],
      ])
      .mockRejectedValueOnce(new Error('Blacklist DB error'))
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await inactivityGuard(req, res, next);

    expect(logger.warn).toHaveBeenCalledWith(
      'BLACKLIST_INSERT_FAIL',
      {
        event: 'activity.blacklist_insert_fail',
        jti: 'jti-blacklist-fail',
        message: 'Blacklist DB error',
      }
    );

    expect(db.query).toHaveBeenCalledTimes(4);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        expired: true,
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe usar 15 minutos por defecto al expirar el JWT si JWT_EXPIRE_MINUTES no está definido', async () => {
    const req = {
      user: {
        id: 7,
        jti: 'jti-default-expire',
      },
      ip: '10.0.0.7',
    };
    const res = createResponse();
    const next = vi.fn();

    const now = 5000000;
    const lastActivity = new Date(now - 20 * 60 * 1000);

    vi.spyOn(Date, 'now').mockReturnValue(now);

    delete process.env.JWT_EXPIRE_MINUTES;

    db.query
      .mockResolvedValueOnce([
        [{ last_activity: lastActivity }],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await inactivityGuard(req, res, next);

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      'INSERT IGNORE INTO token_blacklist (jti, expires_at) VALUES (?, ?)',
      ['jti-default-expire', expect.any(Date)]
    );

    const expiresAt = db.query.mock.calls[1][1][1];
    expect(expiresAt).toEqual(new Date(now + 15 * 60 * 1000));

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Sesión expirada por inactividad (15 min). Inicia sesión nuevamente.',
      expired: true,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe continuar la expiración sin insertar blacklist cuando no existe jti', async () => {
    const req = {
      user: {
        id: 8,
      },
      ip: '10.0.0.8',
    };
    const res = createResponse();
    const next = vi.fn();

    const now = 4000000;
    const lastActivity = new Date(now - 20 * 60 * 1000);

    vi.spyOn(Date, 'now').mockReturnValue(now);

    db.query
      .mockResolvedValueOnce([
        [{ last_activity: lastActivity }],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await inactivityGuard(req, res, next);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      'SELECT last_activity FROM usuarios WHERE id = ? LIMIT 1',
      [8]
    );

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM usuarios_sesiones WHERE usuario_id = ?',
      [8]
    );

    expect(db.query).toHaveBeenNthCalledWith(
      3,
      'UPDATE usuarios SET token_id = NULL WHERE id = ?',
      [8]
    );

    expect(db.query).toHaveBeenCalledTimes(3);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Sesión expirada por inactividad (15 min). Inicia sesión nuevamente.',
      expired: true,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it('debe registrar error y continuar si falla la consulta del guard', async () => {
    const req = {
      user: {
        id: 6,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    db.query.mockRejectedValueOnce(new Error('Guard DB error'));

    await inactivityGuard(req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      'INACTIVITY_GUARD_ERROR',
      {
        event: 'activity.guard_error',
        message: 'Guard DB error',
        userId: 6,
      }
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('clearActivityCache', () => {
  it('debe eliminar la actividad almacenada y devolver true', async () => {
    const req = {
      user: {
        id: 7,
      },
    };
    const res = createResponse();
    const next = vi.fn();

    vi.spyOn(Date, 'now').mockReturnValue(120000);

    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await trackActivity(req, res, next);

    expect(clearActivityCache(7)).toBe(true);
  });

  it('debe devolver false cuando el usuario no tiene actividad almacenada', () => {
    expect(clearActivityCache(9999)).toBe(false);
  });
});
