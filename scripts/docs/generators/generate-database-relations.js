const fs = require('node:fs');
const path = require('node:path');

const { collectDatabaseSources } = require('./collect-sql');
const {
  formatTable,
  formatCode,
} = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

function extractRelations(content) {
  const relations = [];

  const foreignKeyPattern =
    /CONSTRAINT\s+`?([^`\s]+)`?\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+`?([^`\s(]+)`?\s*\(([^)]+)\)/gi;

  for (const match of content.matchAll(
    foreignKeyPattern,
  )) {
    relations.push({
      constraint: match[1],
      columns: match[2]
        .trim()
        .replaceAll('`', ''),
      referencedTable: match[3]
        .trim()
        .replaceAll('`', ''),
      referencedColumns: match[4]
        .trim()
        .replaceAll('`', ''),
    });
  }

  return relations;
}

function collectDatabaseRelations(rootDir) {
  const sources = collectDatabaseSources(rootDir);
  const relations = [];

  for (const source of sources) {
    const content = fs.readFileSync(
      source,
      'utf8',
    );

    const sourcePath = path.relative(
      rootDir,
      source,
    ).replaceAll(path.sep, '/');

    for (const relation of extractRelations(
      content,
    )) {
      relations.push({
        ...relation,
        source: sourcePath,
      });
    }
  }

  return relations;
}

function uniqueRelations(relations) {
  return [
    ...new Map(
      relations.map((relation) => [
        [
          relation.constraint,
          relation.source,
          relation.columns,
          relation.referencedTable,
          relation.referencedColumns,
        ].join(':'),
        relation,
      ]),
    ).values(),
  ].sort((a, b) => {
    const constraintComparison =
      a.constraint.localeCompare(
        b.constraint,
      );

    if (constraintComparison !== 0) {
      return constraintComparison;
    }

    return a.source.localeCompare(
      b.source,
    );
  });
}

function generateDatabaseRelations(rootDir) {
  const relations = uniqueRelations(
    collectDatabaseRelations(rootDir),
  );

  const rows = relations.map((relation) => [
    formatCode(relation.constraint),
    formatCode(relation.columns),
    formatCode(relation.referencedTable),
    formatCode(relation.referencedColumns),
    formatCode(relation.source),
  ]);

  const lines = [
    '# Relaciones automáticas de base de datos',
    '',
    formatTable(
      [
        'Restricción',
        'Columna',
        'Tabla referenciada',
        'Columna referenciada',
        'Fuente',
      ],
      rows.length > 0
        ? rows
        : [['—', '—', '—', '—', '—']],
    ),
    '',
    '## Resumen',
    '',
    `- Relaciones detectadas: ${relations.length}`,
    '',
  ];

  return writeGeneratedFile(
    rootDir,
    'docs/generated/database/relations.md',
    lines.join('\n'),
  );
}

module.exports = {
  extractRelations,
  collectDatabaseRelations,
  uniqueRelations,
  generateDatabaseRelations,
};
