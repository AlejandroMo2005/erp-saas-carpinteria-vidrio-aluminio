const fs = require('node:fs');
const os = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  generateApiCatalog,
} = require('../generators/generate-api-catalog');

describe('generateApiCatalog', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-api-'),
    );

    fs.mkdirSync(
      path.join(
        temporaryRoot,
        'backend',
        'src',
        'routes',
      ),
      { recursive: true },
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('genera el catálogo de endpoints', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'backend',
        'src',
        'routes',
        'clientes.js',
      ),
      `
        router.get('/clientes', listarClientes);
        router.post('/clientes', crearCliente);
        router.delete('/clientes/:id', eliminarCliente);
      `,
      'utf8',
    );

    const filePath = generateApiCatalog(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'GET',
    );

    expect(content).toContain(
      '/clientes',
    );

    expect(content).toContain(
      'POST',
    );

    expect(content).toContain(
      'DELETE',
    );

    expect(content).toContain(
      'clientes.js',
    );
  });

  it('genera el catálogo aunque no existan rutas', () => {
    const filePath = generateApiCatalog(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Catálogo de endpoints',
    );

    expect(content).toContain(
      'No se encontraron endpoints',
    );
  });

  it('incluye la marca de generación automática', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'backend',
        'src',
        'routes',
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
      'generado automáticamente',
    );
  });
});
