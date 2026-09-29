const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  collectRouteSources,
} = require('../generators/collect-routes');

describe('collectRouteSources - casos adicionales', () => {
  test('recorre directorios anidados y conserva las rutas encontradas', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-routes-'),
    );

    const routesDir = path.join(
      rootDir,
      'backend',
      'routes',
      'admin',
    );

    fs.mkdirSync(routesDir, { recursive: true });

    fs.writeFileSync(
      path.join(rootDir, 'backend', 'routes', 'clientes.js'),
      'router.get("/clientes", handler);',
    );

    fs.writeFileSync(
      path.join(routesDir, 'usuarios.js'),
      'router.get("/usuarios", handler);',
    );

    const files = collectRouteSources(rootDir);

    expect(files).toEqual([
      path.join(rootDir, 'backend', 'routes', 'admin', 'usuarios.js'),
      path.join(rootDir, 'backend', 'routes', 'clientes.js'),
    ]);
  });

  test('ignora archivos que no corresponden a rutas JavaScript', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-routes-'),
    );

    const routesDir = path.join(
      rootDir,
      'backend',
      'routes',
    );

    fs.mkdirSync(routesDir, { recursive: true });

    fs.writeFileSync(
      path.join(routesDir, 'clientes.js'),
      'router.get("/clientes", handler);',
    );

    fs.writeFileSync(
      path.join(routesDir, 'README.md'),
      '# Rutas',
    );

    expect(collectRouteSources(rootDir)).toEqual([
      path.join(routesDir, 'clientes.js'),
    ]);
  });
});
