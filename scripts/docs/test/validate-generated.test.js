const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  validateGeneratedDocumentation,
} = require('../validate-generated');

const {
  GENERATED_MARKER,
} = require('../generators/write-file');

describe('validateGeneratedDocumentation', () => {
  let temporaryRoot;
  let generatedDirectory;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-validation-'),
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

  it('valida correctamente documentación generada válida', () => {
    fs.writeFileSync(
      path.join(generatedDirectory, 'README.md'),
      `# Documentación generada\n\n${GENERATED_MARKER}\n`,
      'utf8',
    );

    expect(() => {
      validateGeneratedDocumentation(temporaryRoot);
    }).not.toThrow();
  });

  it('detecta cuando no existen archivos de documentación generada', () => {
    fs.rmSync(generatedDirectory, {
      recursive: true,
      force: true,
    });

    expect(() => {
      validateGeneratedDocumentation(temporaryRoot);
    }).toThrow(
      'No se encontraron archivos de documentación generada.',
    );
  });

  it('detecta archivos de documentación vacíos', () => {
    fs.writeFileSync(
      path.join(generatedDirectory, 'README.md'),
      '',
      'utf8',
    );

    expect(() => {
      validateGeneratedDocumentation(temporaryRoot);
    }).toThrow(
      'docs/generated/README.md: el archivo de documentación está vacío.',
    );
  });

  it('detecta archivos sin título Markdown de nivel 1', () => {
    fs.writeFileSync(
      path.join(generatedDirectory, 'README.md'),
      'Contenido sin título.\n',
      'utf8',
    );

    expect(() => {
      validateGeneratedDocumentation(temporaryRoot);
    }).toThrow(
      'docs/generated/README.md: falta un título Markdown de nivel 1.',
    );
  });

  it('valida múltiples archivos Markdown generados', () => {
    fs.mkdirSync(
      path.join(generatedDirectory, 'api'),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(generatedDirectory, 'README.md'),
      `# Documentación\n\n${GENERATED_MARKER}\n`,
      'utf8',
    );

    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'api',
        'endpoints.md',
      ),
      `# Endpoints\n\n${GENERATED_MARKER}\n`,
      'utf8',
    );

    expect(() => {
      validateGeneratedDocumentation(temporaryRoot);
    }).not.toThrow();
  });
});
