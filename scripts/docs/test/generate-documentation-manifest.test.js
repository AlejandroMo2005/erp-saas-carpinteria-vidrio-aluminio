const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentationManifest,
} = require('../generators/generate-documentation-manifest');

describe('generateDocumentationManifest', () => {
  let temporaryRoot;
  let generatedDirectory;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-manifest-'),
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

  it('genera el manifiesto de documentación', () => {
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

    const filePath = generateDocumentationManifest(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

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

  it('excluye el propio manifiesto', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'documentation-manifest.md',
      ),
      '# Manifiesto anterior\n',
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

    generateDocumentationManifest(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      path.join(
        generatedDirectory,
        'documentation-manifest.md',
      ),
      'utf8',
    );

    expect(content).not.toContain(
      'documentation-manifest.md](documentation-manifest.md)',
    );

    expect(content).toContain(
      'api/endpoints.md',
    );
  });

  it('genera el manifiesto sin documentos adicionales', () => {
    const filePath = generateDocumentationManifest(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Índice de documentación generada',
    );
  });

  it('mantiene estable el contenido al regenerar', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'api',
        'endpoints.md',
      ),
      '# Endpoints\n',
      'utf8',
    );

    const filePath = generateDocumentationManifest(
      temporaryRoot,
    );

    const firstContent = fs.readFileSync(
      filePath,
      'utf8',
    );

    generateDocumentationManifest(
      temporaryRoot,
    );

    const secondContent = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(secondContent).toBe(
      firstContent,
    );
  });
});
