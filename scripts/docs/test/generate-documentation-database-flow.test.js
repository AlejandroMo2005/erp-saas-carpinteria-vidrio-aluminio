const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('flujo integrado de documentación de base de datos', () => {
  test('integra los artefactos de base de datos a partir de una fuente SQL', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-database-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-database-flow-test',
        version: '1.0.0',
      }),
    );

    const databaseDir = path.join(rootDir, 'database');
    fs.mkdirSync(databaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(databaseDir, 'schema.sql'),
      `
        CREATE TABLE \`clientes\` (
          \`id\` INT NOT NULL,
          \`nombre\` VARCHAR(100) NOT NULL,
          PRIMARY KEY (id)
        );

        CREATE TABLE \`pedidos\` (
          \`id\` INT NOT NULL,
          \`cliente_id\` INT NOT NULL,
          PRIMARY KEY (id),
          CONSTRAINT \`fk_pedido_cliente\`
            FOREIGN KEY (\`cliente_id\`)
            REFERENCES \`clientes\`(\`id\`)
        );
      `,
    );

    generateDocumentation(rootDir);

    const generatedDir = path.join(
      rootDir,
      'docs',
      'generated',
      'database',
    );

    const schema = fs.readFileSync(
      path.join(generatedDir, 'schema.md'),
      'utf8',
    );

    const entities = fs.readFileSync(
      path.join(generatedDir, 'entities.md'),
      'utf8',
    );

    const relations = fs.readFileSync(
      path.join(generatedDir, 'relations.md'),
      'utf8',
    );

    expect(schema).toContain('clientes');
    expect(entities).toContain('pedidos');
    expect(relations).toContain('fk_pedido_cliente');
  });
});
