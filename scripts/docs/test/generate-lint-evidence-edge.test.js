const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateLintEvidence,
} = require('../generators/generate-lint-evidence');

describe('generateLintEvidence - casos adicionales', () => {
  test('genera documentación cuando no existe evidencia de lint', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-lint-'),
    );

    const generatedFile = generateLintEvidence(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('#');
    expect(content).toContain('generado automáticamente');
  });
});
