import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const controllerPath = require.resolve(
  process.cwd() + '/src/modules/inventario/color/color.controller.js'
);
const routesPath = require.resolve(
  process.cwd() + '/src/modules/inventario/color/color.routes.js'
);

const controllerMock = {
  getColores: vi.fn((req, res) => res.json([])),
};

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
  clear(routesPath);
  return require(routesPath);
}

describe('color.routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registra GET / y ejecuta el controlador', () => {
    const router = loadRoutes();

    const route = router.stack.find(
      layer => layer.route?.path === '/' && layer.route?.methods?.get
    );

    expect(route).toBeDefined();
    expect(route.route.methods.get).toBe(true);

    const req = {};
    const res = {
      json: vi.fn(),
    };

    const handlers = route.route.stack.map(layer => layer.handle);

    expect(handlers).toHaveLength(1);

    handlers[0](req, res);

    expect(controllerMock.getColores).toHaveBeenCalledWith(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});
