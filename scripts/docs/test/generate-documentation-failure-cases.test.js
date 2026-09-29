const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validateGeneratedDocumentation,
} = require('../validate-generated');

describe('casos de fallo de documentación', () => {
  test('rechaza un archivo sin título Markdown válido', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-failure-'),
    );

    const generatedDir = path.join(
      rootDir,
      'docs',
      'generated',
    );

    fs.mkdirSync(generatedDir, { recursive: true });

    fs.writeFileSync(
      path.join(generatedDir, 'invalid.md'),
      [
        'Contenido sin título',
        '',
        '> Este archivo es generado automáticamente. No editar manualmente.',
      ].join('\n'),
    );

    expect(() => {
      validateGeneratedDocumentation(rootDir);
    }).toThrow(
      'El archivo no contiene un título Markdown válido',
    );
  });

  test('rechaza documentación sin marca de generación automática', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-failure-'),
    );

    const generatedDir = path.join(
      rootDir,
      'docs',
      'generated',
    );

    fs.mkdirSync(generatedDir, { recursive: true });

    fs.writeFileSync(
      path.join(generatedDir, 'manual.md'),
      '# Documento manual\n\nContenido.',
    );

    expect(() => {
      validateGeneratedDocumentation(rootDir);
    }).toThrow(
      'La documentación generada no cumple las reglas de consistencia',
    );
  });
});
