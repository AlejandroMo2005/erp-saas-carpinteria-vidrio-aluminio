const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDatabaseEntities,
} = require('../generators/generate-database-entities');

describe('generateDatabaseEntities', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-entities-'),
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

  it('genera entidades y columnas desde fuentes SQL', () => {
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
          \`email\` VARCHAR(150),
          PRIMARY KEY (\`id\`)
        );

        CREATE TABLE \`proformas\` (
          \`id\` INT NOT NULL,
          \`cliente_id\` INT NOT NULL,
          \`total\` DECIMAL(10,2),
          PRIMARY KEY (\`id\`)
        );
      `,
      'utf8',
    );

    const filePath = generateDatabaseEntities(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '## clientes',
    );

    expect(content).toContain(
      '`id`',
    );

    expect(content).toContain(
      '`nombre`',
    );

    expect(content).toContain(
      '`email`',
    );

    expect(content).toContain(
      '## proformas',
    );

    expect(content).toContain(
      '`cliente_id`',
    );

    expect(content).toContain(
      '`total`',
    );
  });

  it('incluye información de la fuente SQL', () => {
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

    const filePath = generateDatabaseEntities(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'schema.sql',
    );
  });

  it('maneja proyectos sin entidades SQL', () => {
    const filePath = generateDatabaseEntities(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Entidades automáticas de base de datos',
    );

    expect(content).toContain(
      'No se detectaron tablas en las fuentes SQL.',
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

    const filePath = generateDatabaseEntities(
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
