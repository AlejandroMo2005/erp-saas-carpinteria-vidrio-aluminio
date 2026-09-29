const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  GENERATED_MARKER,
  ensureGeneratedMarker,
  writeGeneratedFile,
} = require('../generators/write-file');

describe('writeGeneratedFile - casos adicionales', () => {
  test('no duplica la marca cuando el contenido ya la contiene', () => {
    const content = `# Documento\n\n${GENERATED_MARKER}`;

    expect(ensureGeneratedMarker(content)).toBe(content);
  });

  test('crea automáticamente directorios anidados', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-write-'),
    );

    const generatedFile = writeGeneratedFile(
      rootDir,
      'docs/generated/api/catalog.md',
      '# API',
    );

    expect(fs.existsSync(generatedFile)).toBe(true);
    expect(fs.readFileSync(generatedFile, 'utf8')).toContain(
      'generado automáticamente',
    );
  });
});
