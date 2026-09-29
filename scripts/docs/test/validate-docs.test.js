const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validateDocumentation,
} = require('../validate-docs');

describe('validateDocumentation', () => {
  let temporaryRoot;
  let generatedDirectory;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-validation-links-'),
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

  it('valida documentación sin enlaces internos inválidos', () => {
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
        'README.md',
      ),
      [
        '# Documentación',
        '',
        '[API](api/endpoints.md)',
        '',
        '> Este archivo es generado automáticamente.',
        '',
      ].join('\n'),
      'utf8',
    );

    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'api',
        'endpoints.md',
      ),
      [
        '# Endpoints',
        '',
        '> Este archivo es generado automáticamente.',
        '',
      ].join('\n'),
      'utf8',
    );

    expect(
      validateDocumentation(temporaryRoot),
    ).toEqual([]);
  });

  it('detecta enlaces internos inexistentes', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'README.md',
      ),
      [
        '# Documentación',
        '',
        '[API](api/endpoints.md)',
        '',
        '> Este archivo es generado automáticamente.',
        '',
      ].join('\n'),
      'utf8',
    );

    const errors = validateDocumentation(
      temporaryRoot,
    );

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(
      'api/endpoints.md',
    );
  });

  it('ignora enlaces externos', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'README.md',
      ),
      [
        '# Documentación',
        '',
        '[Sitio](https://example.com)',
        '[Correo](mailto:test@example.com)',
        '[Sección](#inicio)',
        '',
        '> Este archivo es generado automáticamente.',
        '',
      ].join('\n'),
      'utf8',
    );

    expect(
      validateDocumentation(temporaryRoot),
    ).toEqual([]);
  });

  it('devuelve una lista vacía cuando no existe documentación generada', () => {
    fs.rmSync(
      generatedDirectory,
      {
        recursive: true,
        force: true,
      },
    );

    expect(
      validateDocumentation(temporaryRoot),
    ).toEqual([]);
  });
});
