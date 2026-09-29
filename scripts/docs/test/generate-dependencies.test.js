const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDependencies,
} = require('../generators/generate-dependencies');

describe('generateDependencies', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-dependencies-'),
    );

    fs.writeFileSync(
      path.join(temporaryRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            express: '^5.0.0',
            react: '^18.3.1',
          },
          devDependencies: {
            vitest: '^3.2.7',
            eslint: '^9.0.0',
          },
        },
        null,
        2,
      ),
      'utf8',
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('genera el inventario de dependencias', () => {
    const filePath = generateDependencies(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'express',
    );

    expect(content).toContain(
      '^5.0.0',
    );

    expect(content).toContain(
      'react',
    );

    expect(content).toContain(
      'vitest',
    );

    expect(content).toContain(
      'eslint',
    );
  });

  it('distingue dependencias de desarrollo', () => {
    const filePath = generateDependencies(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'Dependencias de desarrollo',
    );
  });

  it('maneja un proyecto sin package.json', () => {
    fs.rmSync(
      path.join(
        temporaryRoot,
        'package.json',
      ),
    );

    const filePath = generateDependencies(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Dependencias',
    );
  });

  it('incluye la marca de generación automática', () => {
    const filePath = generateDependencies(
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
