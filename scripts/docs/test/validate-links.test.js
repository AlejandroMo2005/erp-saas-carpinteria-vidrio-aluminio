const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  extractMarkdownLinks,
  isExternalLink,
  resolveInternalLink,
  validateLinks,
} = require('../validate-links');

describe('validate-links', () => {
  let temporaryRoot;
  let generatedDirectory;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-links-'),
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

  it('extrae enlaces Markdown', () => {
    const links = extractMarkdownLinks(
      '# Documento\n\n[API](api/endpoints.md)\n[Guía](guide.md#inicio)',
    );

    expect(links).toEqual([
      'api/endpoints.md',
      'guide.md#inicio',
    ]);
  });

  it('identifica enlaces externos y anclas', () => {
    expect(
      isExternalLink('https://example.com'),
    ).toBe(true);

    expect(
      isExternalLink('http://example.com'),
    ).toBe(true);

    expect(
      isExternalLink('mailto:test@example.com'),
    ).toBe(true);

    expect(
      isExternalLink('#seccion'),
    ).toBe(true);

    expect(
      isExternalLink('database/schema.md'),
    ).toBe(false);
  });

  it('resuelve correctamente un enlace interno', () => {
    const filePath = path.join(
      generatedDirectory,
      'README.md',
    );

    const targetPath = resolveInternalLink(
      filePath,
      'database/schema.md',
    );

    expect(targetPath).toBe(
      path.join(
        generatedDirectory,
        'database',
        'schema.md',
      ),
    );
  });

  it('ignora fragmentos al resolver enlaces internos', () => {
    const filePath = path.join(
      generatedDirectory,
      'README.md',
    );

    const targetPath = resolveInternalLink(
      filePath,
      'database/schema.md#tablas',
    );

    expect(targetPath).toBe(
      path.join(
        generatedDirectory,
        'database',
        'schema.md',
      ),
    );
  });

  it('detecta enlaces internos inexistentes', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'README.md',
      ),
      '# Documentación\n\n[API](api/endpoints.md)\n',
      'utf8',
    );

    const errors = validateLinks(
      temporaryRoot,
    );

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(
      'api/endpoints.md',
    );
  });

  it('acepta enlaces internos existentes', () => {
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
      '# Documentación\n\n[API](api/endpoints.md)\n',
      'utf8',
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

    const errors = validateLinks(
      temporaryRoot,
    );

    expect(errors).toEqual([]);
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
      ].join('\n'),
      'utf8',
    );

    const errors = validateLinks(
      temporaryRoot,
    );

    expect(errors).toEqual([]);
  });
});
