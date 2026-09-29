const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDatabaseProgrammability,
} = require('../generators/generate-database-programmability');

describe('generateDatabaseProgrammability - casos adicionales', () => {
  test('detecta procedimientos, funciones, triggers y eventos', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-programmability-'),
    );

    const databaseDir = path.join(rootDir, 'database');
    fs.mkdirSync(databaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(databaseDir, 'programmability.sql'),
      `
        CREATE PROCEDURE actualizar_stock()
        BEGIN
          SELECT 1;
        END;

        CREATE FUNCTION calcular_total()
        RETURNS DECIMAL(10,2)
        RETURN 1.00;

        CREATE TRIGGER actualizar_fecha
        BEFORE INSERT ON productos
        FOR EACH ROW
        SET NEW.fecha = NOW();

        CREATE EVENT limpiar_datos
        ON SCHEDULE EVERY 1 DAY
        DO
          SELECT 1;
      `,
    );

    const generatedFile = generateDatabaseProgrammability(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('actualizar_stock');
    expect(content).toContain('calcular_total');
    expect(content).toContain('actualizar_fecha');
    expect(content).toContain('limpiar_datos');
  });
});
