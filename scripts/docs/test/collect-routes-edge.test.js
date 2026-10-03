const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  collectRoutesSources,
} = require('../generators/collect-routes');

describe('collectRoutesSources - casos adicionales', () => {
  test('recorre módulos anidados y conserva sus montajes', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-routes-'),
    );

    const modulesDir = path.join(
      rootDir,
      'backend',
      'src',
      'modules',
    );

    fs.mkdirSync(
      path.join(modulesDir, 'cliente'),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(modulesDir, 'index.js'),
      "app.use('/api/clientes', loadModule('./cliente/cliente.routes'));",
    );

    const routePath = path.join(
      modulesDir,
      'cliente',
      'cliente.routes.js',
    );

    fs.writeFileSync(
      routePath,
      'router.get("/clientes", handler);',
    );

    const files = collectRoutesSources(rootDir);

    expect(files).toEqual([
      {
        filePath: routePath,
        mountPath: '/api/clientes',
        source: 'module',
      },
    ]);

    fs.rmSync(rootDir, {
      recursive: true,
      force: true,
    });
  });

  test('ignora referencias a archivos que no existen', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-routes-'),
    );

    const modulesDir = path.join(
      rootDir,
      'backend',
      'src',
      'modules',
    );

    fs.mkdirSync(modulesDir, {
      recursive: true,
    });

    fs.writeFileSync(
      path.join(modulesDir, 'index.js'),
      "app.use('/api/clientes', loadModule('./cliente/cliente.routes'));",
    );

    fs.writeFileSync(
      path.join(modulesDir, 'README.md'),
      '# Módulos',
    );

    expect(collectRoutesSources(rootDir)).toEqual([]);

    fs.rmSync(rootDir, {
      recursive: true,
      force: true,
    });
  });
});
