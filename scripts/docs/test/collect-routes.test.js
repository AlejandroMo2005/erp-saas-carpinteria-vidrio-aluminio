const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  collectRouteFiles,
} = require('../generators/collect-routes');

describe('collectRouteFiles', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-routes-'),
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('recopila archivos de rutas JavaScript', () => {
    fs.mkdirSync(
      path.join(
        temporaryRoot,
        'backend',
        'src',
        'modules',
      ),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'backend',
        'src',
        'modules',
        'clientes.js',
      ),
      'router.get("/clientes", handler);',
      'utf8',
    );

    const files = collectRouteFiles(
      temporaryRoot,
    );

    expect(files).toHaveLength(1);
    expect(files[0]).toContain(
      path.join(
        'backend',
        'src',
        'modules',
        'clientes.js',
      ),
    );
  });

  it('recopila rutas dentro de subdirectorios', () => {
    const routeDirectory = path.join(
      temporaryRoot,
      'backend',
      'src',
      'modules',
      'facturacion',
    );

    fs.mkdirSync(routeDirectory, {
      recursive: true,
    });

    fs.writeFileSync(
      path.join(
        routeDirectory,
        'facturas.js',
      ),
      'router.get("/facturas", handler);',
      'utf8',
    );

    const files = collectRouteFiles(
      temporaryRoot,
    );

    expect(files).toHaveLength(1);
    expect(files[0]).toContain(
      'facturacion',
    );
    expect(files[0]).toContain(
      'facturas.js',
    );
  });

  it('ignora directorios excluidos', () => {
    const nodeModulesDirectory = path.join(
      temporaryRoot,
      'node_modules',
      'example',
    );

    fs.mkdirSync(nodeModulesDirectory, {
      recursive: true,
    });

    fs.writeFileSync(
      path.join(
        nodeModulesDirectory,
        'routes.js',
      ),
      'router.get("/test", handler);',
      'utf8',
    );

    const files = collectRouteFiles(
      temporaryRoot,
    );

    expect(files).toEqual([]);
  });

  it('devuelve una lista vacía cuando no existen rutas', () => {
    const files = collectRouteFiles(
      temporaryRoot,
    );

    expect(files).toEqual([]);
  });
});
