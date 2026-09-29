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

    fs.mkdirSync(generatedDirectory, {
      recursive: true,
    });
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('detecta los archivos Markdown generados', () => {
    fs.writeFileSync(
      path.join(generatedDirectory, 'README.md'),
      '# Documentación\n',
      'utf8',
    );

    fs.mkdirSync(
      path.join(generatedDirectory, 'api'),
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

    const files = getGeneratedFiles(
      temporaryRoot,
    );

    expect(files).toEqual([
      'docs/generated/README.md',
      'docs/generated/api/endpoints.md',
    ]);
  });

  it('detecta correctamente un conjunto sin cambios', () => {
    const result = verifyGeneratedDocumentation(
      temporaryRoot,
      [
        'docs/generated/README.md',
      ],
    );

    expect(result).toEqual({
      valid: true,
      changedFiles: [],
    });
  });

  it('detecta archivos generados modificados', () => {
    const result = verifyGeneratedDocumentation(
      temporaryRoot,
      [
        'docs/generated/README.md',
        'docs/generated/api/endpoints.md',
      ],
    );

    expect(result.valid).toBe(false);
    expect(result.changedFiles).toEqual([
      'docs/generated/README.md',
      'docs/generated/api/endpoints.md',
    ]);
  });
});
