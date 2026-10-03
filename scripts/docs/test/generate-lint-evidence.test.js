const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateLintEvidence,
} = require('../generators/generate-lint-evidence');

describe('generateLintEvidence', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-lint-evidence-'),
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('genera el documento de evidencia de lint', () => {
    const filePath = generateLintEvidence(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Evidencia automática de lint',
    );
  });

  it('genera contenido cuando no existen resultados previos de lint', () => {
    const filePath = generateLintEvidence(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content.trim()).not.toBe('');
  });

  it('incluye la marca de generación automática', () => {
    const filePath = generateLintEvidence(
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
