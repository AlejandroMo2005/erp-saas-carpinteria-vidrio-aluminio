const fs = require('node:fs');
const path = require('node:path');

const {
  formatTable,
  formatCode,
} = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

const COVERAGE_SUMMARIES = [
  {
    name: 'Frontend',
    relativePath: 'coverage/coverage-summary.json',
  },
  {
    name: 'Backend',
    relativePath: 'backend/coverage/coverage-summary.json',
  },
];

function findCoverageSummaries(rootDir) {
  return COVERAGE_SUMMARIES
    .map(({ name, relativePath }) => ({
      name,
      relativePath,
      filePath: path.join(
        rootDir,
        relativePath,
      ),
    }))
    .filter(({ filePath }) =>
      fs.existsSync(filePath),
    )
    .map(({
      name,
      relativePath,
      filePath,
    }) => ({
      name,
      relativePath,
      data: JSON.parse(
        fs.readFileSync(
          filePath,
          'utf8',
        ),
      ),
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

  return [
    `## ${summary.name}`,
    '',
    `Fuente: ${formatCode(
      summary.relativePath,
    )}`,
    '',
    formatTable(
      ['Métrica', 'Resultado'],
      [
        [
          'Statements',
          formatMetric(total?.statements),
        ],
        [
          'Branches',
          formatMetric(total?.branches),
        ],
        [
          'Functions',
          formatMetric(total?.functions),
        ],
        [
          'Lines',
          formatMetric(total?.lines),
        ],
      ],
    ),
    '',
  ].join('\n');
}

function generateTestReport(rootDir) {
  const summaries =
    findCoverageSummaries(rootDir);

  const content = [
    '# Evidencia automática de pruebas',
    '',
    '> Este archivo es generado automáticamente. No editar manualmente.',
    '',
    summaries.length > 0
      ? summaries.map(formatSummary).join('\n')
      : 'No se encontraron reportes de cobertura disponibles.',
    '',
    '## Fuente',
    '',
    `La información se obtiene de los archivos ${formatCode(
      'coverage-summary.json',
    )} generados por Vitest.`,
    '',
    'La ausencia de un reporte no se interpreta como cobertura cero; indica que todavía no existe evidencia de cobertura disponible para ese entorno.',
    '',
  ].join('\n');

  return writeGeneratedFile(
    rootDir,
    'docs/generated/quality/tests.md',
    content,
  );
}

module.exports = {
  COVERAGE_SUMMARIES,
  findCoverageSummaries,
  formatMetric,
  formatSummary,
  generateTestReport,
};
