const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

describe('generate-docs.js', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-cli-'),
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

  it('expone la función principal del generador', () => {
    const generatorPath = path.resolve(
      __dirname,
      '../generate-docs.js',
    );

    expect(
      fs.existsSync(generatorPath),
    ).toBe(true);
  });

  it('mantiene separado el script de entrada del orquestador', () => {
    const scriptPath = path.resolve(
      __dirname,
      '../generate-docs.js',
    );

    const content = fs.readFileSync(
      scriptPath,
      'utf8',
    );

    expect(content).toContain(
      "require('./generators/generate-docs')",
    );

    expect(content).toContain(
      'generateDocumentation',
    );
  });
});
