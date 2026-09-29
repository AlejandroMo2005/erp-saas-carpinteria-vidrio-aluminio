const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('flujo integrado de artefactos documentales', () => {
  test('genera los artefactos principales de documentación', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-artifacts-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-artifacts-test',
        version: '1.0.0',
      }),
    );

    generateDocumentation(rootDir);

    const expectedFiles = [
      'docs/generated/README.md',
      'docs/generated/documentation-manifest.md',
      'docs/generated/api/catalog.md',
      'docs/generated/database/schema.md',
      'docs/generated/database/entities.md',
      'docs/generated/database/relations.md',
      'docs/generated/database/indexes.md',
      'docs/generated/database/programmability.md',
    ];

    for (const relativePath of expectedFiles) {
      const filePath = path.join(rootDir, relativePath);

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf8')).toMatch(/^# /);
    }
  });
});
