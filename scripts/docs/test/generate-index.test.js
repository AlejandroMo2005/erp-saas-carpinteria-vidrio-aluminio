const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateIndex,
} = require('../generators/generate-index');

describe('generateIndex', () => {
  let temporaryRoot;
  let generatedDirectory;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-index-'),
    );

    generatedDirectory = path.join(
      temporaryRoot,
      'docs',
      'generated',
    );

    fs.mkdirSync(
      path.join(
        generatedDirectory,
        'api',
      ),
      { recursive: true },
    );

    fs.mkdirSync(
      path.join(
        generatedDirectory,
        'database',
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

  it('genera el índice principal', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'api',
        'endpoints.md',
      ),
      '# Endpoints\n',
      'utf8',
    );

    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'database',
        'schema.md',
      ),
      '# Esquema\n',
      'utf8',
    );

    const filePath = generateIndex(temporaryRoot);

    expect(
      fs.existsSync(filePath),
    ).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'api/endpoints.md',
    );

    expect(content).toContain(
      'database/schema.md',
    );
  });

  it('excluye el propio README del índice', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'README.md',
      ),
      '# Documento anterior\n',
      'utf8',
    );

    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'api',
        'endpoints.md',
      ),
      '# Endpoints\n',
      'utf8',
    );

    generateIndex(temporaryRoot);

    const content = fs.readFileSync(
      path.join(
        generatedDirectory,
        'README.md',
      ),
      'utf8',
    );

    expect(content).not.toContain(
      'README.md](README.md)',
    );

    expect(content).toContain(
      'api/endpoints.md',
    );
  });

  it('genera un mensaje cuando no existen documentos adicionales', () => {
    const filePath = generateIndex(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'No existen documentos generados disponibles.',
    );
  });
});
