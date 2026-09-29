const fs = require('node:fs');
const path = require('node:path');

const { writeGeneratedFile } = require('./write-file');

function findCoverageSummary(rootDir) {
  const candidates = [
    path.join(rootDir, 'coverage', 'coverage-summary.json'),
    path.join(rootDir, 'backend', 'coverage', 'coverage-summary.json'),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  }

  return null;
}

function formatMetric(metric) {
  if (!metric) {
    return 'No disponible';
  }

  return `${metric.pct}%`;
}

function generateTestsReport(rootDir) {
  const coverage = findCoverageSummary(rootDir);

  const total = coverage?.total;

  const content = `# Evidencia automática de pruebas

> Este archivo es generado automáticamente. No editar manualmente.

## Cobertura

| Métrica | Resultado |
|---|---:|
| Statements | ${formatMetric(total?.statements)} |
| Branches | ${formatMetric(total?.branches)} |
| Functions | ${formatMetric(total?.functions)} |
| Lines | ${formatMetric(total?.lines)} |

## Fuente

La información se obtiene del resumen de cobertura generado por Vitest.

${
  coverage
    ? 'Se encontró un reporte de cobertura disponible en el repositorio.'
    : 'No se encontró un reporte de cobertura. Ejecute las pruebas con cobertura antes de generar esta sección.'
}
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/quality/tests.md',
    content,
  );
}

module.exports = {
  generateTestsReport,
};
