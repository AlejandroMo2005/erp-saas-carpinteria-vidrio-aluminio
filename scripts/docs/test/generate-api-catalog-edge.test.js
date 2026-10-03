const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateApiCatalog,
} = require('../generators/generate-api-catalog');

describe('generateApiCatalog - casos límite', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-api-edge-'),
    );

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
        'index.js',
      ),
      "app.use('/api/clientes', loadModule('./clientes'));\napp.use('/api/detalle', loadModule('./detalle'));",
      'utf8',
    );
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'backend',
        'src',
        'modules',
        'index.js',
      ),
      "app.use('/api/clientes', loadModule('./clientes'));\napp.use('/api/detalle', loadModule('./detalle'));",
      'utf8',
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('recopila rutas de múltiples archivos', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'backend',
        'src',
        'modules',
        'clientes.js',
      ),
      `
        router.get('/clientes', listarClientes);
        router.post('/clientes', crearCliente);
      `,
      'utf8',
    );

    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'backend',
        'src',
        'modules',
        'detalle.js',
      ),
      `
        router.get('/clientes/:id', obtenerCliente);
        router.delete('/clientes/:id', eliminarCliente);
      `,
      'utf8',
    );

    const filePath = generateApiCatalog(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'GET',
    );

    expect(content).toContain(
      'POST',
    );

    expect(content).toContain(
      'DELETE',
    );

    expect(content).toContain(
      '/clientes/:id',
    );
  });

  it('conserva la ruta fuente de cada endpoint', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'backend',
        'src',
        'modules',
        'clientes.js',
      ),
      "router.get('/clientes', listarClientes);",
      'utf8',
    );

    const filePath = generateApiCatalog(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'clientes.js',
    );
  });

  it('incluye rutas con parámetros dinámicos', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'backend',
        'src',
        'modules',
        'clientes.js',
      ),
      `
        router.get('/clientes/:id', obtenerCliente);
        router.put('/clientes/:id', actualizarCliente);
      `,
      'utf8',
    );

    const filePath = generateApiCatalog(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '/clientes/:id',
    );
  });
});
