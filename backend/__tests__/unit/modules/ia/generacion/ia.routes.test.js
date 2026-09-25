import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const controllerPath = require.resolve(
  process.cwd() + '/src/modules/ia/generacion/ia.controller.js'
);

const authPath = require.resolve(
  process.cwd() + '/src/shared/middleware/auth.js'
);

const validatePath = require.resolve(
  process.cwd() + '/src/shared/middleware/validateZod.js'
);

const validatorsPath = require.resolve(
  process.cwd() + '/src/shared/validators/ia.validators.js'
);

const multerPath = require.resolve('multer');

const routesPath = require.resolve(
  process.cwd() + '/src/modules/ia/generacion/ia.routes.js'
);

const controllerMock = {
  inpaint: vi.fn(),
  getTrabajoConColores: vi.fn(),
  visualizarEspacio: vi.fn(),
  mascaraAuto: vi.fn(),
};

const protectMock = vi.fn();

const validateBodyMock = vi.fn(schema => {
  const middleware = vi.fn((_req, _res, next) => next());
  middleware.schema = schema;
  return middleware;
});

const inpaintSchemaMock = {
  name: 'inpaintSchema',
};

const visualizarSchemaMock = {
  name: 'visualizarSchema',
};

const uploadMock = {
  fields: vi.fn(() => vi.fn()),
};

const multerMock = vi.fn(() => uploadMock);

multerMock.memoryStorage = vi.fn(() => ({
  type: 'memory',
}));

function inject(path, value) {
  require.cache[path] = {
    id: path,
    filename: path,
    loaded: true,
    exports: value,
  };
}

function clear(path) {
  delete require.cache[path];
}

function loadRoutes() {
  inject(controllerPath, controllerMock);
  inject(authPath, { protect: protectMock });
  inject(validatePath, { validateBody: validateBodyMock });
  inject(validatorsPath, {
    inpaintSchema: inpaintSchemaMock,
    visualizarSchema: visualizarSchemaMock,
  });
  inject(multerPath, multerMock);

  clear(routesPath);

  return require(routesPath);
}

function loadRoutesWithoutAuth() {
  inject(controllerPath, controllerMock);

  const authFailure = {};

  Object.defineProperty(authFailure, 'protect', {
    get() {
      throw new Error('auth unavailable');
    },
  });

  inject(authPath, authFailure);
  inject(validatePath, { validateBody: validateBodyMock });
  inject(validatorsPath, {
    inpaintSchema: inpaintSchemaMock,
    visualizarSchema: visualizarSchemaMock,
  });
  inject(multerPath, multerMock);

  clear(routesPath);

  return require(routesPath);
}

function getRoute(router, method, path) {
  return router.stack.find(
    layer => layer.route?.path === path && layer.route?.methods?.[method]
  );
}

function getDiagnosticMiddleware(router) {
  return router.stack.find(layer => !layer.route).handle;
}

