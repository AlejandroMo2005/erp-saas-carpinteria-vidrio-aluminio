const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');
const {
  validateLinks,
} = require('../validate-links');

describe('flujo integrado de enlaces documentales', () => {
  test('la documentación generada mantiene sus enlaces internos válidos', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-links-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-links-test',
        version: '1.0.0',
      }),
    );

    generateDocumentation(rootDir);

    expect(validateLinks(rootDir)).toEqual([]);
  });
});
