const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDependencies,
} = require('../generators/generate-dependencies');

describe('generateDependencies - casos adicionales', () => {
  test('genera documentación desde package.json con dependencias y devDependencies', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-dependencies-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          express: '^5.0.0',
          react: '^18.0.0',
        },
        devDependencies: {
          vitest: '^3.0.0',
          eslint: '^9.0.0',
        },
      }),
    );

    const generatedFile = generateDependencies(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('express');
    expect(content).toContain('react');
    expect(content).toContain('vitest');
    expect(content).toContain('eslint');
  });
});
