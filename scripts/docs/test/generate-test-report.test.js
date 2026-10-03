const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateTestReport,
} = require('../generators/generate-test-report');

describe('generateTestReport', () => {
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

  function writeCoverage(
    relativePath,
  ) {
    const coverage = {
      '/project/src/example.js': {
        statementMap: {
          0: { start: { line: 1 } },
          1: { start: { line: 2 } },
          2: { start: { line: 3 } },
          3: { start: { line: 4 } },
        },
        s: {
          0: 1,
          1: 0,
          2: 1,
          3: 0,
        },
        branchMap: {
          0: {},
          1: {},
        },
        b: {
          0: [1, 0],
          1: [1, 1],
        },
        fnMap: {
          0: {},
          1: {},
        },
        f: {
          0: 1,
          1: 0,
        },
        l: {
          1: 1,
          2: 0,
          3: 1,
          4: 0,
        },
        inputSourceMap: null,
      },
    };

    const filePath = path.join(
      temporaryRoot,
      relativePath,
    );

    fs.mkdirSync(
      path.dirname(filePath),
      { recursive: true },
    );

    fs.writeFileSync(
      filePath,
      JSON.stringify(coverage),
      'utf8',
    );
  }

  it('genera el informe de pruebas', () => {
    const filePath = generateTestReport(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Evidencia automática de pruebas',
    );
  });

  it('calcula la cobertura frontend desde coverage-final.json', () => {
    writeCoverage(
      'coverage/coverage-final.json',
    );

    const filePath = generateTestReport(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '## Frontend',
    );
    expect(content).toContain(
      '| Statements | 50% |',
    );
    expect(content).toContain(
      '| Branches | 75% |',
    );
    expect(content).toContain(
      '| Functions | 50% |',
    );
    expect(content).toContain(
      '| Lines | 50% |',
    );
    expect(content).toContain(
      '`coverage/coverage-final.json`',
    );
  });

  it('genera contenido cuando no existen resultados de pruebas previos', () => {
    const filePath = generateTestReport(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'No se encontraron reportes de cobertura disponibles.',
    );
  });

  it('incluye la marca de generación automática', () => {
    const filePath = generateTestReport(
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
