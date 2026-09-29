const fs = require('node:fs');
const os = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('generateDocumentation', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-orchestrator-'),
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

    fs.mkdirSync(
      path.join(
        temporaryRoot,
        'database',
      ),
      { recursive: true },
    );

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

    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'schema.sql',
      ),
      `
        CREATE TABLE \`clientes\` (
          \`id\` INT NOT NULL,
          PRIMARY KEY (\`id\`)
        );
      `,
      'utf8',
    );

    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'package.json',
      ),
      JSON.stringify(
        {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {},
          devDependencies: {},
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

  it('ejecuta todos los generadores de documentación', () => {
    const generatedFiles = generateDocumentation(
      temporaryRoot,
    );

    expect(generatedFiles).toHaveLength(15);

    for (const filePath of generatedFiles) {
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it('genera documentos en las áreas esperadas', () => {
    generateDocumentation(
      temporaryRoot,
    );

    const expectedFiles = [
      'docs/generated/README.md',
      'docs/generated/api/endpoints.md',
      'docs/generated/architecture/project-structure.md',
      'docs/generated/database/schema.md',
      'docs/generated/database/entities.md',
      'docs/generated/database/relations.md',
      'docs/generated/database/indexes.md',
      'docs/generated/database/programability.md',
      'docs/generated/dependencies.md',
      'docs/generated/documentation-manifest.md',
      'docs/generated/project-metadata.md',
      'docs/generated/quality/lint-evidence.md',
      'docs/generated/quality/test-evidence.md',
      'docs/generated/quality/tests.md',
      'docs/generated/repository/git-info.md',
    ];

    for (const relativePath of expectedFiles) {
      expect(
        fs.existsSync(
          path.join(
            temporaryRoot,
            relativePath,
          ),
        ),
      ).toBe(true);
    }
  });

  it('devuelve las rutas absolutas de los archivos generados', () => {
    const generatedFiles = generateDocumentation(
      temporaryRoot,
    );

    for (const filePath of generatedFiles) {
      expect(
        path.isAbsolute(filePath),
      ).toBe(true);

      expect(
        filePath.startsWith(temporaryRoot),
      ).toBe(true);
    }
  });
});
