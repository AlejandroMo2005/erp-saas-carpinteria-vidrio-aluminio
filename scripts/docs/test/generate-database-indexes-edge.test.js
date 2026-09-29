const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDatabaseIndexes,
} = require('../generators/generate-database-indexes');

describe('generateDatabaseIndexes - casos límite', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-indexes-edge-'),
    );

    fs.mkdirSync(
      path.join(
        temporaryRoot,
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

  it('detecta índices con múltiples columnas', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'schema.sql',
      ),
      `
        CREATE TABLE \`clientes\` (
          \`id\` INT NOT NULL,
          \`apellido\` VARCHAR(100),
          \`nombre\` VARCHAR(100),
          PRIMARY KEY (\`id\`),
          KEY \`idx_cliente_nombre\`
            (\`apellido\`, \`nombre\`)
        );
      `,
      'utf8',
    );

    const filePath = generateDatabaseIndexes(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'idx_cliente_nombre',
    );

    expect(content).toContain(
      '`apellido`',
    );

    expect(content).toContain(
      '`nombre`',
    );
  });

  it('detecta índices definidos como INDEX', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'schema.sql',
      ),
      `
        CREATE TABLE \`productos\` (
          \`id\` INT NOT NULL,
          \`codigo\` VARCHAR(50),
          PRIMARY KEY (\`id\`),
          INDEX \`idx_producto_codigo\`
            (\`codigo\`)
        );
      `,
      'utf8',
    );

    const filePath = generateDatabaseIndexes(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'idx_producto_codigo',
    );

    expect(content).toContain(
      '`codigo`',
    );
  });

  it('mantiene la fuente SQL asociada a cada índice', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'indexes.sql',
      ),
      `
        CREATE TABLE \`productos\` (
          \`id\` INT NOT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_producto_id\`
            (\`id\`)
        );
      `,
      'utf8',
    );

    const filePath = generateDatabaseIndexes(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'indexes.sql',
    );
  });
});
