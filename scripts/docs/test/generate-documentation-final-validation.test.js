const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');
const {
  validateGeneratedDocumentation,
} = require('../validate-generated');
const {
  verifyGeneratedDocumentation,
} = require('../verify-generated-clean');

describe('flujo final de documentación', () => {
  test('la documentación generada puede validarse y verificarse como sincronizada', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-final-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-final-flow-test',
        version: '1.0.0',
      }),
    );

    generateDocumentation(rootDir);

    const validation = validateGeneratedDocumentation(
      rootDir,
    );

    const verification = verifyGeneratedDocumentation(
      rootDir,
      [],
    );

    expect(validation.valid).toBe(true);
    expect(validation.files).toBeGreaterThan(0);
    expect(verification.valid).toBe(true);
    expect(verification.changedFiles).toEqual([]);
  });
});
