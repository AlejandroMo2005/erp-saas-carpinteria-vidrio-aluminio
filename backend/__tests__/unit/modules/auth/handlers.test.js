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
  usuario: require.resolve('../../../../src/modules/usuario/usuario.repository'),
  db: require.resolve('../../../../config/database'),
  logger: require.resolve('../../../../utils/logger'),
  audit: require.resolve('../../../../src/shared/middleware/auditLog'),
  security: require.resolve('../../../../src/shared/middleware/security'),
  authService: require.resolve('../../../../src/modules/auth/auth.service'),
  email: require.resolve('../../../../src/shared/services/emailService'),
  login: require.resolve('../../../../src/modules/auth/handlers/login'),
  password: require.resolve('../../../../src/modules/auth/handlers/password'),
  profile: require.resolve('../../../../src/modules/auth/handlers/profile'),
  session: require.resolve('../../../../src/modules/auth/handlers/session'),
};

const usuario = {
  id: 7,
  nombre: 'Juan Pérez',
  email: 'juan@test.com',
  password: 'hash',
  rol: 'CLIENTE',
  activo: 1,
};

const dbMock = {
  query: vi.fn(),
};

const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  loginFail: vi.fn(),
  accessDenied: vi.fn(),
};

const auditMock = {
  registrarAuditoria: vi.fn().mockResolvedValue(undefined),
};

const securityMock = {
  timingSafeEqual: vi.fn((a, b) => a === b),
};

const authMock = {
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 604800000,
  },
  COOKIE_CLEAR_OPTIONS: {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
  },
  generateAccessToken: vi.fn(() => ({
    token: 'access-token',
    jti: 'jti-123',
  })),
  generateRefreshToken: vi.fn(() => ({
    token: 'refresh-token',
    tokenHash: 'refresh-hash',
  })),
  getIp: vi.fn(() => '127.0.0.1'),
  crearSesion: vi.fn().mockResolvedValue(undefined),
  addToBlacklist: vi.fn().mockResolvedValue(undefined),
  actualizarActividad: vi.fn(),
};

const usuarioMock = {
  getByEmail: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  validatePassword: vi.fn(),
  updatePassword: vi.fn(),
};

const emailMock = {
  sendResetCode: vi.fn().mockResolvedValue(undefined),
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

function resetMocks() {
  vi.clearAllMocks();

  dbMock.query.mockReset();
  loggerMock.info.mockReset();
  loggerMock.warn.mockReset();
  loggerMock.error.mockReset();
  loggerMock.debug.mockReset();
  loggerMock.loginFail.mockReset();
  loggerMock.accessDenied.mockReset();

  auditMock.registrarAuditoria.mockReset();
  auditMock.registrarAuditoria.mockResolvedValue(undefined);

  securityMock.timingSafeEqual.mockReset();
  securityMock.timingSafeEqual.mockImplementation((a, b) => a === b);

  authMock.generateAccessToken.mockReset();
  authMock.generateAccessToken.mockReturnValue({
    token: 'access-token',
    jti: 'jti-123',
  });

  authMock.generateRefreshToken.mockReset();
  authMock.generateRefreshToken.mockReturnValue({
    token: 'refresh-token',
    tokenHash: 'refresh-hash',
  });

  authMock.getIp.mockReset();
  authMock.getIp.mockReturnValue('127.0.0.1');

  authMock.crearSesion.mockReset();
  authMock.crearSesion.mockResolvedValue(undefined);

  authMock.addToBlacklist.mockReset();
  authMock.addToBlacklist.mockResolvedValue(undefined);

  authMock.actualizarActividad.mockReset();

  usuarioMock.getByEmail.mockReset();
  usuarioMock.getById.mockReset();
  usuarioMock.create.mockReset();
  usuarioMock.validatePassword.mockReset();
  usuarioMock.updatePassword.mockReset();

  emailMock.sendResetCode.mockReset();
  emailMock.sendResetCode.mockResolvedValue(undefined);

  process.env.JWT_EXPIRE = '15m';
  process.env.RESET_CODE_EXPIRATION = '5';
  process.env.NODE_ENV = 'test';

  inject(paths.usuario, usuarioMock);
  inject(paths.db, dbMock);
  inject(paths.logger, loggerMock);
  inject(paths.audit, auditMock);
  inject(paths.security, securityMock);
  inject(paths.authService, authMock);
  inject(paths.email, emailMock);

  [
    paths.login,
    paths.password,
    paths.profile,
    paths.session,
  ].forEach(clearModule);
}

function loadHandlers() {
  const loginModule = require(paths.login);

  return {
    login: loginModule.login,
    register: loginModule.register,
    password: require(paths.password),
    profile: require(paths.profile),
    session: require(paths.session),
  };
}

function makeReq(overrides = {}) {
  return {
    body: {},
    cookies: {},
    headers: {
      'user-agent': 'Vitest Agent',
    },
    params: {},
    ip: '127.0.0.1',
    user: {
      id: 7,
      nombre: 'Juan Pérez',
      email: 'juan@test.com',
    },
    ...overrides,
  };
}

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  [
    paths.login,
    paths.password,
    paths.profile,
    paths.session,
  ].forEach(clearModule);
});

