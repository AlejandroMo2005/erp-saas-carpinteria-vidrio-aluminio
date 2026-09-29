const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentationManifest,
} = require('../generators/generate-documentation-manifest');

describe('generateDocumentationManifest - casos adicionales', () => {
  test('genera un manifiesto cuando no existen documentos previos', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-manifest-'),
    );

    const generatedFile = generateDocumentationManifest(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain(
      '# Índice de documentación generada',
    );
    expect(content).toContain(
      'Este archivo se genera automáticamente',
    );
  });
});
