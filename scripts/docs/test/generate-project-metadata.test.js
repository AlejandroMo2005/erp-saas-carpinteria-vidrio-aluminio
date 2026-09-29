const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateProjectMetadata,
} = require('../generators/generate-project-metadata');

describe('generateProjectMetadata', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-metadata-'),
    );

    fs.writeFileSync(
      path.join(temporaryRoot, 'package.json'),
      JSON.stringify(
        {
          name: 'test-project',
          version: '1.0.0',
          private: true,
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

  it('genera los metadatos del proyecto', () => {
    const filePath = generateProjectMetadata(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'test-project',
    );

    expect(content).toContain(
      '1.0.0',
    );
  });

  it('incluye información de privacidad del proyecto', () => {
    const filePath = generateProjectMetadata(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'private',
    );
  });

  it('maneja un proyecto sin package.json', () => {
    fs.rmSync(
      path.join(
        temporaryRoot,
        'package.json',
      ),
    );

    const filePath = generateProjectMetadata(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      '# Metadatos del proyecto',
    );
  });

  it('incluye la marca de generación automática', () => {
    const filePath = generateProjectMetadata(
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
