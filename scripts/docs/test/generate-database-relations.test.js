const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDatabaseRelations,
} = require('../generators/generate-database-relations');

describe('generateDatabaseRelations', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-relations-'),
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

  it('genera relaciones a partir de claves foráneas', () => {
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

        CREATE TABLE \`proformas\` (
          \`id\` INT NOT NULL,
          \`cliente_id\` INT NOT NULL,
          PRIMARY KEY (\`id\`),
          CONSTRAINT \`fk_proforma_cliente\`
            FOREIGN KEY (\`cliente_id\`)
            REFERENCES \`clientes\` (\`id\`)
        );
      `,
      'utf8',
    );

    const filePath = generateDatabaseRelations(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'fk_proforma_cliente',
    );


    expect(content).toContain(
      'cliente_id',
    );

    expect(content).toContain(
      'clientes',
    );
  });

  it('incluye la fuente de cada relación', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'relations.sql',
      ),
      `
        CREATE TABLE \`clientes\` (
          \`id\` INT NOT NULL,
          PRIMARY KEY (\`id\`)
        );

        CREATE TABLE \`pedidos\` (
          \`id\` INT NOT NULL,
          \`cliente_id\` INT NOT NULL,
          CONSTRAINT \`fk_pedido_cliente\`
            FOREIGN KEY (\`cliente_id\`)
            REFERENCES \`clientes\` (\`id\`)
        );
      `,
      'utf8',
    );

    const filePath = generateDatabaseRelations(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'relations.sql',
    );
  });

  it('maneja proyectos sin relaciones', () => {
    const filePath = generateDatabaseRelations(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Relaciones automáticas de base de datos',
    );

    expect(content).toContain(
      'Relaciones detectadas: 0',
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

        CREATE TABLE \`pedidos\` (
          \`id\` INT NOT NULL,
          \`cliente_id\` INT NOT NULL,
          CONSTRAINT \`fk_pedido_cliente\`
            FOREIGN KEY (\`cliente_id\`)
            REFERENCES \`clientes\` (\`id\`)
        );
      `,
      'utf8',
    );

    const filePath = generateDatabaseRelations(
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
