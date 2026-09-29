const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  validateGeneratedConsistency,
} = require('../validate-generated-consistency');

describe('validateGeneratedConsistency', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-validation-'),
    );

    fs.mkdirSync(
      path.join(temporaryRoot, 'docs/generated'),
      { recursive: true },
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('valida correctamente documentación generada válida', () => {
    const filePath = path.join(
      temporaryRoot,
      'docs/generated/example.md',
    );

    fs.writeFileSync(
      filePath,
      '# Documento generado\n\n> Este archivo es generado automáticamente.\n',
    );

    const result = validateGeneratedConsistency(temporaryRoot);

    expect(result).toEqual({
      valid: true,
      files: 1,
    });
  });

  it('detecta archivos sin título de nivel 1', () => {
    const filePath = path.join(
      temporaryRoot,
      'docs/generated/example.md',
    );

    fs.writeFileSync(
      filePath,
      'Contenido\n\n> Este archivo es generado automáticamente.\n',
    );

    expect(() => validateGeneratedConsistency(temporaryRoot))
      .toThrow('falta un título Markdown de nivel 1.');
  });

  it('detecta archivos sin marca de generación automática', () => {
    const filePath = path.join(
      temporaryRoot,
      'docs/generated/example.md',
    );

    fs.writeFileSync(
      filePath,
      '# Documento generado\n\nContenido.\n',
    );

    expect(() => validateGeneratedConsistency(temporaryRoot))
      .toThrow('falta la marca de generación automática.');
  });

  it('devuelve cero archivos cuando no existe documentación generada', () => {
    fs.rmSync(
      path.join(temporaryRoot, 'docs/generated'),
      {
        recursive: true,
        force: true,
      },
    );

    const result = validateGeneratedConsistency(temporaryRoot);

    expect(result).toEqual({
      valid: true,
      files: 0,
    });
  });
});
