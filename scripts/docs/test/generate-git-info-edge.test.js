const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateGitInfo,
} = require('../generators/generate-git-info');

describe('generateGitInfo - casos adicionales', () => {
  test('genera documentación aunque el directorio no tenga información Git', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-git-'),
    );

    const generatedFile = generateGitInfo(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('#');
    expect(content).toContain('generado automáticamente');
  });
});
