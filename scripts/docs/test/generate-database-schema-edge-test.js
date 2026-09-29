const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDatabaseSchema,
} = require('../generators/generate-database-schema');

describe('generateDatabaseSchema - casos límite', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-schema-edge-'),
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

  it('procesa múltiples fuentes SQL', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'clientes.sql',
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
        'database',
        'productos.sql',
      ),
      `
        CREATE TABLE \`productos\` (
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
      'clientes',
    );

    expect(content).toContain(
      'productos',
    );

    expect(content).toContain(
      'clientes.sql',
    );

    expect(content).toContain(
      'productos.sql',
    );
  });

  it('incluye tablas con columnas de diferentes tipos', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'schema.sql',
      ),
      `
        CREATE TABLE \`productos\` (
          \`id\` INT NOT NULL,
          \`nombre\` VARCHAR(150) NOT NULL,
          \`precio\` DECIMAL(10,2),
          \`activo\` BOOLEAN DEFAULT TRUE,
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
      'productos',
    );

    expect(content).toContain(
      'nombre',
    );

    expect(content).toContain(
      'precio',
    );

    expect(content).toContain(
      'activo',
    );
  });

  it('procesa tablas con nombres escapados', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'schema.sql',
      ),
      `
        CREATE TABLE IF NOT EXISTS \`detalle_pedido\` (
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
      'detalle_pedido',
    );
  });
});
