const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateProjectMetadata,
} = require('../generators/generate-project-metadata');

describe('generateProjectMetadata - casos adicionales', () => {
  test('genera metadatos desde un package.json válido', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-metadata-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'erp-test',
        version: '2.5.0',
        description: 'Proyecto de prueba',
        private: true,
      }),
    );

    const generatedFile = generateProjectMetadata(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('erp-test');
    expect(content).toContain('2.5.0');
  });
});
