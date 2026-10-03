const fs = require('node:fs');
const path = require('node:path');

const { collectDatabaseSources } = require('./collect-sql');
const { formatTable, formatCode } = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

function extractIndexes(content) {
  const indexes = [];

  const tableMatches = content.matchAll(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z0-9_]+)`?\s*\(([\s\S]*?)\)\s*(?:ENGINE|;)/gi,
  );

  for (const tableMatch of tableMatches) {
    const tableName = tableMatch[1];
    const tableDefinition = tableMatch[2];

    const indexMatches = tableDefinition.matchAll(
      /(?:PRIMARY\s+KEY|UNIQUE\s+(?:KEY|INDEX)|(?:KEY|INDEX))\s*(?:`([^`]+)`|([A-Za-z0-9_]+))?\s*\(([^)]+)\)/gi,
    );

    for (const indexMatch of indexMatches) {
      const declaration = indexMatch[0]
        .trim()
        .toUpperCase();

      let type = 'INDEX';

      if (declaration.startsWith('PRIMARY KEY')) {
        type = 'PRIMARY KEY';
      } else if (
        declaration.startsWith('UNIQUE KEY') ||
        declaration.startsWith('UNIQUE INDEX')
      ) {
        type = 'UNIQUE';
      }

      indexes.push({
        table: tableName,
        name: indexMatch[1] || indexMatch[2] || 'PRIMARY',
        type,
        columns: indexMatch[3]
          .split(',')
          .map((column) =>
            column
              .trim()
              .replace(/`/g, ''),
          )
          .filter(Boolean),
      });
    }
  }

  return indexes;
}

function generateDatabaseIndexes(rootDir) {
  const sources = collectDatabaseSources(rootDir);
  const indexes = [];

  for (const sourcePath of sources) {
    const content = fs.readFileSync(
      sourcePath,
      'utf8',
    );

    for (const index of extractIndexes(content)) {
      indexes.push({
        ...index,
        source: path.relative(
          rootDir,
          sourcePath,
        ).replaceAll(path.sep, '/'),
      });
    }
  }

  indexes.sort((a, b) => {
    const tableComparison =
      a.table.localeCompare(b.table);

    if (tableComparison !== 0) {
      return tableComparison;
    }

    const nameComparison =
      a.name.localeCompare(b.name);

    if (nameComparison !== 0) {
      return nameComparison;
    }

    return a.source.localeCompare(b.source);
  });

  const lines = [
    '# Índices de base de datos',
    '',
    'Este archivo se genera automáticamente a partir de las fuentes SQL del proyecto.',
    '',
  ];

  if (indexes.length === 0) {
    lines.push(
      'No se encontraron índices definidos en las fuentes SQL.',
    );
  } else {
    lines.push(
      formatTable(
        [
          'Tabla',
          'Índice',
          'Tipo',
          'Columnas',
          'Fuente',
        ],
        indexes.map((index) => [
          formatCode(index.table),
          formatCode(index.name),
          index.type,
          index.columns
            .map(formatCode)
            .join(', '),
          formatCode(index.source),
        ]),
      ),
    );
  }

  lines.push('');

  return writeGeneratedFile(
    rootDir,
    'docs/generated/database/indexes.md',
    lines.join('\n'),
  );
}

module.exports = {
  extractIndexes,
  generateDatabaseIndexes,
};
