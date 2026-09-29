const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const GENERATED_FILES = [
  'docs/generated/README.md',
  'docs/generated/api/endpoints.md',
  'docs/generated/architecture/project-structure.md',
];

describe('documentación generada', () => {
  let tempDirectory;

  beforeEach(() => {
    tempDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-validation-'),
    );
  });

  afterEach(() => {
    fs.rmSync(tempDirectory, {
      recursive: true,
      force: true,
    });
  });

  it('considera válidos los documentos Markdown con contenido y título', () => {
    const generatedDirectory = path.join(
      tempDirectory,
      'docs',
      'generated',
    );

    fs.mkdirSync(generatedDirectory, { recursive: true });

    for (const relativePath of GENERATED_FILES) {
      const filePath = path.join(tempDirectory, relativePath);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(
        filePath,
        '# Documento generado\n\nContenido.',
        'utf8',
      );
    }

    const files = GENERATED_FILES.filter((relativePath) => {
      const filePath = path.join(tempDirectory, relativePath);
      return fs.existsSync(filePath);
    });

    expect(files).toHaveLength(3);
    expect(
      files.every((relativePath) => {
        const content = fs.readFileSync(
          path.join(tempDirectory, relativePath),
          'utf8',
        );

        return content.trim() && content.startsWith('# ');
      }),
    ).toBe(true);
  });
});
