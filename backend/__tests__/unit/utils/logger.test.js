'use strict';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const mockState = {
  printfCallbacks: [],
  timestampCalls: [],
  colorizeCalls: 0,
  errorsCalls: [],
  jsonCalls: 0,
  consoleTransports: [],
  fileTransports: [],
  createLoggerCalls: [],
  existsSync: true,
};

const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const winstonMock = {
  format: {
    combine: vi.fn((...args) => ({
      type: 'combine',
      args,
    })),

    timestamp: vi.fn((options) => {
      mockState.timestampCalls.push(options);
      return {
        type: 'timestamp',
        options,
      };
    }),

    errors: vi.fn((options) => {
      mockState.errorsCalls.push(options);
      return {
        type: 'errors',
        options,
      };
    }),

    json: vi.fn(() => {
      mockState.jsonCalls += 1;
      return {
        type: 'json',
      };
    }),

    colorize: vi.fn(() => {
      mockState.colorizeCalls += 1;
      return {
        type: 'colorize',
      };
    }),

    printf: vi.fn((callback) => {
      mockState.printfCallbacks.push(callback);
      return {
        type: 'printf',
        callback,
      };
    }),
  },

  transports: {
    Console: vi.fn(function (options) {
      this.options = options;
      mockState.consoleTransports.push(this);
    }),

    File: vi.fn(function (options) {
      this.options = options;
      mockState.fileTransports.push(this);
    }),
  },

  createLogger: vi.fn((options) => {
    mockState.createLoggerCalls.push({
      options,
      logger: loggerMock,
    });

    return loggerMock;
  }),
};

const fsMock = {
  existsSync: vi.fn(() => mockState.existsSync),
  mkdirSync: vi.fn(),
};

const winstonPath = require.resolve('winston');
const fsPath = require.resolve('fs');
const loggerPath = require.resolve('../../../src/shared/utils/logger.js');

const originalNodeEnv = process.env.NODE_ENV;

const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

function restoreConsole() {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
}

function resetMockState() {
  mockState.printfCallbacks.length = 0;
  mockState.timestampCalls.length = 0;
  mockState.errorsCalls.length = 0;
  mockState.consoleTransports.length = 0;
  mockState.fileTransports.length = 0;
  mockState.createLoggerCalls.length = 0;

  mockState.colorizeCalls = 0;
  mockState.jsonCalls = 0;
  mockState.existsSync = true;

  loggerMock.info.mockReset();
  loggerMock.warn.mockReset();
  loggerMock.error.mockReset();
  loggerMock.debug.mockReset();

  winstonMock.format.combine.mockClear();
  winstonMock.format.timestamp.mockClear();
  winstonMock.format.errors.mockClear();
  winstonMock.format.json.mockClear();
  winstonMock.format.colorize.mockClear();
  winstonMock.format.printf.mockClear();
  winstonMock.transports.Console.mockClear();
  winstonMock.transports.File.mockClear();
  winstonMock.createLogger.mockClear();

  fsMock.existsSync.mockClear();
  fsMock.mkdirSync.mockClear();
}

function installMocks() {
  require.cache[winstonPath] = {
    id: winstonPath,
    filename: winstonPath,
    loaded: true,
    exports: winstonMock,
  };

  require.cache[fsPath] = {
    id: fsPath,
    filename: fsPath,
    loaded: true,
    exports: fsMock,
  };
}

async function loadLogger(nodeEnv = 'development', existsSync = true) {
  restoreConsole();
  resetMockState();

  process.env.NODE_ENV = nodeEnv;
  mockState.existsSync = existsSync;

  delete require.cache[loggerPath];
  installMocks();

  return (await import('../../../src/shared/utils/logger.js?test=' + Math.random())).default;
}

afterEach(() => {
  restoreConsole();

  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }

  delete require.cache[loggerPath];

  vi.clearAllMocks();
});

