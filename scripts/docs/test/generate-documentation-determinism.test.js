const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('determinismo de documentación', () => {
  test('dos generaciones consecutivas producen la misma salida', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-determinism-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-determinism-test',
        version: '1.0.0',
      }),
    );

    const firstFiles = generateDocumentation(rootDir);
    const firstOutput = new Map();

    for (const filePath of firstFiles) {
      firstOutput.set(
        path.relative(rootDir, filePath),
        fs.readFileSync(filePath, 'utf8'),
      );
    }

    const secondFiles = generateDocumentation(rootDir);

    expect(
      secondFiles.map((filePath) =>
        path.relative(rootDir, filePath),
      ),
    ).toEqual([...firstOutput.keys()]);

    for (const filePath of secondFiles) {
      const relativePath = path.relative(
        rootDir,
        filePath,
      );

      expect(
        fs.readFileSync(filePath, 'utf8'),
      ).toBe(firstOutput.get(relativePath));
    }
  });
});
