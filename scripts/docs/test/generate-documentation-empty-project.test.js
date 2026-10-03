const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('generateDocumentation - proyecto vacío', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-empty-project-'),
    );

    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'package.json',
      ),
      JSON.stringify(
        {
          name: 'empty-project',
          version: '1.0.0',
        },
        null,
        2,
      ),
      'utf8',
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('genera documentación aunque no existan rutas ni fuentes SQL', () => {
    const generatedFiles = generateDocumentation(
      temporaryRoot,
    );

    expect(generatedFiles).toHaveLength(15);

    for (const filePath of generatedFiles) {
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it('genera mensajes de ausencia en los catálogos correspondientes', () => {
    generateDocumentation(
      temporaryRoot,
    );

    const apiContent = fs.readFileSync(
      path.join(
        temporaryRoot,
        'docs',
        'generated',
        'api',
        'endpoints.md',
      ),
      'utf8',
    );

    const schemaContent = fs.readFileSync(
      path.join(
        temporaryRoot,
        'docs',
        'generated',
        'database',
        'schema.md',
      ),
      'utf8',
    );

    expect(apiContent).toContain(
      'No se encontraron rutas HTTP en los archivos analizados.',
    );

    expect(schemaContent).toContain(
      'Fuentes SQL: 0',
    );
  });
});
