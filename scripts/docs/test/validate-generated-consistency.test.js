const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validateGeneratedConsistency,
} = require('../validate-generated-consistency');

describe('validateGeneratedConsistency', () => {
  let temporaryRoot;
  let generatedDirectory;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-consistency-'),
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

  it('valida documentación generada válida', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'README.md',
      ),
      '# Documentación\n\n> Este archivo es generado automáticamente.\n',
      'utf8',
    );

    const result = validateGeneratedConsistency(
      temporaryRoot,
    );

    expect(result).toEqual({
      valid: true,
      files: 1,
    });
  });

  it('detecta archivos sin título de nivel 1', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'README.md',
      ),
      'Contenido\n\n> Este archivo es generado automáticamente.\n',
      'utf8',
    );

    expect(() => {
      validateGeneratedConsistency(
        temporaryRoot,
      );
    }).toThrow(
      'falta un título Markdown de nivel 1.',
    );
  });

  it('detecta archivos sin marca de generación automática', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'README.md',
      ),
      '# Documentación\n\nContenido.\n',
      'utf8',
    );

    expect(() => {
      validateGeneratedConsistency(
        temporaryRoot,
      );
    }).toThrow(
      'falta la marca de generación automática.',
    );
  });

  it('valida archivos dentro de subdirectorios', () => {
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
        `# ${relativePath}\n\n> Este archivo es generado automáticamente.\n`,
        'utf8',
      );
    }

    const result = validateGeneratedConsistency(
      temporaryRoot,
    );

    expect(result).toEqual({
      valid: true,
      files: files.length,
    });
  });

  it('devuelve cero archivos cuando no existe documentación generada', () => {
    fs.rmSync(
      generatedDirectory,
      {
        recursive: true,
        force: true,
      },
    );

    const result = validateGeneratedConsistency(
      temporaryRoot,
    );

    expect(result).toEqual({
      valid: true,
      files: 0,
    });
  });
});
