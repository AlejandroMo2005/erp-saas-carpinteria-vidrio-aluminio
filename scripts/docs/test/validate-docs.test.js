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
        '> Este archivo es generado automáticamente. No editar manualmente.',
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
        '> Este archivo es generado automáticamente. No editar manualmente.',
        '',
      ].join('\n'),
      'utf8',
    );

    expect(
      validateDocumentation(temporaryRoot),
    ).toEqual({
      valid: true,
      files: 2,
    });
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
        '> Este archivo es generado automáticamente. No editar manualmente.',
        '',
      ].join('\n'),
      'utf8',
    );

    expect(() => {
      validateDocumentation(temporaryRoot);
    }).toThrow(
      'docs/generated/README.md -> api/endpoints.md',
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
        '> Este archivo es generado automáticamente. No editar manualmente.',
        '',
      ].join('\n'),
      'utf8',
    );

    expect(
      validateDocumentation(temporaryRoot),
    ).toEqual({
      valid: true,
      files: 1,
    });
  });

  it('rechaza cuando no existe documentación generada', () => {
    fs.rmSync(
      generatedDirectory,
      {
        recursive: true,
        force: true,
      },
    );

    expect(() => {
      validateDocumentation(temporaryRoot);
    }).toThrow(
      'No se encontraron archivos de documentación generada.',
    );
  });
});
