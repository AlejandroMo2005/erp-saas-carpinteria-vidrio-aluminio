const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('flujo integrado de documentación del proyecto', () => {
  test('integra metadatos, dependencias y estructura del proyecto', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-project-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-project-flow-test',
        version: '1.0.0',
        description: 'Proyecto de prueba',
        dependencies: {
          express: '^5.0.0',
        },
        devDependencies: {
          vitest: '^3.0.0',
        },
      }),
    );

    fs.mkdirSync(
      path.join(rootDir, 'src', 'components'),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(rootDir, 'src', 'index.js'),
      'export default {};',
    );

    generateDocumentation(rootDir);

    const generatedDir = path.join(
      rootDir,
      'docs',
      'generated',
    );

    const metadata = fs.readFileSync(
      path.join(generatedDir, 'project-metadata.md'),
      'utf8',
    );

    const dependencies = fs.readFileSync(
      path.join(generatedDir, 'dependencies.md'),
      'utf8',
    );

    const structure = fs.readFileSync(
      path.join(generatedDir, 'architecture', 'project-structure.md'),
      'utf8',
    );

    expect(metadata).toContain('docs-project-flow-test');
    expect(dependencies).toContain('express');
    expect(dependencies).toContain('vitest');
    expect(structure).toContain('src');
  });
});
