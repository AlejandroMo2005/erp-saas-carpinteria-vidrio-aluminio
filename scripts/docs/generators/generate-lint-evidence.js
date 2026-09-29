const fs = require('node:fs');
const path = require('node:path');

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
      absolutePath: path.join(rootDir, relativePath),
    }))
    .find((report) => fs.existsSync(report.absolutePath));
}

function generateLintEvidence(rootDir) {
  const report = findLintReport(rootDir);

  let summary = 'No se encontró un informe ESLint en el repositorio.';

  if (report) {
    try {
      const data = JSON.parse(
        fs.readFileSync(report.absolutePath, 'utf8'),
      );

      const files = data.length;
      const errors = data.reduce(
        (total, item) => total + (item.errorCount ?? 0),
        0,
      );
      const warnings = data.reduce(
        (total, item) => total + (item.warningCount ?? 0),
        0,
      );

      summary = `Fuente: \`${report.relativePath}\`

| Métrica | Resultado |
|---|---:|
| Archivos analizados | ${files} |
| Errores | ${errors} |
| Advertencias | ${warnings} |`;
    } catch {
      summary = `El informe \`${report.relativePath}\` existe, pero no pudo ser interpretado como JSON.`;
    }
  }

  const content = `# Evidencia automática de lint

> Este archivo es generado automáticamente. No editar manualmente.

## Resultado

${summary}

## Fuente

La evidencia se obtiene de un informe ESLint generado previamente. La ejecución del lint continúa siendo responsabilidad del pipeline de calidad.
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/quality/lint-evidence.md',
    content,
  );
}

module.exports = {
  generateLintEvidence,
};
