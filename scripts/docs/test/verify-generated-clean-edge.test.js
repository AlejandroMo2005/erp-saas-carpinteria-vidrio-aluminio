const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  verifyGeneratedDocumentation,
} = require('../verify-generated-clean');

describe('verifyGeneratedDocumentation - casos adicionales', () => {
  test('considera válida la documentación cuando no existen cambios pendientes', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-clean-'),
    );

    const generatedDir = path.join(
      rootDir,
      'docs',
      'generated',
    );

    fs.mkdirSync(generatedDir, { recursive: true });

    fs.writeFileSync(
      path.join(generatedDir, 'README.md'),
      '# Documentación\n',
    );

    const result = verifyGeneratedDocumentation(
      rootDir,
      [],
    );

    expect(result).toEqual({
      valid: true,
      changedFiles: [],
    });
  });
});
