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
      '# Evidencia de pruebas',
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

    expect(content.trim()).not.toBe('');
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
