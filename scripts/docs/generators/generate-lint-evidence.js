const fs = require('node:fs');
const path = require('node:path');

const {
  formatTable,
  formatCode,
} = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

const REPORT_PATHS = [
  'reports/lint.json',
  'eslint-report.json',
  'lint-report.json',
];

function findLintReport(rootDir) {
  return REPORT_PATHS
    .map((relativePath) => ({
      relativePath,
      absolutePath: path.join(
        rootDir,
        relativePath,
      ),
    }))
    .find((report) =>
      fs.existsSync(report.absolutePath),
    );
}

function readLintReport(report) {
  try {
    return JSON.parse(
      fs.readFileSync(
        report.absolutePath,
        'utf8',
      ),
    );
  } catch {
    return null;
  }
}

function calculateLintMetrics(data) {
  if (!Array.isArray(data)) {
    return null;
  }

  return {
    files: data.length,
    errors: data.reduce(
      (total, item) =>
        total + (item.errorCount ?? 0),
      0,
    ),
    warnings: data.reduce(
      (total, item) =>
        total + (item.warningCount ?? 0),
      0,
    ),
  };
}

function formatLintSummary(
  report,
  metrics,
) {
  return [
    `Fuente: ${formatCode(
      report.relativePath,
    )}`,
    '',
    formatTable(
      ['Métrica', 'Resultado'],
      [
        [
          'Archivos analizados',
          metrics.files,
        ],
        [
          'Errores',
          metrics.errors,
        ],
        [
          'Advertencias',
          metrics.warnings,
        ],
      ],
    ),
  ].join('\n');
}

function generateLintEvidence(rootDir) {
  const report = findLintReport(rootDir);

  let summary =
    'No se encontró un informe ESLint en el repositorio.';

  if (report) {
    const data = readLintReport(report);
    const metrics = calculateLintMetrics(data);

    if (metrics) {
      summary = formatLintSummary(
        report,
        metrics,
      );
    } else {
      summary = [
        `El informe ${formatCode(
          report.relativePath,
        )} existe, pero no pudo ser interpretado como JSON.`,
      ].join('\n');
    }
  }

  const content = [
    '# Evidencia automática de lint',
    '',
    '## Resultado',
    '',
    summary,
    '',
    '## Fuente',
    '',
    'La evidencia se obtiene de un informe ESLint generado previamente. La ejecución del lint continúa siendo responsabilidad del pipeline de calidad.',
    '',
  ].join('\n');

  return writeGeneratedFile(
    rootDir,
    'docs/generated/quality/lint-evidence.md',
    content,
  );
}

module.exports = {
  REPORT_PATHS,
  findLintReport,
  readLintReport,
  calculateLintMetrics,
  formatLintSummary,
  generateLintEvidence,
};
