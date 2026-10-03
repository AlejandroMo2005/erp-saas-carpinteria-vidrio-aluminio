const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateProjectStructure,
} = require('../generators/generate-project-structure');

describe('generateProjectStructure', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-structure-'),
    );

    fs.mkdirSync(
      path.join(
        temporaryRoot,
        'src',
        'components',
      ),
      { recursive: true },
    );

    fs.mkdirSync(
      path.join(
        temporaryRoot,
        'src',
        'services',
      ),
      { recursive: true },
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('genera la estructura del proyecto', () => {
    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'src',
        'components',
        'Button.jsx',
      ),
      'export default function Button() {}',
      'utf8',
    );

    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'src',
        'services',
        'api.js',
      ),
      'export const api = {};',
      'utf8',
    );

    const filePath = generateProjectStructure(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    expect(content).toContain(
      'src/',
    );

    expect(content).toContain(
      'components',
    );


  });

  it('maneja un proyecto sin archivos adicionales', () => {
    const filePath = generateProjectStructure(
      temporaryRoot,
    );

    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

      expect(content).toContain(
        '# Estructura automática del proyecto',
      );
  });

  it('incluye la marca de generación automática', () => {
    const filePath = generateProjectStructure(
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
