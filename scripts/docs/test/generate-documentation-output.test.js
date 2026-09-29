const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('generateDocumentation - salida generada', () => {
  test('mantiene la salida generada dentro de docs/generated', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-output-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-output-test',
        version: '1.0.0',
      }),
    );

    const generatedFiles = generateDocumentation(rootDir);
    const generatedDirectory = path.join(
      rootDir,
      'docs',
      'generated',
    );

    for (const filePath of generatedFiles) {
      expect(
        path.relative(generatedDirectory, filePath),
      ).not.toMatch(/^\.\.(\/|\\)/);
    }
  });
});
