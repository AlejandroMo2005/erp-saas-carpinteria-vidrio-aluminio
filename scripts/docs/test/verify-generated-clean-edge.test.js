const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  verifyGeneratedDocumentation,
} = require('../verify-generated-clean');

describe('verifyGeneratedDocumentation - casos adicionales', () => {
  test('considera válida la documentación cuando no existen cambios pendientes', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-clean-'),
    );

    const generatedDir = path.join(
      rootDir,
      'docs',
      'generated',
    );

    fs.mkdirSync(generatedDir, { recursive: true });

    fs.writeFileSync(
      path.join(generatedDir, 'README.md'),
      '# Documentación\n',
    );

    require('node:child_process').execFileSync(
      'git',
      ['init'],
      { cwd: rootDir, stdio: 'ignore' },
    );

    require('node:child_process').execFileSync(
      'git',
      ['add', 'docs/generated/README.md'],
      { cwd: rootDir, stdio: 'ignore' },
    );

    require('node:child_process').execFileSync(
      'git',
      [
        '-c',
        'user.name=Docs Test',
        '-c',
        'user.email=docs-test@example.com',
        'commit',
        '-m',
        'test: seed generated docs',
      ],
      { cwd: rootDir, stdio: 'ignore' },
    );

    const result = verifyGeneratedDocumentation(rootDir);

    expect(result).toEqual({
      valid: true,
      changedFiles: [],
    });
  });
});
