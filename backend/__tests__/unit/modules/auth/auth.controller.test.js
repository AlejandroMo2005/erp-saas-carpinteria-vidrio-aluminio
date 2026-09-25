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
  login: require.resolve('../../../../src/modules/auth/handlers/login'),
  session: require.resolve('../../../../src/modules/auth/handlers/session'),
  password: require.resolve('../../../../src/modules/auth/handlers/password'),
  profile: require.resolve('../../../../src/modules/auth/handlers/profile'),
  controller: require.resolve('../../../../src/modules/auth/auth.controller'),
};

const mocks = {
  login: {
    login: vi.fn(),
    register: vi.fn(),
  },
  session: {
    refresh: vi.fn(),
    logout: vi.fn(),
  },
  password: {
    forgotPassword: vi.fn(),
    verifyResetCode: vi.fn(),
    resetPassword: vi.fn(),
  },
  profile: {
    getProfile: vi.fn(),
  },
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

beforeEach(() => {
  vi.clearAllMocks();

  Object.values(mocks).forEach(group => {
    Object.values(group).forEach(mock => mock.mockReset());
  });

  inject(paths.login, mocks.login);
  inject(paths.session, mocks.session);
  inject(paths.password, mocks.password);
  inject(paths.profile, mocks.profile);

  clearModule(paths.controller);
});

afterEach(() => {
  clearModule(paths.controller);
});

describe('auth.controller - barrel del módulo', () => {
  it('reexporta todos los handlers de autenticación', () => {
    const controller = require(paths.controller);

    expect(controller).toEqual({
      login: mocks.login.login,
      register: mocks.login.register,
      refresh: mocks.session.refresh,
      logout: mocks.session.logout,
      forgotPassword: mocks.password.forgotPassword,
      verifyResetCode: mocks.password.verifyResetCode,
      resetPassword: mocks.password.resetPassword,
      getProfile: mocks.profile.getProfile,
    });
  });

  it('expone exactamente las ocho operaciones esperadas', () => {
    const controller = require(paths.controller);

    expect(Object.keys(controller).sort()).toEqual([
      'forgotPassword',
      'getProfile',
      'login',
      'logout',
      'refresh',
      'register',
      'resetPassword',
      'verifyResetCode',
    ]);
  });
});
