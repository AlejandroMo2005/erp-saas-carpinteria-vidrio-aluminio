const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateProjectStructure,
} = require('../generators/generate-project-structure');

describe('generateProjectStructure - casos adicionales', () => {
  test('documenta una estructura con directorios y archivos anidados', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-structure-'),
    );

    fs.mkdirSync(
      path.join(rootDir, 'src', 'components'),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(rootDir, 'src', 'index.js'),
      'export default {};',
    );

    fs.writeFileSync(
      path.join(rootDir, 'src', 'components', 'Button.jsx'),
      'export default function Button() {}',
    );

    const generatedFile = generateProjectStructure(rootDir);
    const content = fs.readFileSync(generatedFile, 'utf8');

    expect(content).toContain('src');
    expect(content).toContain('index.js');
    expect(content).toContain('components');
    expect(content).toContain('Button.jsx');
  });
});
