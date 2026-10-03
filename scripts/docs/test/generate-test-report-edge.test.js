const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateTestReport,
} = require('../generators/generate-test-report');

describe('generateTestReport - casos adicionales', () => {
  test('genera un reporte cuando existen resultados de cobertura', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-tests-'),
    );

    const coverageDir = path.join(
      rootDir,
      'coverage',
    );

    fs.mkdirSync(
      coverageDir,
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(
        coverageDir,
        'coverage-final.json',
      ),
      JSON.stringify({
        '/project/src/example.js': {
          statementMap: {
            0: { start: { line: 1 } },
            1: { start: { line: 2 } },
          },
          s: {
            0: 1,
            1: 0,
          },
          branchMap: {
            0: {},
          },
          b: {
            0: [1, 0],
          },
          fnMap: {
            0: {},
            1: {},
          },
          f: {
            0: 1,
            1: 0,
          },
        },
      }),
      'utf8',
    );

    const generatedFile =
      generateTestReport(rootDir);

    const content = fs.readFileSync(
      generatedFile,
      'utf8',
    );

    expect(content).toContain(
      '50%',
    );

    expect(content).toContain(
      'coverage-final.json',
    );
  });
});
