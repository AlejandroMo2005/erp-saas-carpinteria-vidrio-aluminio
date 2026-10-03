const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDatabaseRelations,
} = require('../generators/generate-database-relations');

describe('generateDatabaseRelations - casos adicionales', () => {
  test('genera relaciones entre tablas definidas en una fuente SQL', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-relations-'),
    );

    const databaseDir = path.join(rootDir, 'database');
    fs.mkdirSync(databaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(databaseDir, 'schema.sql'),
      `
        CREATE TABLE clientes (
          id INT NOT NULL,
          PRIMARY KEY (id)
        );

        CREATE TABLE pedidos (
          id INT NOT NULL,
          cliente_id INT NOT NULL,
          CONSTRAINT fk_pedido_cliente
            FOREIGN KEY (cliente_id)
            REFERENCES clientes(id)
        );
      `,
    );

    const generatedFile = generateDatabaseRelations(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('clientes');
    expect(content).toContain('cliente_id');
    expect(content).toContain('fk_pedido_cliente');
  });
});
