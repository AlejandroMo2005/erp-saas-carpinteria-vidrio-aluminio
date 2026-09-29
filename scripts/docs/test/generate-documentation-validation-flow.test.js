const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');
const {
  validateGeneratedDocumentation,
} = require('../validate-generated');

describe('flujo integrado de documentación', () => {
  test('genera y valida la documentación en una misma ejecución', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-validation-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-validation-test',
        version: '1.0.0',
      }),
    );

    generateDocumentation(rootDir);

    const result = validateGeneratedDocumentation(rootDir);

    expect(result.valid).toBe(true);
    expect(result.files).toBeGreaterThan(0);
  });
});
