const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('flujo integrado de evidencias documentales', () => {
  test('genera los documentos de evidencias aunque no existan resultados previos', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-evidence-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-evidence-flow-test',
        version: '1.0.0',
      }),
    );

    generateDocumentation(rootDir);

    const generatedDir = path.join(
      rootDir,
      'docs',
      'generated',
    );

    const testEvidence = fs.readFileSync(
      path.join(generatedDir, 'test-evidence.md'),
      'utf8',
    );

    const lintEvidence = fs.readFileSync(
      path.join(generatedDir, 'lint-evidence.md'),
      'utf8',
    );

    const testsReport = fs.readFileSync(
      path.join(generatedDir, 'tests-report.md'),
      'utf8',
    );

    expect(testEvidence).toMatch(/^# /);
    expect(lintEvidence).toMatch(/^# /);
    expect(testsReport).toMatch(/^# /);

    expect(testEvidence).toContain(
      'generado automáticamente',
    );
    expect(lintEvidence).toContain(
      'generado automáticamente',
    );
    expect(testsReport).toContain(
      'generado automáticamente',
    );
  });
});
