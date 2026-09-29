const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validateGeneratedConsistency,
} = require('../validate-generated-consistency');

describe('validateGeneratedConsistency - casos adicionales', () => {
  test('rechaza documentos sin marca de generación automática', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-consistency-'),
    );

    const generatedDir = path.join(
      rootDir,
      'docs',
      'generated',
    );

    fs.mkdirSync(generatedDir, { recursive: true });

    fs.writeFileSync(
      path.join(generatedDir, 'manual.md'),
      '# Documento\n\nContenido manual.',
    );

    expect(() => {
      validateGeneratedConsistency(rootDir);
    }).toThrow('falta la marca de generación automática');
  });
});
