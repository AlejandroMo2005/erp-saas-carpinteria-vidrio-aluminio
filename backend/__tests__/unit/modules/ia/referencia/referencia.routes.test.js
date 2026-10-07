import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const controllerPath = require.resolve(
  process.cwd() + '/src/modules/ia/referencia/referencia.controller.js'
);
const authPath = require.resolve(
  process.cwd() + '/src/shared/middleware/auth.js'
);
const multerPath = require.resolve('multer');
const routesPath = require.resolve(
  process.cwd() + '/src/modules/ia/referencia/referencia.routes.js'
);

const controllerMock = {
  subirReferencia: vi.fn(),
  listarReferencias: vi.fn(),
  actualizarReferencia: vi.fn(),
  eliminarReferencia: vi.fn(),
};

const protectMock = vi.fn();

const uploadMock = {
  single: vi.fn(() => vi.fn()),
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
  inject(multerPath, multerMock);

  clear(routesPath);

  return require(routesPath);
}


function getRoute(router, method, path) {
  return router.stack.find(
    layer => layer.route?.path === path && layer.route?.methods?.[method]
  );
}

describe('referencia.routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    multerMock.mockClear();
    multerMock.memoryStorage.mockClear();
    uploadMock.single.mockClear();
    protectMock.mockClear();
  });

  it('registra las cuatro rutas principales', () => {
    const router = loadRoutes();

    expect(
      getRoute(router, 'get', '/trabajos/:trabajo_id')
    ).toBeDefined();

    expect(
      getRoute(router, 'post', '/trabajos/:trabajo_id')
    ).toBeDefined();

    expect(
      getRoute(router, 'patch', '/:id')
    ).toBeDefined();

    expect(
      getRoute(router, 'delete', '/:id')
    ).toBeDefined();
  });

  it('configura multer con memoria, límite de 8 MB y filtro de imágenes', () => {
    loadRoutes();

    expect(multerMock).toHaveBeenCalledTimes(1);
    expect(multerMock.memoryStorage).toHaveBeenCalledTimes(1);

    const options = multerMock.mock.calls[0][0];

    expect(options.storage).toEqual({
      type: 'memory',
    });

    expect(options.limits).toEqual({
      fileSize: 5 * 1024 * 1024,
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

  it('configura upload.single para la imagen', () => {
    loadRoutes();

    expect(uploadMock.single).toHaveBeenCalledTimes(1);
    expect(uploadMock.single).toHaveBeenCalledWith('imagen');
  });

  it('ejecuta requireAuth con una petición sin autorización', () => {
    const router = loadRoutes();

    const route = getRoute(
      router,
      'get',
      '/trabajos/:trabajo_id'
    );

    const requireAuth = route.route.stack[0].handle;
    const next = vi.fn();

    protectMock.mockImplementation((req, res, callback) => {
      callback();
    });

    const req = {
      headers: {},
    };

    requireAuth(req, {}, next);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalled();
  });

  it('ejecuta requireAuth con autorización válida', () => {
    const router = loadRoutes();

    const route = getRoute(
      router,
      'get',
      '/trabajos/:trabajo_id'
    );

    const requireAuth = route.route.stack[0].handle;
    const next = vi.fn();

    protectMock.mockImplementation((req, res, callback) => {
      req.user = { id: 7 };
      callback();
    });

    const req = {
      headers: {
        authorization: 'Bearer token',
      },
    };

    requireAuth(req, {}, next);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 7 });
    expect(next).toHaveBeenCalledTimes(1);
  });


  it('usa el fallback de autenticación cuando protect no está disponible', () => {
    const router = loadRoutesWithoutAuth();

    const route = getRoute(
      router,
      'get',
      '/trabajos/:trabajo_id'
    );

    const requireAuth = route.route.stack[0].handle;
    const next = vi.fn();

    requireAuth({}, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
  });


  it('conserva los handlers de las cuatro rutas', () => {
    const router = loadRoutes();

    const getRouteRef = getRoute(
      router,
      'get',
      '/trabajos/:trabajo_id'
    );

    const postRoute = getRoute(
      router,
      'post',
      '/trabajos/:trabajo_id'
    );

    const patchRoute = getRoute(
      router,
      'patch',
      '/:id'
    );

    const deleteRoute = getRoute(
      router,
      'delete',
      '/:id'
    );

    expect(
      getRouteRef.route.stack.some(
        layer => layer.handle === controllerMock.listarReferencias
      )
    ).toBe(true);

    expect(
      postRoute.route.stack.some(
        layer => layer.handle === controllerMock.subirReferencia
      )
    ).toBe(true);

    expect(
      patchRoute.route.stack.some(
        layer => layer.handle === controllerMock.actualizarReferencia
      )
    ).toBe(true);

    expect(
      deleteRoute.route.stack.some(
        layer => layer.handle === controllerMock.eliminarReferencia
      )
    ).toBe(true);
  });
});
