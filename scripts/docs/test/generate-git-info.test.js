const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateGitInfo,
} = require('../generators/generate-git-info');

describe('generateGitInfo', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-git-'),
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('genera el documento de información del repositorio', () => {
    const filePath = generateGitInfo(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Información automática del repositorio',
    );
  });

  it('genera contenido incluso cuando el directorio no es un repositorio Git', () => {
    const filePath = generateGitInfo(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content.trim()).not.toBe('');
  });

  it('incluye la marca de generación automática', () => {
    const filePath = generateGitInfo(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'generado automáticamente',
    );
  });
});
