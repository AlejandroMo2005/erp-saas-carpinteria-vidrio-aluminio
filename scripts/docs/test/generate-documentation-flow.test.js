const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('generateDocumentation - flujo completo', () => {
  test('genera todos los documentos definidos por el orquestador', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-flow-test',
        version: '1.0.0',
        dependencies: {
          express: '^5.0.0',
        },
      }),
    );

    const generatedFiles = generateDocumentation(rootDir);

    expect(generatedFiles.length).toBeGreaterThan(0);

    for (const filePath of generatedFiles) {
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf8');

      expect(content).toMatch(/^# /);
      expect(content).toContain(
        'generado automáticamente',
      );
    }
  });
});
