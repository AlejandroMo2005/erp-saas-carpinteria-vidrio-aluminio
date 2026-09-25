import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const paths = {
  express: require.resolve('express'),
  controller: require.resolve('../../../../src/modules/auth/auth.controller'),
  auth: require.resolve('../../../../src/shared/middleware/auth'),
  security: require.resolve('../../../../src/shared/middleware/security'),
  validate: require.resolve('../../../../src/shared/middleware/validateZod'),
  validators: require.resolve('../../../../src/shared/validators/auth.validators'),
  routes: require.resolve('../../../../src/modules/auth/auth.routes'),
};

const controllerMock = {
  login: vi.fn(),
  register: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
  verifyResetCode: vi.fn(),
  resetPassword: vi.fn(),
  getProfile: vi.fn(),
};

const protectMock = vi.fn((req, res, next) => next());
const authLimiterMock = vi.fn((req, res, next) => next());
const timingNormalizeMock = vi.fn(() => (req, res, next) => next());

const validateBodyMock = vi.fn(_schema => {
  return (req, res, next) => next();
});

const schemasMock = {
  loginSchema: { name: 'loginSchema' },
  registerSchema: { name: 'registerSchema' },
  forgotPasswordSchema: { name: 'forgotPasswordSchema' },
  verifyCodeSchema: { name: 'verifyCodeSchema' },
  resetPasswordSchema: { name: 'resetPasswordSchema' },
};

function inject(path, value) {
  require.cache[path] = {
    id: path,
    filename: path,
    loaded: true,
    exports: value,
  };
}

function clearModule(path) {
  delete require.cache[path];
}

function getRoutes(router) {
  return router.stack
    .filter(layer => layer.route)
    .map(layer => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods),
      handlers: layer.route.stack.map(item => item.handle),
    }));
}

beforeEach(() => {
  vi.clearAllMocks();

  Object.values(controllerMock).forEach(mock => mock.mockReset());

  protectMock.mockClear();
  authLimiterMock.mockClear();
  timingNormalizeMock.mockClear();
  validateBodyMock.mockClear();

  inject(paths.controller, controllerMock);
  inject(paths.auth, { protect: protectMock });
  inject(paths.security, {
    authLimiter: authLimiterMock,
    timingNormalize: timingNormalizeMock,
  });
  inject(paths.validate, {
    validateBody: validateBodyMock,
  });
  inject(paths.validators, schemasMock);

  clearModule(paths.routes);
});

afterEach(() => {
  clearModule(paths.routes);
});

describe('auth.routes', () => {
  it('registra las ocho rutas del módulo auth', () => {
    const router = require(paths.routes);
    const routes = getRoutes(router);

    expect(routes.map(route => `${route.methods[0].toUpperCase()} ${route.path}`)).toEqual([
      'GET /',
      'POST /login',
      'POST /register',
      'POST /refresh',
      'POST /logout',
      'POST /forgot-password',
      'POST /verify-code',
      'POST /reset-password',
      'GET /profile',
    ]);
  });

  it('aplica authLimiter como middleware global del router', () => {
    const router = require(paths.routes);

    expect(router.stack[0].handle).toBe(authLimiterMock);
  });

  it('configura login con timingNormalize, validación y controller', () => {
    const router = require(paths.routes);
    const route = router.stack.find(layer => layer.route?.path === '/login').route;

    expect(timingNormalizeMock).toHaveBeenCalledWith(300);
    expect(validateBodyMock).toHaveBeenCalledWith(schemasMock.loginSchema);
    expect(route.stack.at(-1).handle).toBe(controllerMock.login);
  });

  it('configura register con validación y controller', () => {
    const router = require(paths.routes);
    const route = router.stack.find(layer => layer.route?.path === '/register').route;

    expect(validateBodyMock).toHaveBeenCalledWith(schemasMock.registerSchema);
    expect(route.stack.at(-1).handle).toBe(controllerMock.register);
  });

  it('configura refresh sin validación de body', () => {
    const router = require(paths.routes);
    const route = router.stack.find(layer => layer.route?.path === '/refresh').route;

    expect(route.stack.at(-1).handle).toBe(controllerMock.refresh);
  });

  it('protege logout con middleware protect', () => {
    const router = require(paths.routes);
    const route = router.stack.find(layer => layer.route?.path === '/logout').route;

    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(protectMock);
    expect(route.stack[1].handle).toBe(controllerMock.logout);
  });

  it('configura forgot-password con timingNormalize y validación', () => {
    const router = require(paths.routes);
    const route = router.stack.find(layer => layer.route?.path === '/forgot-password').route;

    expect(timingNormalizeMock).toHaveBeenCalledWith(300);
    expect(validateBodyMock).toHaveBeenCalledWith(schemasMock.forgotPasswordSchema);
    expect(route.stack.at(-1).handle).toBe(controllerMock.forgotPassword);
  });

  it('configura verify-code con validación', () => {
    const router = require(paths.routes);
    const route = router.stack.find(layer => layer.route?.path === '/verify-code').route;

    expect(validateBodyMock).toHaveBeenCalledWith(schemasMock.verifyCodeSchema);
    expect(route.stack.at(-1).handle).toBe(controllerMock.verifyResetCode);
  });

  it('configura reset-password con validación', () => {
    const router = require(paths.routes);
    const route = router.stack.find(layer => layer.route?.path === '/reset-password').route;

    expect(validateBodyMock).toHaveBeenCalledWith(schemasMock.resetPasswordSchema);
    expect(route.stack.at(-1).handle).toBe(controllerMock.resetPassword);
  });

  it('protege profile con middleware protect', () => {
    const router = require(paths.routes);
    const route = router.stack.find(layer => layer.route?.path === '/profile').route;

    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(protectMock);
    expect(route.stack[1].handle).toBe(controllerMock.getProfile);
  });

  it('mantiene el endpoint GET de información del módulo', () => {
    const router = require(paths.routes);
    const route = router.stack.find(layer => layer.route?.path === '/').route;

    const res = {
      json: vi.fn(),
    };

    route.stack[0].handle({}, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Auth module activo',
      endpoints: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        forgotPassword: 'POST /api/auth/forgot-password',
        verifyCode: 'POST /api/auth/verify-code',
        resetPassword: 'POST /api/auth/reset-password',
        profile: 'GET  /api/auth/profile',
      },
    });
  });
});
