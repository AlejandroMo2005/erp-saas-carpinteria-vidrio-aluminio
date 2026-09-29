const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('flujo integrado de índices documentales', () => {
  test('el índice y el manifiesto incluyen los documentos generados', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-index-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-index-flow-test',
        version: '1.0.0',
      }),
    );

    generateDocumentation(rootDir);

    const indexPath = path.join(
      rootDir,
      'docs',
      'generated',
      'README.md',
    );

    const manifestPath = path.join(
      rootDir,
      'docs',
      'generated',
      'documentation-manifest.md',
    );

    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');

    expect(indexContent).toContain(
      'Documentación generada',
    );
    expect(manifestContent).toContain(
      'Índice de documentación generada',
    );
    expect(indexContent).toContain(
      'documentation-manifest.md',
    );
  });
});
