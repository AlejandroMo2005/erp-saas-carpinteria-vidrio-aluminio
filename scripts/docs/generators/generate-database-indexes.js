const fs = require('node:fs');
const path = require('node:path');

const { collectDatabaseSources } = require('./collect-sql');
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
      /(?:PRIMARY\s+KEY|UNIQUE\s+(?:KEY|INDEX)|(?:KEY|INDEX))\s*(?:`([^`]+)`\s*)?\(([^)]+)\)/gi,
    );

    for (const indexMatch of indexMatches) {
      const type = indexMatch[0]
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join(' ');

      indexes.push({
        table: tableName,
        name: indexMatch[1] || 'PRIMARY',
        type,
        columns: indexMatch[2]
          .split(',')
          .map((column) => column.trim().replace(/`/g, ''))
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
    const content = fs.readFileSync(sourcePath, 'utf8');

    for (const index of extractIndexes(content)) {
      indexes.push({
        ...index,
        source: path.relative(rootDir, sourcePath).replaceAll(path.sep, '/'),
      });
    }
  }

  const lines = [
    '# Índices de base de datos',
    '',
    'Este archivo se genera automáticamente a partir de las fuentes SQL del proyecto.',
    '',
  ];

  if (indexes.length === 0) {
    lines.push('No se encontraron índices definidos en las fuentes SQL.');
  } else {
    lines.push('| Tabla | Índice | Tipo | Columnas | Fuente |');
    lines.push('|---|---|---|---|---|');

    for (const index of indexes) {
      lines.push(
        `| \`${index.table}\` | \`${index.name}\` | ${index.type} | ${index.columns.map((column) => `\`${column}\``).join(', ')} | \`${index.source}\` |`,
      );
    }
  }

  lines.push('');

  return writeGeneratedFile(
    rootDir,
    'docs/generated/database/indexes.md',
    lines.join('\n'),
  );
}

module.exports = {
  generateDatabaseIndexes,
};
