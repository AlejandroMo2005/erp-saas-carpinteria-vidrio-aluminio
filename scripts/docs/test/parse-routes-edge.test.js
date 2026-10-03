const {
  normalizeRoutePath,
  combineRoutePaths,
  parseRouteSource,
} = require('../generators/parse-routes');

describe('parse-routes - casos adicionales', () => {
  test('normaliza rutas raíz y barras duplicadas', () => {
    expect(normalizeRoutePath('/')).toBe('');
    expect(normalizeRoutePath('///clientes///')).toBe('/clientes');
  });

  test('combina correctamente prefijo y ruta', () => {
    expect(
      combineRoutePaths('/api/', '/clientes/:id/'),
    ).toBe('/api/clientes/:id');
  });

  test('detecta HEAD y OPTIONS', () => {
    const routes = parseRouteSource(
      `
        router.head('/health', handler);
        router.options('/clientes', handler);
      `,
      {
        filePath: 'backend/src/modules/clientes.js',
      },
    );

    expect(routes).toEqual([
      {
        method: 'HEAD',
        path: '/health',
        file: 'backend/src/modules/clientes.js',
      },
      {
        method: 'OPTIONS',
        path: '/clientes',
        file: 'backend/src/modules/clientes.js',
      },
    ]);
  });

  test('no interpreta router.use como endpoint HTTP', () => {
    const routes = parseRouteSource(
      "router.use('/clientes', clientesRouter);",
      {
        filePath: 'backend/src/modules/index.js',
      },
    );

    expect(routes).toEqual([]);
  });
});
