const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validateLinks,
} = require('../validate-links');

describe('validateLinks - casos adicionales', () => {
  test('ignora enlaces externos y enlaces de anclaje', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-links-'),
    );

    const generatedDir = path.join(
      rootDir,
      'docs',
      'generated',
    );

    fs.mkdirSync(generatedDir, { recursive: true });

    fs.writeFileSync(
      path.join(generatedDir, 'README.md'),
      [
        '# Documentación',
        '',
        '[Sitio externo](https://example.com)',
        '[Correo](mailto:test@example.com)',
        '[Sección](#documentacion)',
      ].join('\n'),
    );

    expect(validateLinks(rootDir)).toEqual([]);
  });
});
