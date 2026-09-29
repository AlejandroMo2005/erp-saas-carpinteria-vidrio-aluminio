const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateTestsReport,
} = require('../generators/generate-tests-report');

describe('generateTestsReport', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-tests-report-'),
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('genera el informe de pruebas', () => {
    const filePath = generateTestsReport(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Informe de pruebas',
    );
  });

  it('genera contenido cuando no existen resultados de pruebas previos', () => {
    const filePath = generateTestsReport(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content.trim()).not.toBe('');
  });

  it('incluye la marca de generación automática', () => {
    const filePath = generateTestsReport(
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
