const fs = require('node:fs');
const path = require('node:path');

const { collectDatabaseSources } = require('./collect-sql');
const { formatTable, formatCode } = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

function extractObjects(content, patterns) {
  const objects = [];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      objects.push(match[1]);
    }
  }

  return [...new Set(objects)];
}

function collectDatabaseObjects(rootDir) {
  const sources = collectDatabaseSources(rootDir);
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
      [
        /CREATE\s+(?:DEFINER\s*=\s*[^\s]+\s+)?TRIGGER\s+`?([A-Za-z0-9_]+)`?/gi,
      ],
    )) {
      triggers.push({
        name,
        source: relativePath,
      });
    }

    for (const name of extractObjects(
      content,
      [
        /CREATE\s+(?:DEFINER\s*=\s*[^\s]+\s+)?PROCEDURE\s+`?([A-Za-z0-9_]+)`?/gi,
      ],
    )) {
      procedures.push({
        name,
        source: relativePath,
      });
    }
  }

  return {
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

    return a.source.localeCompare(b.source);
  });
}

function formatObjectTable(
  headers,
  objects,
) {
  if (objects.length === 0) {
    return formatTable(
      headers,
      [['—', '—']],
    );
  }

  return formatTable(
    headers,
    objects.map((object) => [
      formatCode(object.name),
      formatCode(object.source),
    ]),
  );
}

function generateDatabaseProgrammability(rootDir) {
  const {
    triggers,
    procedures,
  } = collectDatabaseObjects(rootDir);

  const uniqueTriggers = uniqueObjects(
    triggers,
  );

  const uniqueProcedures = uniqueObjects(
    procedures,
  );

  const lines = [
    '# Programabilidad automática de base de datos',
    '',
    '## Triggers',
    '',
    formatObjectTable(
      ['Trigger', 'Fuente'],
      uniqueTriggers,
    ),
    '',
    '## Procedimientos almacenados',
    '',
    formatObjectTable(
      ['Procedimiento', 'Fuente'],
      uniqueProcedures,
    ),
    '',
    '## Resumen',
    '',
    `- Triggers detectados: ${uniqueTriggers.length}`,
    `- Procedimientos detectados: ${uniqueProcedures.length}`,
    '',
  ];

  return writeGeneratedFile(
    rootDir,
    'docs/generated/database/programability.md',
    lines.join('\n'),
  );
}

module.exports = {
  extractObjects,
  collectDatabaseObjects,
  uniqueObjects,
  generateDatabaseProgrammability,
};
