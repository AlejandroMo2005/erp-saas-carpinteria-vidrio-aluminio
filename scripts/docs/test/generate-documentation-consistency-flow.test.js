const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');
const {
  validateGeneratedConsistency,
} = require('../validate-generated-consistency');

describe('flujo integrado de consistencia documental', () => {
  test('la documentación generada cumple las reglas de consistencia', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-consistency-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-consistency-test',
        version: '1.0.0',
      }),
    );

    generateDocumentation(rootDir);

    const result = validateGeneratedConsistency(rootDir);

    expect(result.valid).toBe(true);
    expect(result.files).toBeGreaterThan(0);
  });
});
