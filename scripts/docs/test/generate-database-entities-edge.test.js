const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDatabaseEntities,
} = require('../generators/generate-database-entities');

describe('generateDatabaseEntities - casos adicionales', () => {
  test('genera entidades a partir de múltiples fuentes SQL', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-entities-'),
    );

    const databaseDir = path.join(rootDir, 'database');
    fs.mkdirSync(databaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(databaseDir, 'clientes.sql'),
      `
        CREATE TABLE clientes (
          id INT NOT NULL,
          nombre VARCHAR(100) NOT NULL
        );
      `,
    );

    fs.writeFileSync(
      path.join(databaseDir, 'productos.sql'),
      `
        CREATE TABLE productos (
          id INT NOT NULL,
          nombre VARCHAR(100)
        );
      `,
    );

    const generatedFile = generateDatabaseEntities(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('clientes');
    expect(content).toContain('productos');
    expect(content).toContain('clientes.sql');
    expect(content).toContain('productos.sql');
  });
});
