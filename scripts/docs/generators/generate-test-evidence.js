const fs = require('node:fs');
const path = require('node:path');

const {
  formatTable,
  formatCode,
} = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

const REPORT_PATHS = [
  'coverage/coverage-final.json',
  'backend/coverage/coverage-final.json',
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

function aggregateMetric(
  data,
  metric,
) {
  const metricConfig = {
    statement: {
      map: 'statementMap',
      counts: 's',
    },
    branch: {
      map: 'branchMap',
      counts: 'b',
    },
    function: {
      map: 'fnMap',
      counts: 'f',
    },
    line: {
      map: 'statementMap',
      counts: 's',
    },
  };

  const config = metricConfig[metric];

  if (!config) {
    return null;
  }

  const files = Object.values(data ?? {});
  let total = 0;
  let covered = 0;

  for (const file of files) {
    const counts = file?.[config.counts];

    if (!counts) {
      continue;
    }

    const keys = config.map
      ? Object.keys(file[config.map] ?? {})
      : Object.keys(counts);

    if (metric === 'line') {
      const lines = new Map();

      for (const key of keys) {
        const line = file.statementMap?.[key]?.start?.line;

        if (!line) {
          continue;
        }

        const count = counts[key] ?? 0;
        lines.set(
          line,
          (lines.get(line) ?? 0) + count,
        );
      }

      total += lines.size;
      covered += [...lines.values()].filter(
        (count) => count > 0,
      ).length;

      continue;
    }

    for (const key of keys) {
      const value = counts[key];

      if (Array.isArray(value)) {
        total += value.length;
        covered += value.filter(
          (count) => count > 0,
        ).length;
        continue;
      }

      total += 1;

      if (value > 0) {
        covered += 1;
      }
    }
  }

  if (total === 0) {
    return null;
  }

  return Number(
    ((covered / total) * 100).toFixed(2),
  );
}

function getCoverageValue(
  coverage,
  metric,
) {
  return aggregateMetric(
    coverage?.data,
    metric,
  );
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
                'statement',
              )}%`,
            ],
            [
              'Branches',
              `${getCoverageValue(
                coverage,
                'branch',
              )}%`,
            ],
            [
              'Functions',
              `${getCoverageValue(
                coverage,
                'function',
              )}%`,
            ],
            [
              'Lines',
              `${getCoverageValue(
                coverage,
                'line',
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
  aggregateMetric,
  getCoverageValue,
  generateTestEvidence,
};
