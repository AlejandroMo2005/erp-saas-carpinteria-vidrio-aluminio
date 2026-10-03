const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('generación de documentación', () => {
  let tempDirectory;

  beforeEach(() => {
    tempDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-generator-'),
    );

    fs.mkdirSync(
      path.join(tempDirectory, 'backend', 'src', 'routes'),
      { recursive: true },
    );

    fs.mkdirSync(
      path.join(tempDirectory, 'database'),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(
        tempDirectory,
        'backend',
        'src',
        'routes',
        'example.js',
      ),
      "router.get('/example', handler);",
      'utf8',
    );

    fs.writeFileSync(
      path.join(tempDirectory, 'database', 'schema.sql'),
      `CREATE TABLE \`clientes\` (
  \`id\` INT NOT NULL,
  \`nombre\` VARCHAR(100) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uq_cliente_nombre\` (\`nombre\`)
);

CREATE TABLE \`proformas\` (
  \`id\` INT NOT NULL,
  \`cliente_id\` INT NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_proforma_cliente\` (\`cliente_id\`),
  CONSTRAINT \`fk_proforma_cliente\`
    FOREIGN KEY (\`cliente_id\`)
    REFERENCES \`clientes\` (\`id\`)
);

CREATE TRIGGER \`trg_cliente\`
BEFORE INSERT ON \`clientes\`
FOR EACH ROW
SET NEW.nombre = TRIM(NEW.nombre);

CREATE PROCEDURE \`sp_clientes\`()
BEGIN
  SELECT * FROM clientes;
END;
`,
      'utf8',
    );
  });

  afterEach(() => {
    fs.rmSync(tempDirectory, {
      recursive: true,
      force: true,
    });
  });

  it('genera los documentos esperados', () => {
    const generatedFiles = generateDocumentation(tempDirectory);

    expect(generatedFiles).toHaveLength(15);

    const expectedFiles = [
      'docs/generated/README.md',
      'docs/generated/api/endpoints.md',
      'docs/generated/architecture/project-structure.md',
      'docs/generated/database/schema.md',
      'docs/generated/database/entities.md',
      'docs/generated/database/relations.md',
      'docs/generated/database/indexes.md',
      'docs/generated/database/programability.md',
      'docs/generated/dependencies.md',
      'docs/generated/documentation-manifest.md',
      'docs/generated/project-metadata.md',
      'docs/generated/quality/lint-evidence.md',
      'docs/generated/quality/test-evidence.md',
      'docs/generated/quality/tests.md',
      'docs/generated/repository/git-info.md',
    ];

    for (const relativePath of expectedFiles) {
      expect(
        fs.existsSync(
          path.join(tempDirectory, relativePath),
        ),
      ).toBe(true);
    }
  });

  it('genera correctamente el esquema de base de datos', () => {
    generateDocumentation(tempDirectory);

    const schemaPath = path.join(
      tempDirectory,
      'docs',
      'generated',
      'database',
      'schema.md',
    );

    const content = fs.readFileSync(schemaPath, 'utf8');

    expect(content).toContain('clientes');
    expect(content).toContain('proformas');
    expect(content).toContain('trg_cliente');
    expect(content).toContain('sp_clientes');
  });

  it('genera las relaciones de base de datos', () => {
    generateDocumentation(tempDirectory);

    const relationsPath = path.join(
      tempDirectory,
      'docs',
      'generated',
      'database',
      'relations.md',
    );

    const content = fs.readFileSync(relationsPath, 'utf8');

    expect(content).toContain('fk_proforma_cliente');
    expect(content).toContain('clientes');
    expect(content).toContain('cliente_id');
  });

  it('genera las entidades y columnas de base de datos', () => {
    generateDocumentation(tempDirectory);

    const entitiesPath = path.join(
      tempDirectory,
      'docs',
      'generated',
      'database',
      'entities.md',
    );

    const content = fs.readFileSync(entitiesPath, 'utf8');

    expect(content).toContain('## clientes');
    expect(content).toContain('`id`');
    expect(content).toContain('`nombre`');
    expect(content).toContain('## proformas');
  });

  it('genera los índices de base de datos', () => {
    generateDocumentation(tempDirectory);

    const indexesPath = path.join(
      tempDirectory,
      'docs',
      'generated',
      'database',
      'indexes.md',
    );

    const content = fs.readFileSync(indexesPath, 'utf8');

    expect(content).toContain('PRIMARY');
    expect(content).toContain('uq_cliente_nombre');
    expect(content).toContain('idx_proforma_cliente');
  });

  it('genera el inventario de programabilidad', () => {
    generateDocumentation(tempDirectory);

    const programabilityPath = path.join(
      tempDirectory,
      'docs',
      'generated',
      'database',
      'programability.md',
    );

    const content = fs.readFileSync(programabilityPath, 'utf8');

    expect(content).toContain('trg_cliente');
    expect(content).toContain('sp_clientes');
  });

  it('genera el manifiesto de documentación', () => {
    generateDocumentation(tempDirectory);

    const manifestPath = path.join(
      tempDirectory,
      'docs',
      'generated',
      'documentation-manifest.md',
    );

    const content = fs.readFileSync(manifestPath, 'utf8');

    expect(content).toContain('database/schema.md');
    expect(content).toContain('database/entities.md');
    expect(content).toContain('database/relations.md');
  });

  it('mantiene estable el manifiesto al regenerar', () => {
    generateDocumentation(tempDirectory);

    const manifestPath = path.join(
      tempDirectory,
      'docs',
      'generated',
      'documentation-manifest.md',
    );

    const firstContent = fs.readFileSync(manifestPath, 'utf8');

    generateDocumentation(tempDirectory);

    const secondContent = fs.readFileSync(manifestPath, 'utf8');

    expect(secondContent).toBe(firstContent);
    expect(secondContent).not.toContain(
      'documentation-manifest.md](documentation-manifest.md)',
    );
  });
});
