const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const {
  getGitChangedFiles,
  verifyGeneratedDocumentation,
} = require('../verify-generated-clean');

describe('verifyGeneratedDocumentation', () => {
  let temporaryRoot;
  let generatedDirectory;

  function git(...args) {
    return execFileSync(
      'git',
      args,
      {
        cwd: temporaryRoot,
        encoding: 'utf8',
      },
    );
  }

  function writeFile(relativePath, content) {
    const filePath = path.join(
      temporaryRoot,
      relativePath,
    );

    fs.mkdirSync(
      path.dirname(filePath),
      { recursive: true },
    );

    fs.writeFileSync(
      filePath,
      content,
      'utf8',
    );
  }

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-clean-'),
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

    git('init', '-q');
    git('config', 'user.email', 'docs-test@example.com');
    git('config', 'user.name', 'Docs Test');

    writeFile(
      'docs/generated/README.md',
      '# Documentación\n',
    );

    writeFile(
      'docs/generated/api/endpoints.md',
      '# Endpoints\n',
    );

    writeFile(
      'src/example.js',
      'module.exports = {};\n',
    );

    git('add', '.');
    git('commit', '-qm', 'initial');
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('detecta un repositorio Git limpio', () => {
    expect(
      getGitChangedFiles(temporaryRoot),
    ).toEqual([]);

    expect(
      verifyGeneratedDocumentation(temporaryRoot),
    ).toEqual({
      valid: true,
      changedFiles: [],
    });
  });

  it('identifica archivos generados modificados', () => {
    writeFile(
      'docs/generated/README.md',
      '# Documentación modificada\n',
    );

    const result = verifyGeneratedDocumentation(
      temporaryRoot,
    );

    expect(result).toEqual({
      valid: false,
      changedFiles: [
        'docs/generated/README.md',
      ],
    });
  });

  it('ignora git-info.md por ser documentación dinámica', () => {
    writeFile(
      'docs/generated/repository/git-info.md',
      '# Información actualizada\\n',
    );

    expect(
      verifyGeneratedDocumentation(temporaryRoot),
    ).toEqual({
      valid: true,
      changedFiles: [],
    });
  });

  it('detecta archivos generados no trackeados', () => {
    writeFile(
      'docs/generated/new.md',
      '# Nuevo\n',
    );

    const result = verifyGeneratedDocumentation(
      temporaryRoot,
    );

    expect(result).toEqual({
      valid: false,
      changedFiles: [
        'docs/generated/new.md',
      ],
    });
  });

  it('ignora cambios fuera de documentación generada', () => {
    writeFile(
      'src/example.js',
      'module.exports = { changed: true };\n',
    );

    expect(
      verifyGeneratedDocumentation(temporaryRoot),
    ).toEqual({
      valid: true,
      changedFiles: [],
    });
  });
});
