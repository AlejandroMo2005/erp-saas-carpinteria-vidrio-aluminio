const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateTestEvidence,
} = require('../generators/generate-test-evidence');

describe('generateTestEvidence - casos adicionales', () => {
  test('genera documentación cuando no existe evidencia de pruebas', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-test-evidence-'),
    );

    const generatedFile = generateTestEvidence(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('#');
    expect(content).toContain('generado automáticamente');
  });
});
