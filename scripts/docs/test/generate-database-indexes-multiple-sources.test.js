const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDatabaseIndexes,
} = require('../generators/generate-database-indexes');

describe('generateDatabaseIndexes - múltiples fuentes', () => {
  test('consolida índices provenientes de diferentes archivos SQL', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-indexes-'),
    );

    const databaseDir = path.join(rootDir, 'database');
    fs.mkdirSync(databaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(databaseDir, 'clientes.sql'),
      `
        CREATE TABLE clientes (
          id INT NOT NULL,
          email VARCHAR(150),
          PRIMARY KEY (id),
          UNIQUE KEY idx_clientes_email (email)
        );
      `,
    );

    fs.writeFileSync(
      path.join(databaseDir, 'productos.sql'),
      `
        CREATE TABLE productos (
          id INT NOT NULL,
          codigo VARCHAR(50),
          PRIMARY KEY (id),
          KEY idx_productos_codigo (codigo)
        );
      `,
    );

    const generatedFile = generateDatabaseIndexes(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('idx_clientes_email');
    expect(content).toContain('idx_productos_codigo');
    expect(content).toContain('clientes.sql');
    expect(content).toContain('productos.sql');
  });
});
