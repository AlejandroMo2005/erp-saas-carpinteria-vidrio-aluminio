const fs = require('node:fs');
const path = require('node:path');

const {
  formatTable,
  formatCode,
} = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

const REPORT_PATHS = [
  'coverage/coverage-summary.json',
  'backend/coverage/coverage-summary.json',
];

function readCoverageSummary(rootDir) {
  for (const relativePath of REPORT_PATHS) {
    const filePath = path.join(
      rootDir,
      relativePath,
    );

    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      return {
        path: relativePath,
        data: JSON.parse(
          fs.readFileSync(
            filePath,
            'utf8',
          ),
        ),
      };
    } catch {
      return null;
    }
  }

  return null;
}

function getCoverageValue(
  coverage,
  metric,
) {
  return coverage?.data?.total?.[metric]?.pct ??
    'N/D';
}

function generateTestEvidence(rootDir) {
  const coverage =
    readCoverageSummary(rootDir);

  const coverageContent = coverage
    ? [
        `Fuente: ${formatCode(
          coverage.path,
        )}`,
        '',
        formatTable(
          ['Métrica', 'Porcentaje'],
          [
            [
              'Statements',
              `${getCoverageValue(
                coverage,
                'statements',
              )}%`,
            ],
            [
              'Branches',
              `${getCoverageValue(
                coverage,
                'branches',
              )}%`,
            ],
            [
              'Functions',
              `${getCoverageValue(
                coverage,
                'functions',
              )}%`,
            ],
            [
              'Lines',
              `${getCoverageValue(
                coverage,
                'lines',
              )}%`,
            ],
          ],
        ),
      ].join('\n')
    : 'No se encontró un informe de cobertura disponible.';

  const content = [
    '# Evidencia automática de pruebas',
    '',
    '## Cobertura',
    '',
    coverageContent,
    '',
    '## Evidencia',
    '',
    'La información anterior se obtiene de los artefactos de cobertura existentes en el repositorio. La ejecución de las pruebas y la generación de cobertura deben realizarse mediante los scripts definidos en el proyecto.',
    '',
  ].join('\n');

  return writeGeneratedFile(
    rootDir,
    'docs/generated/quality/test-evidence.md',
    content,
  );
}

module.exports = {
  REPORT_PATHS,
  readCoverageSummary,
  getCoverageValue,
  generateTestEvidence,
};
