const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDatabaseIndexes,
} = require('../generators/generate-database-indexes');

describe('generateDatabaseIndexes', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-indexes-'),
    );

    fs.mkdirSync(
      path.join(temporaryRoot, 'database'),
      { recursive: true },
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('genera índices de tablas SQL', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'schema.sql',
      ),
      `
        CREATE TABLE \`clientes\` (
          \`id\` INT NOT NULL,
          \`nombre\` VARCHAR(100) NOT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_cliente_nombre\` (\`nombre\`),
          KEY \`idx_cliente_nombre\` (\`nombre\`)
        );
      `,
      'utf8',
    );

    const filePath = generateDatabaseIndexes(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'clientes',
    );

    expect(content).toContain(
      'PRIMARY',
    );

    expect(content).toContain(
      'uq_cliente_nombre',
    );

    expect(content).toContain(
      'idx_cliente_nombre',
    );

    expect(content).toContain(
      'nombre',
    );
  });

  it('incluye la fuente de cada índice', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'indexes.sql',
      ),
      `
        CREATE TABLE \`productos\` (
          \`id\` INT NOT NULL,
          \`codigo\` VARCHAR(50) NOT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_producto_codigo\` (\`codigo\`)
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

  it('maneja proyectos sin índices definidos', () => {
    const filePath = generateDatabaseIndexes(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Índices de base de datos',
    );

    expect(content).toContain(
      'No se encontraron índices definidos',
    );
  });

  it('incluye la marca de generación automática', () => {
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

    const filePath = generateDatabaseIndexes(
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