describe('utils/logger', () => {
  it('crea el directorio de logs cuando no existe y configura desarrollo', async () => {
    const logger = await loadLogger('development', false);

    expect(fsMock.existsSync).toHaveBeenCalled();

    expect(fsMock.mkdirSync).toHaveBeenCalledWith(
      expect.stringMatching(/[\\/]logs$/),
      { recursive: true }
    );

    expect(mockState.timestampCalls).toHaveLength(2);

    expect(mockState.timestampCalls[0]).toEqual({
      format: 'YYYY-MM-DD HH:mm:ss',
    });

    expect(mockState.timestampCalls[1]).toEqual({
      format: 'HH:mm:ss',
    });

    expect(mockState.colorizeCalls).toBe(1);

    expect(mockState.errorsCalls).toEqual([
      { stack: true },
    ]);

    expect(mockState.jsonCalls).toBe(1);
    expect(mockState.printfCallbacks).toHaveLength(1);

    expect(mockState.consoleTransports).toHaveLength(1);

    expect(mockState.consoleTransports[0].options.level)
      .toBe('debug');

    expect(mockState.fileTransports).toHaveLength(4);

    expect(
      mockState.fileTransports.map((transport) => transport.options.level)
    ).toEqual([
      'error',
      'info',
      undefined,
      undefined,
    ]);

    expect(mockState.createLoggerCalls).toHaveLength(1);

    expect(mockState.createLoggerCalls[0].options.level)
      .toBe('debug');

    expect(mockState.createLoggerCalls[0].options.transports)
      .toHaveLength(3);

    expect(
      mockState.createLoggerCalls[0].options.exceptionHandlers
    ).toHaveLength(1);

    expect(
      mockState.createLoggerCalls[0].options.rejectionHandlers
    ).toHaveLength(1);

    expect(logger.security).toBeDefined();
  });

  it('no crea el directorio cuando ya existe', async () => {
    const logger = await loadLogger('development', true);

    expect(fsMock.existsSync).toHaveBeenCalled();
    expect(fsMock.mkdirSync).not.toHaveBeenCalled();
    expect(logger).toBeDefined();
  });

  it('ejecuta el formatter de consola con y sin metadatos', async () => {
    await loadLogger('development');

    const formatter = mockState.printfCallbacks[0];

    expect(
      formatter({
        timestamp: '12:34:56',
        level: 'info',
        message: 'Hola',
      })
    ).toBe('12:34:56 [info]: Hola');

    expect(
      formatter({
        timestamp: '12:34:56',
        level: 'warn',
        message: 'Alerta',
        userId: 4,
        ip: '127.0.0.1',
      })
    ).toBe(
      '12:34:56 [warn]: Alerta {"userId":4,"ip":"127.0.0.1"}'
    );
  });

  it('ejecuta todos los helpers de seguridad', async () => {
    const logger = await loadLogger('development');

    logger.security.loginOk(4, '127.0.0.1');
    logger.security.loginFail('a@b.com', '127.0.0.1');
    logger.security.loginBlocked('127.0.0.1', '/login');
    logger.security.sqliDetected(
      '127.0.0.1',
      '/api',
      "' OR 1=1"
    );
    logger.security.xssDetected('127.0.0.1', '/api');
    logger.security.unauthorized(
      '127.0.0.1',
      '/api',
      4
    );
    logger.security.stockLow(7, 2);
    logger.security.passwordReset(4, '127.0.0.1');
    logger.security.logout(4, '127.0.0.1');
    logger.security.rolChanged(1, 4, 'ADMIN');

    expect(loggerMock.info).toHaveBeenNthCalledWith(
      1,
      'LOGIN_OK',
      {
        userId: 4,
        ip: '127.0.0.1',
      }
    );

    expect(loggerMock.warn).toHaveBeenNthCalledWith(
      1,
      'LOGIN_FAILED',
      {
        email: 'a@b.com',
        ip: '127.0.0.1',
      }
    );

    expect(loggerMock.warn).toHaveBeenNthCalledWith(
      2,
      'RATE_LIMIT',
      {
        ip: '127.0.0.1',
        path: '/login',
      }
    );

    expect(loggerMock.warn).toHaveBeenNthCalledWith(
      3,
      'SQLI_DETECTED',
      {
        ip: '127.0.0.1',
        path: '/api',
        value: "' OR 1=1",
      }
    );

    expect(loggerMock.warn).toHaveBeenNthCalledWith(
      4,
      'XSS_ATTEMPT',
      {
        ip: '127.0.0.1',
        path: '/api',
      }
    );

    expect(loggerMock.warn).toHaveBeenNthCalledWith(
      5,
      'UNAUTHORIZED',
      {
        ip: '127.0.0.1',
        path: '/api',
        userId: 4,
      }
    );

    expect(loggerMock.warn).toHaveBeenNthCalledWith(
      6,
      'STOCK_LOW',
      {
        materialId: 7,
        stock: 2,
      }
    );

    expect(loggerMock.info).toHaveBeenNthCalledWith(
      2,
      'PASSWORD_RESET',
      {
        userId: 4,
        ip: '127.0.0.1',
      }
    );

    expect(loggerMock.info).toHaveBeenNthCalledWith(
      3,
      'LOGOUT',
      {
        userId: 4,
        ip: '127.0.0.1',
      }
    );

    expect(loggerMock.info).toHaveBeenNthCalledWith(
      4,
      'ROL_CHANGED',
      {
        adminId: 1,
        targetId: 4,
        newRol: 'ADMIN',
      }
    );
  });

  it('ejecuta los alias directos stockLow, loginFail y accessDenied', async () => {
    const logger = await loadLogger('development');

    logger.stockLow(7, 'Vidrio 6mm', 3, 10);
    logger.stockLow(8, 'Perfil', null, null);
    logger.loginFail(
      'a@b.com',
      '127.0.0.1',
      'credenciales_invalidas'
    );
    logger.accessDenied(
      'VENDEDOR',
      '/api/admin',
      '127.0.0.1'
    );

    expect(loggerMock.warn).toHaveBeenNthCalledWith(
      1,
      'STOCK_LOW',
      {
        event: 'stock.bajo',
        materialId: 7,
        nombre: 'Vidrio 6mm',
        stockActual: 3,
        stockMinimo: 10,
        faltante: 7,
      }
    );

    expect(loggerMock.warn).toHaveBeenNthCalledWith(
      2,
      'STOCK_LOW',
      {
        event: 'stock.bajo',
        materialId: 8,
        nombre: 'Perfil',
        stockActual: null,
        stockMinimo: null,
        faltante: 0,
      }
    );

    expect(loggerMock.warn).toHaveBeenNthCalledWith(
      3,
      'LOGIN_FAILED',
      {
        event: 'auth.login_fail',
        email: 'a@b.com',
        ip: '127.0.0.1',
        razon: 'credenciales_invalidas',
      }
    );

    expect(loggerMock.warn).toHaveBeenNthCalledWith(
      4,
      'ACCESS_DENIED',
      {
        event: 'auth.access_denied',
        rol: 'VENDEDOR',
        path: '/api/admin',
        ip: '127.0.0.1',
      }
    );
  });

  it('configura producción con nivel info y overridea console.*', async () => {
    await loadLogger('production');

    const createLoggerOptions =
      mockState.createLoggerCalls[0].options;

    expect(createLoggerOptions.level).toBe('info');

    expect(mockState.consoleTransports[0].options.level)
      .toBe('info');

    expect(
      mockState.consoleTransports[0].options.format.type
    ).toBe('combine');

    console.log('uno', 2);
    console.info('info', { ok: true });
    console.warn('warn', 3);
    console.error('error', new Error('fallo'));
    console.debug('debug');

    expect(loggerMock.info).toHaveBeenNthCalledWith(
      1,
      'uno 2',
      { source: 'console.log' }
    );

    expect(loggerMock.info).toHaveBeenNthCalledWith(
      2,
      'info [object Object]',
      { source: 'console.info' }
    );

    expect(loggerMock.warn).toHaveBeenCalledWith(
      'warn 3',
      { source: 'console.warn' }
    );

    expect(loggerMock.error).toHaveBeenCalledWith(
      'error Error: fallo',
      { source: 'console.error' }
    );

    expect(loggerMock.debug).not.toHaveBeenCalled();
  });
});
