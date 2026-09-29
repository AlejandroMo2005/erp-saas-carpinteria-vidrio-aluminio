const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDatabaseSchema,
} = require('../generators/generate-database-schema');

describe('generateDatabaseSchema', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-schema-'),
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

  it('genera el esquema a partir de fuentes SQL', () => {
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
          PRIMARY KEY (\`id\`)
        );

        CREATE TABLE \`proformas\` (
          \`id\` INT NOT NULL,
          \`cliente_id\` INT NOT NULL,
          PRIMARY KEY (\`id\`)
        );
      `,
      'utf8',
    );

    const filePath = generateDatabaseSchema(
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
      'proformas',
    );

    expect(content).toContain(
      'schema.sql',
    );
  });

  it('incluye triggers y procedimientos almacenados', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'programmability.sql',
      ),
      `
        CREATE TABLE \`clientes\` (
          \`id\` INT NOT NULL,
          PRIMARY KEY (\`id\`)
        );

        CREATE TRIGGER \`trg_cliente\`
        BEFORE INSERT ON \`clientes\`
        FOR EACH ROW
        SET NEW.id = NEW.id;

        CREATE PROCEDURE \`sp_clientes\`()
        BEGIN
          SELECT * FROM clientes;
        END;
      `,
      'utf8',
    );

    const filePath = generateDatabaseSchema(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'trg_cliente',
    );

    expect(content).toContain(
      'sp_clientes',
    );
  });

  it('maneja proyectos sin fuentes SQL', () => {
    const filePath = generateDatabaseSchema(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Esquema de base de datos',
    );

    expect(content).toContain(
      'No se encontraron fuentes SQL',
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

    const filePath = generateDatabaseSchema(
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
