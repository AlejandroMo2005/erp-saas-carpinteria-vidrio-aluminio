const fs = require('node:fs');
const path = require('node:path');

const { collectDatabaseSources } = require('./collect-sql');
const {
  formatTable,
  formatCode,
} = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

function extractObjects(content, pattern) {
  return [
    ...content.matchAll(pattern),
  ].map((match) => match[1]);
}

function collectDatabaseSchema(rootDir) {
  const sources = collectDatabaseSources(rootDir);
  const tables = [];
  const triggers = [];
  const procedures = [];

  for (const source of sources) {
    const content = fs.readFileSync(
      source,
      'utf8',
    );

    const relativePath = path.relative(
      rootDir,
      source,
    ).replaceAll(path.sep, '/');

    for (const name of extractObjects(
      content,
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`([^`]+)`/gi,
    )) {
      tables.push({
        name,
        source: relativePath,
      });
    }

    for (const name of extractObjects(
      content,
      /CREATE\s+TRIGGER\s+`?([A-Za-z0-9_]+)`?/gi,
    )) {
      triggers.push({
        name,
        source: relativePath,
      });
    }

    for (const name of extractObjects(
      content,
      /CREATE\s+PROCEDURE\s+`?([A-Za-z0-9_]+)`?/gi,
    )) {
      procedures.push({
        name,
        source: relativePath,
      });
    }
  }

  return {
    sources,
    tables,
    triggers,
    procedures,
  };
}

function uniqueObjects(items) {
  return [
    ...new Map(
      items.map((item) => [
        `${item.name}:${item.source}`,
        item,
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

function formatObjectTable(
  headers,
  items,
) {
  const rows = items.length > 0
    ? items.map((item) => [
        formatCode(item.name),
        formatCode(item.source),
      ])
    : [['—', '—']];

  return formatTable(
    headers,
    rows,
  );
}

function generateDatabaseSchema(rootDir) {
  const {
    sources,
    tables,
    triggers,
    procedures,
  } = collectDatabaseSchema(rootDir);

  const uniqueTables = uniqueObjects(tables);
  const uniqueTriggers = uniqueObjects(
    triggers,
  );
  const uniqueProcedures = uniqueObjects(
    procedures,
  );

  const sourceRows = sources.length > 0
    ? sources
        .map((source) => [
          formatCode(
            path.relative(
              rootDir,
              source,
            ).replaceAll(path.sep, '/'),
          ),
        ])
    : [['—']];

  const lines = [
    '# Esquema automático de base de datos',
    '',
    '## Fuentes SQL',
    '',
    formatTable(
      ['Archivo'],
      sourceRows,
    ),
    '',
    '## Tablas detectadas',
    '',
    formatObjectTable(
      ['Tabla', 'Fuente'],
      uniqueTables,
    ),
    '',
    '## Triggers detectados',
    '',
    formatObjectTable(
      ['Trigger', 'Fuente'],
      uniqueTriggers,
    ),
    '',
    '## Procedimientos almacenados detectados',
    '',
    formatObjectTable(
      ['Procedimiento', 'Fuente'],
      uniqueProcedures,
    ),
    '',
    '## Resumen',
    '',
    `- Fuentes SQL: ${sources.length}`,
    `- Tablas: ${uniqueTables.length}`,
    `- Triggers: ${uniqueTriggers.length}`,
    `- Procedimientos: ${uniqueProcedures.length}`,
    '',
  ];

  return writeGeneratedFile(
    rootDir,
    'docs/generated/database/schema.md',
    lines.join('\n'),
  );
}

module.exports = {
  extractObjects,
  collectDatabaseSchema,
  uniqueObjects,
  generateDatabaseSchema,
};
