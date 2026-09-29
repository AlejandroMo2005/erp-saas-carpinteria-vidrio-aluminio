const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  getGeneratedFiles,
  verifyGeneratedDocumentation,
} = require('../verify-generated-clean');

describe('verifyGeneratedDocumentation', () => {
  let temporaryRoot;
  let generatedDirectory;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-clean-'),
    );

    generatedDirectory = path.join(
      temporaryRoot,
      'docs',
      'generated',
    );

    fs.mkdirSync(
      generatedDirectory,
      { recursive: true },
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('recopila archivos Markdown generados de forma recursiva', () => {
    const files = [
      'README.md',
      'api/endpoints.md',
      'database/schema.md',
      'quality/tests.md',
    ];

    for (const relativePath of files) {
      const filePath = path.join(
        generatedDirectory,
        relativePath,
      );

      fs.mkdirSync(
        path.dirname(filePath),
        { recursive: true },
      );

      fs.writeFileSync(
        filePath,
        `# ${relativePath}\n`,
        'utf8',
      );
    }

    expect(
      getGeneratedFiles(temporaryRoot),
    ).toEqual(
      files
        .map((file) => `docs/generated/${file}`)
        .sort(),
    );
  });

  it('devuelve una lista vacía cuando no existe el directorio generado', () => {
    fs.rmSync(
      generatedDirectory,
      {
        recursive: true,
        force: true,
      },
    );

    expect(
      getGeneratedFiles(temporaryRoot),
    ).toEqual([]);
  });

  it('detecta archivos generados incluidos entre los cambios', () => {
    const expectedChangedFiles = [
      'docs/generated/README.md',
      'docs/generated/api/endpoints.md',
    ];

    const result = verifyGeneratedDocumentation(
      temporaryRoot,
      expectedChangedFiles,
    );

    expect(result).toEqual({
      valid: true,
      changedFiles: [],
    });
  });

  it('identifica archivos generados modificados', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'README.md',
      ),
      '# Documentación\n',
      'utf8',
    );

    fs.mkdirSync(
      path.join(
        generatedDirectory,
        'api',
      ),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'api',
        'endpoints.md',
      ),
      '# Endpoints\n',
      'utf8',
    );

    const result = verifyGeneratedDocumentation(
      temporaryRoot,
      [
        'docs/generated/README.md',
        'docs/generated/api/endpoints.md',
      ],
    );

    expect(result).toEqual({
      valid: false,
      changedFiles: [
        'docs/generated/README.md',
        'docs/generated/api/endpoints.md',
      ],
    });
  });

  it('ignora cambios fuera de documentación generada', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'README.md',
      ),
      '# Documentación\n',
      'utf8',
    );

    const result = verifyGeneratedDocumentation(
      temporaryRoot,
      [
        'src/example.js',
        'package.json',
      ],
    );

    expect(result).toEqual({
      valid: true,
      changedFiles: [],
    });
  });
});
