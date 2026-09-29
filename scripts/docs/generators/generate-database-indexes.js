const fs = require('node:fs');
const path = require('node:path');

const { collectDatabaseSources } = require('./collect-sql');
const { writeGeneratedFile } = require('./write-file');

function extractIndexes(content) {
  const indexes = [];

  const pattern =
    /(?:KEY|INDEX)\s+`([^`]+)`\s*\(([^)]+)\)/gi;

  for (const match of content.matchAll(pattern)) {
    indexes.push({
      name: match[1],
      columns: match[2].trim().replaceAll('`', ''),
    });
  }

  return indexes;
}

function generateDatabaseIndexes(rootDir) {
  const sources = collectDatabaseSources(rootDir);
  const indexes = [];

  for (const source of sources) {
    const content = fs.readFileSync(source, 'utf8');
    const relativePath = path.relative(rootDir, source).replaceAll(path.sep, '/');

    for (const index of extractIndexes(content)) {
      indexes.push({
        ...index,
        source: relativePath,
      });
    }
  }

  const uniqueIndexes = [
    ...new Map(
      indexes.map((index) => [
        `${index.name}:${index.columns}:${index.source}`,
        index,
      ]),
    ).values(),
  ];

  const rows = uniqueIndexes.length
    ? uniqueIndexes
        .map(
          (index) =>
            `| \`${index.name}\` | \`${index.columns}\` | \`${index.source}\` |`,
        )
        .join('\n')
    : '| — | — | — |';

  const content = `# Índices automáticos de base de datos

> Este archivo es generado automáticamente. No editar manualmente.

| Índice | Columnas | Fuente |
|---|---|---|
${rows}

## Resumen

- Índices detectados: ${uniqueIndexes.length}
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/database/indexes.md',
    content,
  );
}

module.exports = {
  generateDatabaseIndexes,
};
