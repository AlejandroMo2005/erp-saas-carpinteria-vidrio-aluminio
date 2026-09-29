const fs = require('node:fs');
const path = require('node:path');

const { writeGeneratedFile } = require('./write-file');

const REPORT_PATHS = [
  'coverage/coverage-summary.json',
  'backend/coverage/coverage-summary.json',
];

function readCoverageSummary(rootDir) {
  for (const relativePath of REPORT_PATHS) {
    const filePath = path.join(rootDir, relativePath);

    if (fs.existsSync(filePath)) {
      try {
        return {
          path: relativePath,
          data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
        };
      } catch {
        return null;
      }
    }
  }

  return null;
}

function generateTestEvidence(rootDir) {
  const coverage = readCoverageSummary(rootDir);

  const content = `# Evidencia automática de pruebas

> Este archivo es generado automáticamente. No editar manualmente.

## Cobertura

${
  coverage
    ? `Fuente: \`${coverage.path}\`

| Métrica | Porcentaje |
|---|---:|
| Statements | ${coverage.data.total?.statements?.pct ?? 'N/D'}% |
| Branches | ${coverage.data.total?.branches?.pct ?? 'N/D'}% |
| Functions | ${coverage.data.total?.functions?.pct ?? 'N/D'}% |
| Lines | ${coverage.data.total?.lines?.pct ?? 'N/D'}% |`
    : 'No se encontró un informe de cobertura disponible.'
}

## Evidencia

La información anterior se obtiene de los artefactos de cobertura existentes en el repositorio. La ejecución de las pruebas y la generación de cobertura deben realizarse mediante los scripts definidos en el proyecto.
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/quality/test-evidence.md',
    content,
  );
}

module.exports = {
  generateTestEvidence,
};
