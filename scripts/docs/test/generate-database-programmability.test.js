const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDatabaseProgrammability,
} = require('../generators/generate-database-programmability');

describe('generateDatabaseProgrammability', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-programmability-'),
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

  it('genera inventario de triggers y procedimientos', () => {
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

    const filePath = generateDatabaseProgrammability(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

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

    expect(content).toContain(
      'TRIGGER',
    );

    expect(content).toContain(
      'PROCEDURE',
    );
  });

  it('incluye la fuente de los objetos de programabilidad', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'programmability.sql',
      ),
      `
        CREATE TRIGGER \`trg_cliente\`
        BEFORE INSERT ON \`clientes\`
        FOR EACH ROW
        SET NEW.id = NEW.id;
      `,
      'utf8',
    );

    const filePath = generateDatabaseProgrammability(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'programmability.sql',
    );
  });

  it('maneja proyectos sin objetos de programabilidad', () => {
    const filePath = generateDatabaseProgrammability(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Programabilidad de base de datos',
    );

    expect(content).toContain(
      'No se encontraron triggers ni procedimientos',
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
        CREATE TRIGGER \`trg_cliente\`
        BEFORE INSERT ON \`clientes\`
        FOR EACH ROW
        SET NEW.id = NEW.id;
      `,
      'utf8',
    );

    const filePath = generateDatabaseProgrammability(
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
