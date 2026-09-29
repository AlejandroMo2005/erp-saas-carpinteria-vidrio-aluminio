const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('flujo integrado de documentación de API', () => {
  test('integra el descubrimiento y catálogo de rutas', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-api-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-api-flow-test',
        version: '1.0.0',
      }),
    );

    const routesDir = path.join(
      rootDir,
      'backend',
      'routes',
    );

    fs.mkdirSync(routesDir, { recursive: true });

    fs.writeFileSync(
      path.join(routesDir, 'clientes.js'),
      `
        router.get('/clientes', listarClientes);
        router.post('/clientes', crearCliente);
        router.delete('/clientes/:id', eliminarCliente);
      `,
    );

    generateDocumentation(rootDir);

    const catalogPath = path.join(
      rootDir,
      'docs',
      'generated',
      'api',
      'catalog.md',
    );

    const content = fs.readFileSync(
      catalogPath,
      'utf8',
    );

    expect(content).toContain('/clientes');
    expect(content).toContain('/clientes/:id');
    expect(content).toContain('GET');
    expect(content).toContain('POST');
    expect(content).toContain('DELETE');
  });
});