describe('auth handlers - login', () => {
  it('rechaza login sin email o contraseña', async () => {
    const { login } = loadHandlers();
    const res = makeRes();

    await login(makeReq({ body: { email: 'a@test.com' } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Email y contraseña son obligatorios',
    });
    expect(usuarioMock.getByEmail).not.toHaveBeenCalled();
  });

  it('rechaza usuario inexistente', async () => {
    const { login } = loadHandlers();
    const res = makeRes();

    usuarioMock.getByEmail.mockResolvedValue(null);

    await login(
      makeReq({ body: { email: 'no@test.com', password: '123456' } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Credenciales inválidas',
    });
    expect(loggerMock.loginFail).toHaveBeenCalledWith(
      'no@test.com',
      '127.0.0.1',
      'usuario_no_encontrado',
    );
    expect(auditMock.registrarAuditoria).toHaveBeenCalled();
  });

  it('rechaza usuario desactivado', async () => {
    const { login } = loadHandlers();
    const res = makeRes();

    usuarioMock.getByEmail.mockResolvedValue({
      ...usuario,
      activo: 0,
    });

    await login(
      makeReq({ body: { email: usuario.email, password: '123456' } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Credenciales inválidas',
    });
    expect(loggerMock.loginFail).toHaveBeenCalledWith(
      usuario.email,
      '127.0.0.1',
      'usuario_desactivado',
    );
  });

  it('rechaza contraseña incorrecta', async () => {
    const { login } = loadHandlers();
    const res = makeRes();

    usuarioMock.getByEmail.mockResolvedValue(usuario);
    usuarioMock.validatePassword.mockResolvedValue(false);

    await login(
      makeReq({ body: { email: usuario.email, password: 'incorrecta' } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Credenciales inválidas',
    });
    expect(loggerMock.loginFail).toHaveBeenCalledWith(
      usuario.email,
      '127.0.0.1',
      'password_incorrecto',
    );
  });

  it('realiza login exitoso y elimina password de la respuesta', async () => {
    const { login } = loadHandlers();
    const res = makeRes();

    const usuarioLogin = { ...usuario };

    usuarioMock.getByEmail.mockResolvedValue(usuarioLogin);
    usuarioMock.validatePassword.mockResolvedValue(true);

    dbMock.query
      .mockResolvedValueOnce([[{ empresa_id: 12 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await login(
      makeReq({ body: { email: usuario.email, password: 'correcta' } }),
      res,
    );

    expect(authMock.generateAccessToken).toHaveBeenCalledWith(
      usuario.id,
      usuario.rol,
      12,
    );
    expect(authMock.generateRefreshToken).toHaveBeenCalled();
    expect(authMock.crearSesion).toHaveBeenCalledWith(
      usuario.id,
      'refresh-hash',
      expect.any(Object),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      authMock.COOKIE_OPTIONS,
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Login exitoso',
      data: {
        user: expect.objectContaining({
          id: usuario.id,
          email: usuario.email,
        }),
        accessToken: 'access-token',
        expiresIn: '15m',
      },
    });

    expect(usuarioLogin.password).toBeUndefined();
    expect(loggerMock.info).toHaveBeenCalledWith(
      'LOGIN_SUCCESS',
      expect.objectContaining({
        event: 'auth.login',
        userId: 7,
        empresaId: 12,
      }),
    );
  });

  it('usa 15m por defecto cuando JWT_EXPIRE no está definido en login', async () => {
    const { login } = loadHandlers();
    const res = makeRes();

    delete process.env.JWT_EXPIRE;

    const usuarioLogin = { ...usuario };

    usuarioMock.getByEmail.mockResolvedValue(usuarioLogin);
    usuarioMock.validatePassword.mockResolvedValue(true);

    dbMock.query
      .mockResolvedValueOnce([[{ empresa_id: 12 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await login(
      makeReq({ body: { email: usuario.email, password: 'correcta' } }),
      res,
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Login exitoso',
      data: expect.objectContaining({
        expiresIn: '15m',
      }),
    });
  });

  it('usa empresa_id null cuando la consulta no devuelve empresa', async () => {
    const { login } = loadHandlers();
    const res = makeRes();

    const usuarioLogin = { ...usuario };
    usuarioMock.getByEmail.mockResolvedValue(usuarioLogin);
    usuarioMock.validatePassword.mockResolvedValue(true);

    dbMock.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await login(
      makeReq({ body: { email: usuario.email, password: 'correcta' } }),
      res,
    );

    expect(authMock.generateAccessToken).toHaveBeenCalledWith(
      7,
      'CLIENTE',
      null,
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('maneja error durante login', async () => {
    const { login } = loadHandlers();
    const res = makeRes();

    usuarioMock.getByEmail.mockRejectedValue(new Error('DB error'));

    await login(
      makeReq({ body: { email: usuario.email, password: '123456' } }),
      res,
    );

    expect(loggerMock.error).toHaveBeenCalledWith(
      'LOGIN_ERROR',
      expect.objectContaining({
        event: 'auth.login_error',
        message: 'DB error',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('auth handlers - register', () => {
  it('rechaza datos incompletos', async () => {
    const { register } = loadHandlers();
    const res = makeRes();

    await register(
      makeReq({ body: { nombre: 'Juan', email: 'juan@test.com' } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Nombre, email y contraseña son obligatorios',
    });
  });

  it('rechaza contraseña menor de seis caracteres', async () => {
    const { register } = loadHandlers();
    const res = makeRes();

    await register(
      makeReq({
        body: {
          nombre: 'Juan',
          email: 'juan@test.com',
          password: '12345',
        },
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres',
    });
  });

  it('usa 15m por defecto cuando JWT_EXPIRE no está definido en register', async () => {
    const { register } = loadHandlers();
    const res = makeRes();

    delete process.env.JWT_EXPIRE;

    usuarioMock.getByEmail.mockResolvedValue(null);
    usuarioMock.create.mockResolvedValue(15);
    usuarioMock.getById.mockResolvedValue({
      id: 15,
      nombre: 'Juan',
      email: 'juan@test.com',
      rol: 'CLIENTE',
    });

    dbMock.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await register(
      makeReq({
        body: {
          nombre: 'Juan',
          email: 'juan@test.com',
          password: '123456',
        },
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: expect.objectContaining({
        expiresIn: '15m',
      }),
    });
  });

  it('rechaza email ya registrado', async () => {
    const { register } = loadHandlers();
    const res = makeRes();

    usuarioMock.getByEmail.mockResolvedValue(usuario);

    await register(
      makeReq({
        body: {
          nombre: 'Juan',
          email: usuario.email,
          password: '123456',
        },
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'El email ya está registrado',
    });
  });

  it('registra usuario exitosamente', async () => {
    const { register } = loadHandlers();
    const res = makeRes();

    const nuevoUsuario = {
      id: 20,
      nombre: 'Nuevo',
      email: 'nuevo@test.com',
      rol: 'CLIENTE',
      activo: 1,
      empresa_id: 1,
    };

    usuarioMock.getByEmail.mockResolvedValue(null);
    usuarioMock.create.mockResolvedValue(20);
    usuarioMock.getById.mockResolvedValue(nuevoUsuario);

    dbMock.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await register(
      makeReq({
        body: {
          nombre: 'Nuevo',
          email: 'nuevo@test.com',
          password: '123456',
        },
      }),
      res,
    );

    expect(usuarioMock.create).toHaveBeenCalledWith({
      nombre: 'Nuevo',
      email: 'nuevo@test.com',
      password: '123456',
      rol: 'CLIENTE',
      activo: 1,
      empresa_id: 1,
    });

    expect(authMock.generateAccessToken).toHaveBeenCalledWith(
      20,
      'CLIENTE',
      1,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      authMock.COOKIE_OPTIONS,
    );
  });

  it('maneja error durante registro', async () => {
    const { register } = loadHandlers();
    const res = makeRes();

    usuarioMock.getByEmail.mockRejectedValue(new Error('DB register error'));

    await register(
      makeReq({
        body: {
          nombre: 'Nuevo',
          email: 'nuevo@test.com',
          password: '123456',
        },
      }),
      res,
    );

    expect(loggerMock.error).toHaveBeenCalledWith(
      'REGISTER_ERROR',
      expect.objectContaining({
        event: 'auth.register_error',
        message: 'DB register error',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('auth handlers - password', () => {
  it('forgotPassword exige email', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    await password.forgotPassword(makeReq({ body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Email requerido',
    });
  });

  it('forgotPassword no revela si el usuario existe', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    usuarioMock.getByEmail.mockResolvedValue(null);

    await password.forgotPassword(
      makeReq({ body: { email: 'no@test.com' } }),
      res,
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Si el correo existe, recibirás un código de recuperación',
    });
  });

  it('forgotPassword crea recuperación y envía código', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    usuarioMock.getByEmail.mockResolvedValue(usuario);
    dbMock.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await password.forgotPassword(
      makeReq({ body: { email: usuario.email } }),
      res,
    );

    expect(dbMock.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO password_resets'),
      expect.arrayContaining([7]),
    );
    expect(emailMock.sendResetCode).toHaveBeenCalledWith(
      usuario.email,
      expect.stringMatching(/^\d{6}$/),
      usuario.nombre,
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Si el correo existe, recibirás un código de recuperación',
      token: expect.any(String),
    });
  });

  it('forgotPassword continúa aunque falle el servicio de correo', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    usuarioMock.getByEmail.mockResolvedValue(usuario);
    dbMock.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    emailMock.sendResetCode.mockRejectedValue(new Error('SMTP error'));

    await password.forgotPassword(
      makeReq({ body: { email: usuario.email } }),
      res,
    );

    expect(loggerMock.error).toHaveBeenCalledWith(
      'RESET_CODE_EMAIL_FAIL',
      expect.objectContaining({
        event: 'auth.reset_email_fail',
        message: 'SMTP error',
      }),
    );
    expect(loggerMock.debug).toHaveBeenCalledWith(
      'RESET_CODE_DEV_FALLBACK',
      expect.objectContaining({
        code: expect.stringMatching(/^\d{6}$/),
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        token: expect.any(String),
      }),
    );
  });

  it('forgotPassword no ejecuta fallback de desarrollo en producción', async () => {
    const { password } = loadHandlers();
    const res = makeRes();
    const previousNodeEnv = process.env.NODE_ENV;

    try {
      process.env.NODE_ENV = 'production';

      usuarioMock.getByEmail.mockResolvedValue(usuario);
      dbMock.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      emailMock.sendResetCode.mockRejectedValue(new Error('SMTP error'));

      await password.forgotPassword(
        makeReq({ body: { email: usuario.email } }),
        res,
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
        }),
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        'RESET_CODE_EMAIL_FAIL',
        expect.objectContaining({
          event: 'auth.reset_email_fail',
          message: 'SMTP error',
        }),
      );
      expect(loggerMock.debug).not.toHaveBeenCalledWith(
        'RESET_CODE_DEV_FALLBACK',
        expect.anything(),
      );
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it('forgotPassword maneja error general', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    usuarioMock.getByEmail.mockRejectedValue(new Error('Forgot DB error'));

    await password.forgotPassword(
      makeReq({ body: { email: usuario.email } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(loggerMock.error).toHaveBeenCalledWith(
      'FORGOT_PASSWORD_ERROR',
      expect.objectContaining({
        message: 'Forgot DB error',
      }),
    );
  });

  it('verifyResetCode exige token y código', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    await password.verifyResetCode(
      makeReq({ body: { token: 'abc' } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token y código requeridos',
    });
  });

  it('verifyResetCode rechaza código inválido o expirado', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    dbMock.query.mockResolvedValueOnce([[]]);

    await password.verifyResetCode(
      makeReq({ body: { token: 'abc', code: '123456' } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Código inválido o expirado',
    });
  });

  it('verifyResetCode acepta código correcto', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    dbMock.query.mockResolvedValueOnce([[
      {
        code: '123456',
        email: usuario.email,
        nombre: usuario.nombre,
      },
    ]]);
    securityMock.timingSafeEqual.mockReturnValue(true);

    await password.verifyResetCode(
      makeReq({ body: { token: 'abc', code: '123456' } }),
      res,
    );

    expect(securityMock.timingSafeEqual).toHaveBeenCalledWith(
      '123456',
      '123456',
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Código verificado correctamente',
    });
  });

  it('verifyResetCode maneja error de BD', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    dbMock.query.mockRejectedValue(new Error('Verify DB error'));

    await password.verifyResetCode(
      makeReq({ body: { token: 'abc', code: '123456' } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(loggerMock.error).toHaveBeenCalledWith(
      'VERIFY_CODE_ERROR',
      expect.objectContaining({
        message: 'Verify DB error',
      }),
    );
  });

  it('resetPassword exige todos los datos', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    await password.resetPassword(
      makeReq({ body: { token: 'abc', code: '123456' } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Datos incompletos',
    });
  });

  it('resetPassword rechaza contraseña corta', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    await password.resetPassword(
      makeReq({
        body: {
          token: 'abc',
          code: '123456',
          newPassword: '12345',
        },
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres',
    });
  });

  it('resetPassword rechaza código inválido', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    dbMock.query.mockResolvedValueOnce([[]]);

    await password.resetPassword(
      makeReq({
        body: {
          token: 'abc',
          code: '123456',
          newPassword: 'nueva123',
        },
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Código inválido o expirado',
    });
  });

  it('resetPassword actualiza contraseña y revoca sesiones', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[
        {
          id: 99,
          user_id: 7,
          token_id: 'old-jti',
          code: '123456',
        },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    securityMock.timingSafeEqual.mockReturnValue(true);

    await password.resetPassword(
      makeReq({
        body: {
          token: 'abc',
          code: '123456',
          newPassword: 'nueva123',
        },
      }),
      res,
    );

    expect(authMock.addToBlacklist).toHaveBeenCalledWith('old-jti');
    expect(usuarioMock.updatePassword).toHaveBeenCalledWith(7, 'nueva123');
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      authMock.COOKIE_CLEAR_OPTIONS,
    );
    expect(auditMock.registrarAuditoria).toHaveBeenCalledWith(
      expect.any(Object),
      'CAMBIO_PASSWORD',
      'usuarios',
      7,
      { motivo: 'reset_via_codigo' },
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  });

  it('resetPassword funciona cuando no existe token_id', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[
        {
          id: 100,
          user_id: 8,
          token_id: null,
          code: '123456',
        },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    securityMock.timingSafeEqual.mockReturnValue(true);

    await password.resetPassword(
      makeReq({
        body: {
          token: 'abc',
          code: '123456',
          newPassword: 'nueva123',
        },
      }),
      res,
    );

    expect(authMock.addToBlacklist).not.toHaveBeenCalled();
    expect(usuarioMock.updatePassword).toHaveBeenCalledWith(8, 'nueva123');
    expect(res.json).toHaveBeenCalled();
  });

  it('resetPassword maneja error general', async () => {
    const { password } = loadHandlers();
    const res = makeRes();

    dbMock.query.mockRejectedValue(new Error('Reset DB error'));

    await password.resetPassword(
      makeReq({
        body: {
          token: 'abc',
          code: '123456',
          newPassword: 'nueva123',
        },
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(loggerMock.error).toHaveBeenCalledWith(
      'RESET_PASSWORD_ERROR',
      expect.objectContaining({
        message: 'Reset DB error',
      }),
    );
  });
});

describe('auth handlers - profile', () => {
  it('devuelve 404 si el usuario no existe', async () => {
    const { profile } = loadHandlers();
    const res = makeRes();

    usuarioMock.getById.mockResolvedValue(null);

    await profile.getProfile(makeReq(), res);

    expect(usuarioMock.getById).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Usuario no encontrado',
    });
  });

  it('devuelve el perfil y actualiza actividad', async () => {
    const { profile } = loadHandlers();
    const res = makeRes();

    const perfil = {
      id: 7,
      nombre: 'Juan Pérez',
      email: 'juan@test.com',
      rol: 'CLIENTE',
    };

    usuarioMock.getById.mockResolvedValue(perfil);

    await profile.getProfile(makeReq(), res);

    expect(authMock.actualizarActividad).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: perfil,
    });
  });

  it('maneja error al obtener perfil', async () => {
    const { profile } = loadHandlers();
    const res = makeRes();

    usuarioMock.getById.mockRejectedValue(new Error('Profile DB error'));

    await profile.getProfile(makeReq(), res);

    expect(loggerMock.error).toHaveBeenCalledWith(
      'PROFILE_ERROR',
      expect.objectContaining({
        event: 'auth.profile_error',
        message: 'Profile DB error',
        userId: 7,
      }),
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('auth handlers - refresh', () => {
  it('rechaza refresh sin cookie', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    await session.refresh(makeReq({ cookies: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Refresh token requerido',
      expired: true,
    });
  });

  it('rechaza refresh token inválido', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    dbMock.query.mockResolvedValueOnce([[]]);

    await session.refresh(
      makeReq({ cookies: { refreshToken: 'invalid-token' } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Refresh token inválido o expirado',
      expired: true,
    });
    expect(loggerMock.warn).toHaveBeenCalledWith(
      'REFRESH_TOKEN_INVALID',
      expect.objectContaining({
        event: 'auth.refresh_invalid',
      }),
    );
  });

  it('rechaza usuario desactivado durante refresh', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    dbMock.query.mockResolvedValueOnce([[
      {
        id: 1,
        usuario_id: 7,
        rol: 'CLIENTE',
        activo: 0,
        token_id: 'old-jti',
        empresa_id: 1,
      },
    ]]);
    dbMock.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await session.refresh(
      makeReq({ cookies: { refreshToken: 'refresh-old' } }),
      res,
    );

    expect(authMock.addToBlacklist).toHaveBeenCalledWith('old-jti');
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      authMock.COOKIE_CLEAR_OPTIONS,
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Usuario desactivado',
    });
  });

  it('renueva sesión correctamente', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[
        {
          id: 5,
          usuario_id: 7,
          rol: 'CLIENTE',
          activo: 1,
          token_id: 'old-jti',
          empresa_id: 3,
        },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await session.refresh(
      makeReq({ cookies: { refreshToken: 'refresh-old' } }),
      res,
    );

    expect(authMock.addToBlacklist).toHaveBeenCalledWith('old-jti');
    expect(authMock.generateAccessToken).toHaveBeenCalledWith(
      7,
      'CLIENTE',
      3,
    );
    expect(authMock.crearSesion).toHaveBeenCalledWith(
      7,
      'refresh-hash',
      expect.any(Object),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      authMock.COOKIE_OPTIONS,
    );
    expect(auditMock.registrarAuditoria).toHaveBeenCalledWith(
      expect.any(Object),
      'REFRESH_TOKEN',
      'usuarios_sesiones',
      7,
      {},
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      accessToken: 'access-token',
      expiresIn: '15m',
    });
  });

  it('renueva la sesión sin poner en blacklist cuando la sesión anterior no tiene token_id', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[
        {
          id: 20,
          usuario_id: 7,
          rol: 'ADMIN',
          activo: 1,
          token_id: null,
          empresa_id: 12,
        },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await session.refresh(
      makeReq({ cookies: { refreshToken: 'refresh-token-original' } }),
      res,
    );

    expect(authMock.addToBlacklist).not.toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      accessToken: 'access-token',
      expiresIn: '15m',
    });
  });

  it('usa 15m por defecto cuando JWT_EXPIRE no está definido en refresh', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    delete process.env.JWT_EXPIRE;

    dbMock.query
      .mockResolvedValueOnce([[
        {
          id: 20,
          usuario_id: 7,
          rol: 'ADMIN',
          activo: 1,
          token_id: null,
          empresa_id: 12,
        },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await session.refresh(
      makeReq({ cookies: { refreshToken: 'refresh-token-original' } }),
      res,
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      accessToken: 'access-token',
      expiresIn: '15m',
    });
  });

  it('maneja error durante refresh', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    dbMock.query.mockRejectedValue(new Error('Refresh DB error'));

    await session.refresh(
      makeReq({ cookies: { refreshToken: 'refresh-old' } }),
      res,
    );

    expect(loggerMock.error).toHaveBeenCalledWith(
      'REFRESH_ERROR',
      expect.objectContaining({
        event: 'auth.refresh_error',
        message: 'Refresh DB error',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('auth handlers - logout', () => {
  it('cierra sesión usando refresh token válido', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[
        {
          usuario_id: 7,
          token_id: 'jti-logout',
        },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await session.logout(
      makeReq({ cookies: { refreshToken: 'refresh-old' } }),
      res,
    );

    expect(authMock.addToBlacklist).toHaveBeenCalledWith('jti-logout');
    expect(auditMock.registrarAuditoria).toHaveBeenCalledWith(
      expect.any(Object),
      'LOGOUT',
      'usuarios',
      7,
      {},
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      'LOGOUT',
      expect.objectContaining({
        event: 'auth.logout',
        userId: 7,
      }),
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      authMock.COOKIE_CLEAR_OPTIONS,
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
  });

  it('elimina cookie aunque el refresh token no tenga sesión', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    await session.logout(
      makeReq({ cookies: { refreshToken: 'refresh-old' } }),
      res,
    );

    expect(authMock.addToBlacklist).not.toHaveBeenCalled();
    expect(auditMock.registrarAuditoria).toHaveBeenCalledWith(
      expect.anything(),
      'LOGOUT',
      'usuarios',
      7,
      {},
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      authMock.COOKIE_CLEAR_OPTIONS,
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
  });

  it('cierra sesión por usuario cuando no hay refresh token', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[{ token_id: 'user-jti' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await session.logout(
      makeReq({
        cookies: {},
        user: {
          id: 7,
          nombre: 'Juan Pérez',
          email: 'juan@test.com',
        },
      }),
      res,
    );

    expect(authMock.addToBlacklist).toHaveBeenCalledWith('user-jti');
    expect(auditMock.registrarAuditoria).toHaveBeenCalledWith(
      expect.any(Object),
      'LOGOUT',
      'usuarios',
      7,
      {},
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('cierra sesión por usuario aunque no tenga token_id', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    dbMock.query
      .mockResolvedValueOnce([[{ token_id: null }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await session.logout(
      makeReq({
        cookies: {},
        user: { id: 7 },
      }),
      res,
    );

    expect(authMock.addToBlacklist).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
  });

  it('maneja logout sin cookie ni usuario autenticado', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    await session.logout(
      makeReq({
        cookies: {},
        user: undefined,
      }),
      res,
    );

    expect(dbMock.query).not.toHaveBeenCalled();
    expect(auditMock.registrarAuditoria).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      authMock.COOKIE_CLEAR_OPTIONS,
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
  });

  it('maneja error durante logout', async () => {
    const { session } = loadHandlers();
    const res = makeRes();

    dbMock.query.mockRejectedValue(new Error('Logout DB error'));

    await session.logout(
      makeReq({
        cookies: { refreshToken: 'refresh-old' },
      }),
      res,
    );

    expect(loggerMock.error).toHaveBeenCalledWith(
      'LOGOUT_ERROR',
      expect.objectContaining({
        event: 'auth.logout_error',
        message: 'Logout DB error',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
