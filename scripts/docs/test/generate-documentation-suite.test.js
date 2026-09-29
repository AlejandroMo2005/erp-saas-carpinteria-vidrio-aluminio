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
  validateGeneratedConsistency,
} = require('../validate-generated-consistency');

const {
  validateLinks,
} = require('../validate-links');

describe('suite integrada de documentación', () => {
  test('genera y valida el conjunto completo de documentación', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-suite-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-suite-test',
        version: '1.0.0',
      }),
    );

    generateDocumentation(rootDir);

    const validation = validateGeneratedDocumentation(
      rootDir,
    );

    const consistency = validateGeneratedConsistency(
      rootDir,
    );

    const linkErrors = validateLinks(rootDir);

    expect(validation.valid).toBe(true);
    expect(validation.files).toBeGreaterThan(0);

    expect(consistency.valid).toBe(true);
    expect(consistency.files).toBe(validation.files);

    expect(linkErrors).toEqual([]);
  });
});
