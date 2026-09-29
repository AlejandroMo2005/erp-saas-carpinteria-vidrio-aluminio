const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('flujo de regeneración de documentación', () => {
  test('regenerar la documentación mantiene la misma salida', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-regeneration-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-regeneration-test',
        version: '1.0.0',
      }),
    );

    generateDocumentation(rootDir);

    const firstOutput = new Map();

    for (const filePath of generateDocumentation(rootDir)) {
      firstOutput.set(
        path.relative(rootDir, filePath),
        fs.readFileSync(filePath, 'utf8'),
      );
    }

    generateDocumentation(rootDir);

    for (const [relativePath, content] of firstOutput) {
      expect(
        fs.readFileSync(
          path.join(rootDir, relativePath),
          'utf8',
        ),
      ).toBe(content);
    }
  });
});
