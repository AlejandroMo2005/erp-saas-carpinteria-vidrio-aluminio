const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentationManifest,
} = require('../generators/generate-documentation-manifest');

describe('orden del manifiesto documental', () => {
  let temporaryRoot;
  let generatedDirectory;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-manifest-order-'),
    );

    generatedDirectory = path.join(
      temporaryRoot,
      'docs',
      'generated',
    );

    fs.mkdirSync(
      path.join(
        generatedDirectory,
        'zeta',
      ),
      { recursive: true },
    );

    fs.mkdirSync(
      path.join(
        generatedDirectory,
        'alpha',
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

  it('ordena alfabéticamente los documentos del manifiesto', () => {
    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'zeta',
        'z.md',
      ),
      '# Z\n',
      'utf8',
    );

    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'alpha',
        'a.md',
      ),
      '# A\n',
      'utf8',
    );

    fs.writeFileSync(
      path.join(
        generatedDirectory,
        'alpha',
        'b.md',
      ),
      '# B\n',
      'utf8',
    );

    const filePath = generateDocumentationManifest(
      temporaryRoot,
    );

    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    const alphaIndex = content.indexOf(
      'alpha/a.md',
    );

    const betaIndex = content.indexOf(
      'alpha/b.md',
    );

    const zetaIndex = content.indexOf(
      'zeta/z.md',
    );

    expect(alphaIndex).toBeGreaterThan(-1);
    expect(betaIndex).toBeGreaterThan(-1);
    expect(zetaIndex).toBeGreaterThan(-1);

    expect(alphaIndex).toBeLessThan(
      betaIndex,
    );

    expect(betaIndex).toBeLessThan(
      zetaIndex,
    );
  });
});
