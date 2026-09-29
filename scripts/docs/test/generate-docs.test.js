const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');

describe('generación de documentación', () => {
  let tempDirectory;

  beforeEach(() => {
    tempDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-generator-'),
    );

    fs.mkdirSync(
      path.join(tempDirectory, 'backend', 'src', 'routes'),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(
        tempDirectory,
        'backend',
        'src',
        'routes',
        'example.js',
      ),
      "router.get('/example', handler);",
      'utf8',
    );
  });

  afterEach(() => {
    fs.rmSync(tempDirectory, {
      recursive: true,
      force: true,
    });
  });

  it('genera los documentos esperados', () => {
    const generatedFiles = generateDocumentation(tempDirectory);

    expect(generatedFiles).toHaveLength(3);

    expect(
      fs.existsSync(
        path.join(
          tempDirectory,
          'docs',
          'generated',
          'README.md',
        ),
      ),
    ).toBe(true);

    expect(
      fs.existsSync(
        path.join(
          tempDirectory,
          'docs',
          'generated',
          'api',
          'endpoints.md',
        ),
      ),
    ).toBe(true);

    expect(
      fs.existsSync(
        path.join(
          tempDirectory,
          'docs',
          'generated',
          'architecture',
          'project-structure.md',
        ),
      ),
    ).toBe(true);
  });
});
