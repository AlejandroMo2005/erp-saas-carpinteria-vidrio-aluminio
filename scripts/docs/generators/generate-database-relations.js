const fs = require('node:fs');
const path = require('node:path');

const { collectDatabaseSources } = require('./collect-sql');
const { writeGeneratedFile } = require('./write-file');

function extractRelations(content) {
  const relations = [];

  const foreignKeyPattern =
    /CONSTRAINT\s+`?([^`\s]+)`?\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+`?([^`\s(]+)`?\s*\(([^)]+)\)/gi;

  for (const match of content.matchAll(foreignKeyPattern)) {
    relations.push({
      constraint: match[1],
      columns: match[2].trim().replaceAll('`', ''),
      referencedTable: match[3].trim().replaceAll('`', ''),
      referencedColumns: match[4].trim().replaceAll('`', ''),
    });
  }

  return relations;
}

function generateDatabaseRelations(rootDir) {
  const sources = collectDatabaseSources(rootDir);
  const relations = [];

  for (const source of sources) {
    const content = fs.readFileSync(source, 'utf8');

    for (const relation of extractRelations(content)) {
      relations.push({
        ...relation,
        source: path.relative(rootDir, source).replaceAll(path.sep, '/'),
      });
    }
  }

  const uniqueRelations = [
    ...new Map(
      relations.map((relation) => [
        `${relation.constraint}:${relation.source}`,
        relation,
      ]),
    ).values(),
  ];

  const rows = uniqueRelations.length
    ? uniqueRelations
        .map(
          (relation) =>
            `| \`${relation.constraint}\` | \`${relation.columns}\` | \`${relation.referencedTable}\` | \`${relation.referencedColumns}\` | \`${relation.source}\` |`,
        )
        .join('\n')
    : '| — | — | — | — | — |';

  const content = `# Relaciones automáticas de base de datos

> Este archivo es generado automáticamente. No editar manualmente.

| Restricción | Columna | Tabla referenciada | Columna referenciada | Fuente |
|---|---|---|---|---|
${rows}

## Resumen

- Relaciones detectadas: ${uniqueRelations.length}
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/database/relations.md',
    content,
  );
}

module.exports = {
  generateDatabaseRelations,
};
