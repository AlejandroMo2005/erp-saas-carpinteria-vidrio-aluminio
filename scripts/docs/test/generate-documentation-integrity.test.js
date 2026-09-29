const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('integridad de documentación generada', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-integrity-'),
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

  it('todos los archivos generados contienen título y marca automática', () => {
    const generatedFiles = generateDocumentation(
      temporaryRoot,
    );

    for (const filePath of generatedFiles) {
      const content = fs.readFileSync(
        filePath,
        'utf8',
      );

      expect(content.startsWith('# ')).toBe(true);

      expect(content).toContain(
        'generado automáticamente',
      );
    }
  });

  it('mantiene todos los archivos generados dentro de docs/generated', () => {
    const generatedFiles = generateDocumentation(
      temporaryRoot,
    );

    const generatedDirectory = path.join(
      temporaryRoot,
      'docs',
      'generated',
    );

    for (const filePath of generatedFiles) {
      expect(
        filePath.startsWith(generatedDirectory),
      ).toBe(true);
    }
  });
});
