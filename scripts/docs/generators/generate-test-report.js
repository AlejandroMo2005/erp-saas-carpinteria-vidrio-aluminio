const fs = require('node:fs');
const path = require('node:path');

const { writeGeneratedFile } = require('./write-file');

function findCoverageSummaries(rootDir) {
  const candidates = [
    {
      name: 'Frontend',
      path: path.join(rootDir, 'coverage', 'coverage-summary.json'),
    },
    {
      name: 'Backend',
      path: path.join(
        rootDir,
        'backend',
        'coverage',
        'coverage-summary.json',
      ),
    },
  ];

  return candidates
    .filter(({ path: filePath }) => fs.existsSync(filePath))
    .map(({ name, path: filePath }) => ({
      name,
      data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
    }));
}

function formatMetric(metric) {
  if (!metric || metric.pct === undefined) {
    return 'No disponible';
  }

  return `${metric.pct}%`;
}

function formatSummary(summary) {
  const total = summary.data.total;

  return `## ${summary.name}

| Métrica | Resultado |
|---|---:|
| Statements | ${formatMetric(total?.statements)} |
| Branches | ${formatMetric(total?.branches)} |
| Functions | ${formatMetric(total?.functions)} |
| Lines | ${formatMetric(total?.lines)} |
`;
}

function generateTestsReport(rootDir) {
  const summaries = findCoverageSummaries(rootDir);

  const content = `# Evidencia automática de pruebas

> Este archivo es generado automáticamente. No editar manualmente.

${summaries.length > 0
    ? summaries.map(formatSummary).join('\n')
    : 'No se encontraron reportes de cobertura disponibles.'}

## Fuente

La información se obtiene de los archivos \`coverage-summary.json\`
generados por Vitest.

La ausencia de un reporte no se interpreta como cobertura cero; indica
que todavía no existe evidencia de cobertura disponible para ese entorno.
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
