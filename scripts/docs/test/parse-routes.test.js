const {
  parseRoutes,
} = require('../generators/parse-routes');

describe('parseRoutes', () => {
  it('extrae rutas HTTP de un archivo de rutas', () => {
    const content = `
      router.get('/clientes', listarClientes);
      router.post('/clientes', crearCliente);
      router.put('/clientes/:id', actualizarCliente);
      router.delete('/clientes/:id', eliminarCliente);
    `;

    const routes = parseRoutes(
      content,
      'backend/src/routes/clientes.js',
    );

    expect(routes).toHaveLength(4);

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: 'GET',
          path: '/clientes',
        }),
        expect.objectContaining({
          method: 'POST',
          path: '/clientes',
        }),
        expect.objectContaining({
          method: 'PUT',
          path: '/clientes/:id',
        }),
        expect.objectContaining({
          method: 'DELETE',
          path: '/clientes/:id',
        }),
      ]),
    );
  });

  it('conserva la fuente de cada ruta', () => {
    const routes = parseRoutes(
      "router.get('/clientes', handler);",
      'backend/src/routes/clientes.js',
    );

    expect(routes[0]).toEqual(
      expect.objectContaining({
        source: 'backend/src/routes/clientes.js',
      }),
    );
  });

  it('detecta rutas con router.use', () => {
    const routes = parseRoutes(
      `
        router.use('/clientes', clientesRouter);
        router.get('/clientes/:id', obtenerCliente);
      `,
      'backend/src/routes/index.js',
    );

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: 'USE',
          path: '/clientes',
        }),
        expect.objectContaining({
          method: 'GET',
          path: '/clientes/:id',
        }),
      ]),
    );
  });

  it('devuelve una lista vacía cuando no existen rutas', () => {
    const routes = parseRoutes(
      'const value = true;',
      'backend/src/routes/example.js',
    );

    expect(routes).toEqual([]);
  });
});