describe('ia.routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    multerMock.mockClear();
    multerMock.memoryStorage.mockClear();

    uploadMock.fields.mockClear();

    protectMock.mockClear();
    validateBodyMock.mockClear();
  });

  it('registra las cuatro rutas principales', () => {
    const router = loadRoutes();

    expect(
      getRoute(router, 'post', '/inpaint')
    ).toBeDefined();

    expect(
      getRoute(router, 'get', '/visualizar/trabajos/:id/colores')
    ).toBeDefined();

    expect(
      getRoute(router, 'post', '/visualizar')
    ).toBeDefined();

    expect(
      getRoute(router, 'post', '/mascara-auto')
    ).toBeDefined();
  });

  it('ejecuta el middleware de diagnóstico con content-type definido', () => {
    const router = loadRoutes();

    const middleware = getDiagnosticMiddleware(router);
    const next = vi.fn();

    const req = {
      method: 'POST',
      path: '/inpaint',
      headers: {
        'content-type': 'application/json',
      },
    };

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ejecuta el middleware de diagnóstico sin content-type', () => {
    const router = loadRoutes();

    const middleware = getDiagnosticMiddleware(router);
    const next = vi.fn();

    const req = {
      method: 'GET',
      path: '/visualizar/trabajos/1/colores',
      headers: {},
    };

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('permite continuar con optionalAuth cuando no existe authorization', () => {
    const router = loadRoutes();

    const route = getRoute(router, 'post', '/inpaint');
    const optionalAuth = route.route.stack[0].handle;
    const next = vi.fn();

    const req = {
      headers: {},
    };

    optionalAuth(req, {}, next);

    expect(protectMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ejecuta protect cuando existe authorization y continúa sin error', () => {
    const router = loadRoutes();

    const route = getRoute(router, 'post', '/inpaint');
    const optionalAuth = route.route.stack[0].handle;
    const next = vi.fn();

    protectMock.mockImplementation((_req, _res, callback) => {
      callback();
    });

    const req = {
      headers: {
        authorization: 'Bearer token',
      },
    };

    optionalAuth(req, {}, next);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('establece req.user en null cuando protect devuelve un error', () => {
    const router = loadRoutes();

    const route = getRoute(router, 'post', '/inpaint');
    const optionalAuth = route.route.stack[0].handle;
    const next = vi.fn();

    protectMock.mockImplementation((_req, _res, callback) => {
      callback(new Error('token inválido'));
    });

    const req = {
      headers: {
        authorization: 'Bearer invalid',
      },
    };

    optionalAuth(req, {}, next);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('conserva req.user cuando protect no devuelve error', () => {
    const router = loadRoutes();

    const route = getRoute(router, 'get', '/visualizar/trabajos/:id/colores');
    const optionalAuth = route.route.stack[0].handle;
    const next = vi.fn();

    protectMock.mockImplementation((req, _res, callback) => {
      req.user = { id: 7 };
      callback(null);
    });

    const req = {
      headers: {
        authorization: 'Bearer valid',
      },
    };

    optionalAuth(req, {}, next);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 7 });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('usa el fallback cuando protect no está disponible', () => {
    const router = loadRoutesWithoutAuth();

    const route = getRoute(router, 'get', '/visualizar/trabajos/:id/colores');
    const optionalAuth = route.route.stack[0].handle;
    const next = vi.fn();

    optionalAuth({}, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('configura multer con memoria, límite de 10 MB y filtro de imágenes', () => {
    loadRoutes();

    expect(multerMock).toHaveBeenCalledTimes(1);
    expect(multerMock.memoryStorage).toHaveBeenCalledTimes(1);

    const options = multerMock.mock.calls[0][0];

    expect(options.storage).toEqual({
      type: 'memory',
    });

    expect(options.limits).toEqual({
      fileSize: 10 * 1024 * 1024,
    });

    const callback = vi.fn();

    options.fileFilter(
      {},
      { mimetype: 'image/png' },
      callback
    );

    expect(callback).toHaveBeenCalledWith(null, true);

    callback.mockClear();

    options.fileFilter(
      {},
      { mimetype: 'application/pdf' },
      callback
    );

    expect(callback).toHaveBeenCalledWith(
      expect.any(Error),
      false
    );
  });

  it('configura upload.fields para visualizar con imagen y mascara', () => {
    loadRoutes();

    expect(uploadMock.fields).toHaveBeenCalledWith([
      { name: 'imagen', maxCount: 1 },
      { name: 'mascara', maxCount: 1 },
    ]);
  });

  it('configura upload.fields para mascara-auto con una imagen', () => {
    loadRoutes();

    expect(uploadMock.fields).toHaveBeenCalledWith([
      { name: 'imagen', maxCount: 1 },
    ]);
  });

  it('aplica validateBody al schema de inpaint', () => {
    loadRoutes();

    expect(validateBodyMock).toHaveBeenCalledWith(inpaintSchemaMock);
  });

  it('aplica validateBody al schema de visualizar', () => {
    loadRoutes();

    expect(validateBodyMock).toHaveBeenCalledWith(visualizarSchemaMock);
  });

  it('conserva los handlers y la cadena de middlewares de las cuatro rutas', () => {
    const router = loadRoutes();

    const inpaintRoute = getRoute(router, 'post', '/inpaint');
    const coloresRoute = getRoute(
      router,
      'get',
      '/visualizar/trabajos/:id/colores'
    );
    const visualizarRoute = getRoute(router, 'post', '/visualizar');
    const mascaraRoute = getRoute(router, 'post', '/mascara-auto');

    expect(inpaintRoute.route.stack.at(-1).handle)
      .toBe(controllerMock.inpaint);

    expect(coloresRoute.route.stack.at(-1).handle)
      .toBe(controllerMock.getTrabajoConColores);

    expect(visualizarRoute.route.stack.at(-1).handle)
      .toBe(controllerMock.visualizarEspacio);

    expect(mascaraRoute.route.stack.at(-1).handle)
      .toBe(controllerMock.mascaraAuto);
  });

  it('registra optionalAuth antes del controller en todas las rutas', () => {
    const router = loadRoutes();

    const routes = [
      getRoute(router, 'post', '/inpaint'),
      getRoute(router, 'get', '/visualizar/trabajos/:id/colores'),
      getRoute(router, 'post', '/visualizar'),
      getRoute(router, 'post', '/mascara-auto'),
    ];

    for (const route of routes) {
      expect(route.route.stack[0].handle).toBeTypeOf('function');
      expect(route.route.stack.at(-1).handle).toBeTypeOf('function');
    }
  });
});
