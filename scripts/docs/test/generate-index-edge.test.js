const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateIndex,
} = require('../generators/generate-index');

describe('generateIndex - casos adicionales', () => {
  test('genera un índice cuando no existen documentos previos', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-index-'),
    );

    const generatedFile = generateIndex(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('# Documentación generada');
    expect(content).toContain(
      'No existen documentos generados disponibles.',
    );
  });
});
