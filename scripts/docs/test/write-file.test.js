const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  GENERATED_MARKER,
  ensureGeneratedMarker,
  writeGeneratedFile,
} = require('../generators/write-file');

describe('writeGeneratedFile', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-writer-'),
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('añade la marca de generación automática', () => {
    const content = ensureGeneratedMarker(
      '# Documento\n\nContenido.',
    );

    expect(content).toContain(GENERATED_MARKER.trim());
  });

  it('no duplica la marca de generación automática', () => {
    const content = ensureGeneratedMarker(
      `# Documento\n\n${GENERATED_MARKER}`,
    );

    expect(
      content.match(/generado automáticamente/g),
    ).toHaveLength(1);
  });

  it('preserva el contenido generado', () => {
    const content = ensureGeneratedMarker(
      '# Documento\n\nContenido importante.',
    );

    expect(content).toContain('# Documento');
    expect(content).toContain('Contenido importante.');
  });

  it('crea directorios y escribe el archivo generado', () => {
    const filePath = writeGeneratedFile(
      temporaryRoot,
      'docs/generated/database/schema.md',
      '# Esquema\n\nContenido.',
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toContain('# Esquema');
    expect(content).toContain('Contenido.');
    expect(content).toContain(
      'generado automáticamente',
    );
  });
});
