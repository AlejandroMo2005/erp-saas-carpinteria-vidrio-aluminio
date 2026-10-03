import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const ctrl = {
  getTrabajos: vi.fn(),
  getColores: vi.fn(),
  getRecetasPorTrabajo: vi.fn(),
  agendarPedido: vi.fn(),
};

const validateBody = vi.fn((schema) => {
  const middleware = vi.fn();
  middleware.schema = schema;
  return middleware;
});

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === './trabajo.controller') return ctrl;

  if (request === '../../../shared/middleware/validateZod') {
    return { validateBody };
  }


  return originalLoad.call(this, request, parent, isMain);
};

const router = require(
  `${process.cwd()}/src/modules/comercial/trabajo/trabajo.routes.js`
);

Module._load = originalLoad;

describe('trabajo.routes', () => {  it('debe registrar las rutas GET', () => {
    const routes = router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    expect(routes).toEqual([
      {
        path: '/',
        methods: ['get'],
      },
      {
        path: '/colores',
        methods: ['get'],
      },
      {
        path: '/:id/recetas',
        methods: ['get'],
      },
    ]);
  });

  it('debe mantener /colores antes de /:id/recetas', () => {
    const paths = router.stack
      .filter((layer) => layer.route)
      .map((layer) => layer.route.path);

    expect(paths.indexOf('/colores')).toBeLessThan(
      paths.indexOf('/:id/recetas')
    );
  });

  it('debe asociar cada GET con su controller', () => {
    const layers = router.stack.filter((layer) => layer.route);

    const getTrabajos = layers.find(
      (layer) => layer.route.path === '/' && layer.route.methods.get
    );

    const getColores = layers.find(
      (layer) => layer.route.path === '/colores' && layer.route.methods.get
    );

    const getRecetas = layers.find(
      (layer) =>
        layer.route.path === '/:id/recetas' &&
        layer.route.methods.get
    );

    expect(getTrabajos.route.stack.at(-1).handle).toBe(ctrl.getTrabajos);
    expect(getColores.route.stack.at(-1).handle).toBe(ctrl.getColores);
    expect(getRecetas.route.stack.at(-1).handle).toBe(
      ctrl.getRecetasPorTrabajo
    );
  });


});
