const fs = require('node:fs');
const path = require('node:path');

const { collectDatabaseSources } = require('./collect-sql');
const {
  formatTable,
  formatCode,
} = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

function extractTableBlocks(content) {
  return [
    ...content.matchAll(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`([^`]+)`\s*\(([\s\S]*?)\)\s*(?:ENGINE|;)/gi,
    ),
  ].map((match) => ({
    name: match[1],
    body: match[2],
  }));
}

function extractColumns(body) {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) =>
      /^`[^`]+`\s+/u.test(line),
    )
    .map((line) => {
      const match = line.match(
        /^`([^`]+)`\s+(.+?)(?:,)?$/u,
      );

      return match
        ? {
            name: match[1],
            definition: match[2],
          }
        : null;
    })
    .filter(Boolean);
}

function collectDatabaseEntities(rootDir) {
  const sources = collectDatabaseSources(rootDir);
  const tables = [];

  for (const source of sources) {
    const content = fs.readFileSync(
      source,
      'utf8',
    );

    const relativePath = path.relative(
      rootDir,
      source,
    ).replaceAll(path.sep, '/');

    for (const table of extractTableBlocks(
      content,
    )) {
      tables.push({
        ...table,
        source: relativePath,
        columns: extractColumns(table.body),
      });
    }
  }

  return tables;
}

function uniqueTables(tables) {
  return [
    ...new Map(
      tables.map((table) => [
        `${table.name}:${table.source}`,
        table,
      ]),
    ).values(),
  ].sort((a, b) => {
    const nameComparison =
      a.name.localeCompare(b.name);

    if (nameComparison !== 0) {
      return nameComparison;
    }

    return a.source.localeCompare(
      b.source,
    );
  });
}

function formatColumns(columns) {
  if (columns.length === 0) {
    return formatTable(
      ['Columna', 'Definición'],
      [['—', '—']],
    );
  }

  return formatTable(
    ['Columna', 'Definición'],
    columns.map((column) => [
      formatCode(column.name),
      formatCode(column.definition),
    ]),
  );
}

function generateDatabaseEntities(rootDir) {
  const tables = uniqueTables(
    collectDatabaseEntities(rootDir),
  );

  const sections = tables.length > 0
    ? tables.map((table) => [
        `## ${table.name}`,
        '',
        `**Fuente:** ${formatCode(table.source)}`,
        '',
        formatColumns(table.columns),
        '',
      ].join('\n')).join('\n')
    : 'No se detectaron tablas en las fuentes SQL.\n';

  const content = [
    '# Entidades automáticas de base de datos',
    '',
    sections,
  ].join('\n');

  return writeGeneratedFile(
    rootDir,
    'docs/generated/database/entities.md',
    content,
  );
}

module.exports = {
  extractTableBlocks,
  extractColumns,
  collectDatabaseEntities,
  uniqueTables,
  generateDatabaseEntities,
};
