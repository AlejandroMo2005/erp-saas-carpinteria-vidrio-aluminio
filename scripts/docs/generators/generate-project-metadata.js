const fs = require('node:fs');
const path = require('node:path');

const {
  formatTable,
  formatList,
  formatCode,
} = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

function readProjectPackage(rootDir) {
  const packagePath = path.join(
    rootDir,
    'package.json',
  );

  return JSON.parse(
    fs.readFileSync(
      packagePath,
      'utf8',
    ),
  );
}

function formatScripts(scripts) {
  const entries = Object.entries(
    scripts || {},
  ).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  if (entries.length === 0) {
    return formatTable(
      ['Script', 'Comando'],
      [['—', '—']],
    );
  }

  return formatTable(
    ['Script', 'Comando'],
    entries.map(([name, command]) => [
      formatCode(name),
      formatCode(command),
    ]),
  );
}

function formatDependenciesList(
  dependencies,
) {
  const entries = Object.keys(
    dependencies || {},
  ).sort();

  if (entries.length === 0) {
    return '- No definidas.';
  }

  return formatList(
    entries.map(formatCode),
  );
}

function generateProjectMetadata(rootDir) {
  const packageJson =
    readProjectPackage(rootDir);

  const content = [
    '# Metadatos automáticos del proyecto',
    '',
    '## Proyecto',
    '',
    formatTable(
      ['Campo', 'Valor'],
      [
        [
          'Nombre',
          formatCode(
            packageJson.name ||
              'No definido',
          ),
        ],
        [
          'Versión',
          formatCode(
            packageJson.version ||
              'No definida',
          ),
        ],
        [
          'Node requerido',
          formatCode(
            packageJson.engines?.node ||
              'No definido',
          ),
        ],
        [
          'Gestor de paquetes',
          formatCode('npm'),
        ],
      ],
    ),
    '',
    '## Scripts',
    '',
    formatScripts(
      packageJson.scripts,
    ),
    '',
    '## Dependencias de producción',
    '',
    formatDependenciesList(
      packageJson.dependencies,
    ),
    '',
    '## Dependencias de desarrollo',
    '',
    formatDependenciesList(
      packageJson.devDependencies,
    ),
    '',
  ].join('\n');

  return writeGeneratedFile(
    rootDir,
    'docs/generated/project-metadata.md',
    content,
  );
}

module.exports = {
  readProjectPackage,
  formatScripts,
  formatDependenciesList,
  generateProjectMetadata,
};
