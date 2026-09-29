const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  generateDocumentation,
} = require('../generators/generate-docs');
const {
  validateGeneratedDocumentation,
} = require('../validate-generated');

describe('flujo completo de documentación', () => {
  test('genera y valida la documentación completa del proyecto', () => {
    const rootDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-complete-flow-'),
    );

    fs.writeFileSync(
      path.join(rootDir, 'package.json'),
      JSON.stringify({
        name: 'docs-complete-test',
        version: '1.0.0',
        dependencies: {
          express: '^5.0.0',
        },
        devDependencies: {
          vitest: '^3.0.0',
        },
      }),
    );

    fs.mkdirSync(
      path.join(rootDir, 'backend', 'routes'),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(rootDir, 'backend', 'routes', 'clientes.js'),
      'router.get("/clientes", handler);',
    );

    generateDocumentation(rootDir);

    const result = validateGeneratedDocumentation(rootDir);

    expect(result.valid).toBe(true);
    expect(result.files).toBeGreaterThan(0);

    for (const filePath of result.files
      ? fs.readdirSync(
          path.join(rootDir, 'docs', 'generated'),
          { recursive: true },
        )
      : []) {
      expect(filePath).toBeTruthy();
    }
  });
});
