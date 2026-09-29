const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateTestsReport,
} = require('../generators/generate-tests-report');

describe('generateTestsReport - casos adicionales', () => {
  test('genera un reporte cuando existen resultados de pruebas', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-tests-'),
    );

    const coverageDir = path.join(rootDir, 'coverage');
    fs.mkdirSync(coverageDir, { recursive: true });

    fs.writeFileSync(
      path.join(coverageDir, 'test-summary.json'),
      JSON.stringify({
        testFiles: 4,
        tests: 25,
        passed: 25,
        failed: 0,
      }),
    );

    const generatedFile = generateTestsReport(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('25');
    expect(content).toContain('4');
  });
});
