const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateTestEvidence,
} = require('../generators/generate-test-evidence');

describe('generateTestEvidence', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-test-evidence-'),
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  function writeCoverage() {
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

    fs.mkdirSync(
      path.join(temporaryRoot, 'coverage'),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'coverage',
        'coverage-final.json',
      ),
      JSON.stringify(coverage),
      'utf8',
    );
  }

  it('genera el documento de evidencia de pruebas', () => {
    const filePath = generateTestEvidence(
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

  it('calcula la cobertura desde coverage-final.json', () => {
    writeCoverage();

    const filePath = generateTestEvidence(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '`coverage/coverage-final.json`',
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
  });

  it('genera contenido cuando no existen artefactos de cobertura', () => {
    const filePath = generateTestEvidence(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'No se encontró un informe de cobertura disponible.',
    );
  });

  it('incluye la marca de generación automática', () => {
    const filePath = generateTestEvidence(
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
