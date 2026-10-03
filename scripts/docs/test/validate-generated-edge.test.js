const fs = require('node:fs');
const osPath = require('node:os');
const path = require('node:path');

const {
  validateGeneratedDocumentation,
} = require('../validate-generated');

describe('validateGeneratedDocumentation - casos adicionales', () => {
  test('rechaza un documento generado vacío', () => {
    const rootDir = fs.mkdtempSync(
      path.join(osPath.tmpdir(), 'docs-validate-'),
    );

    const generatedDir = path.join(
      rootDir,
      'docs',
      'generated',
    );

    fs.mkdirSync(generatedDir, { recursive: true });

    fs.writeFileSync(
      path.join(generatedDir, 'empty.md'),
      '',
    );

    expect(() => {
      validateGeneratedDocumentation(rootDir);
    }).toThrow('docs/generated/empty.md: el archivo de documentación está vacío.');
  });
});
