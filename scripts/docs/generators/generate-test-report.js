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
    relativePath: 'coverage/coverage-final.json',
  },
  {
    name: 'Backend',
    relativePath: 'backend/coverage/coverage-final.json',
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

function formatMetric(
  value,
) {
  if (value === null || value === undefined) {
    return 'No disponible';
  }

  return `${value}%`;
}

function formatSummary(summary) {
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
          formatMetric(
            aggregateMetric(
              summary.data,
              'statement',
            ),
          ),
        ],
        [
          'Branches',
          formatMetric(
            aggregateMetric(
              summary.data,
              'branch',
            ),
          ),
        ],
        [
          'Functions',
          formatMetric(
            aggregateMetric(
              summary.data,
              'function',
            ),
          ),
        ],
        [
          'Lines',
          formatMetric(
            aggregateMetric(
              summary.data,
              'line',
            ),
          ),
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
    summaries.length > 0
      ? summaries.map(formatSummary).join('\n')
      : 'No se encontraron reportes de cobertura disponibles.',
    '',
    '## Fuente',
    '',
    `La información se obtiene de los archivos ${formatCode(
      'coverage-final.json',
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
  aggregateMetric,
  formatMetric,
  formatSummary,
  generateTestReport,
};
