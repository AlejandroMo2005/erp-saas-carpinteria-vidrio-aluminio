const {
  parseRouteSource,
} = require('../generators/parse-routes');

describe('parseRouteSource', () => {
  it('extrae rutas HTTP de una fuente de rutas', () => {
    const routes = parseRouteSource(
      `
        router.get('/clientes', listarClientes);
        router.post('/clientes', crearCliente);
        router.put('/clientes/:id', actualizarCliente);
        router.delete('/clientes/:id', eliminarCliente);
      `,
      {
        filePath: 'backend/src/modules/clientes.js',
      },
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

  it('conserva el archivo y combina el prefijo de montaje', () => {
    const routes = parseRouteSource(
      "router.get('/clientes', handler);",
      {
        filePath: 'backend/src/modules/clientes.js',
        mountPath: '/api',
      },
    );

    expect(routes[0]).toEqual({
      method: 'GET',
      path: '/api/clientes',
      file: 'backend/src/modules/clientes.js',
    });
  });

  it('detecta rutas HTTP soportadas con rutas dinámicas', () => {
    const routes = parseRouteSource(
      `
        router.patch('/clientes/:id', actualizarCliente);
        router.delete("/clientes/:id", eliminarCliente);
      `,
      {
        filePath: 'backend/src/modules/clientes.js',
      },
    );

    expect(routes).toEqual([
      {
        method: 'PATCH',
        path: '/clientes/:id',
        file: 'backend/src/modules/clientes.js',
      },
      {
        method: 'DELETE',
        path: '/clientes/:id',
        file: 'backend/src/modules/clientes.js',
      },
    ]);
  });

  it('devuelve una lista vacía cuando no existen rutas HTTP', () => {
    expect(
      parseRouteSource(
        'const router = express.Router();',
        {
          filePath: 'backend/src/modules/vacio.js',
        },
      ),
    ).toEqual([]);
  });
});
