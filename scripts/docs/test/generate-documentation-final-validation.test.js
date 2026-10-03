const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const {
  generateDocumentation,
} = require('../generators/generate-docs');
const {
  validateGeneratedDocumentation,
} = require('../validate-generated');
const {
  verifyGeneratedDocumentation,
} = require('../verify-generated-clean');

describe('flujo final de documentación', () => {
  test('la documentación generada puede validarse y verificarse como sincronizada', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-final-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-final-flow-test',
        version: '1.0.0',
      }),
    );

    generateDocumentation(rootDir);

    const validation = validateGeneratedDocumentation(
      rootDir,
    );

    execFileSync(
      'git',
      ['init'],
      { cwd: rootDir, stdio: 'ignore' },
    );

    execFileSync(
      'git',
      ['add', 'docs/generated'],
      { cwd: rootDir, stdio: 'ignore' },
    );

    execFileSync(
      'git',
      [
        '-c',
        'user.name=Docs Test',
        '-c',
        'user.email=docs-test@example.com',
        'commit',
        '-m',
        'test: seed generated documentation',
      ],
      { cwd: rootDir, stdio: 'ignore' },
    );

    const verification = verifyGeneratedDocumentation(
      rootDir,
    );

    expect(validation.valid).toBe(true);
    expect(validation.files).toBeGreaterThan(0);
    expect(verification.valid).toBe(true);
    expect(verification.changedFiles).toEqual([]);
  });
});
