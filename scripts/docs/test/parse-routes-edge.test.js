const {
  parseRoutes,
} = require('../generators/parse-routes');

describe('parseRoutes - casos adicionales', () => {
  test('detecta métodos PATCH y DELETE con rutas dinámicas', () => {
    const content = `
      router.patch('/clientes/:id', actualizarCliente);
      router.delete("/clientes/:id", eliminarCliente);
    `;

    const routes = parseRoutes(
      content,
      'backend/routes/clientes.js',
    );

    expect(routes).toEqual([
      {
        method: 'PATCH',
        path: '/clientes/:id',
        source: 'backend/routes/clientes.js',
      },
      {
        method: 'DELETE',
        path: '/clientes/:id',
        source: 'backend/routes/clientes.js',
      },
    ]);
  });

  test('devuelve un arreglo vacío cuando no existen rutas', () => {
    expect(
      parseRoutes(
        'const router = express.Router();',
        'backend/routes/vacio.js',
      ),
    ).toEqual([]);
  });
});
