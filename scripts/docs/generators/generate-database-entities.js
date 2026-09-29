const fs = require('node:fs');
const path = require('node:path');

const { collectDatabaseSources } = require('./collect-sql');
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
    .filter((line) => /^`[^`]+`\s+/u.test(line))
    .map((line) => {
      const match = line.match(/^`([^`]+)`\s+(.+?)(?:,)?$/u);

      return match
        ? {
            name: match[1],
            definition: match[2],
          }
        : null;
    })
    .filter(Boolean);
}

function generateDatabaseEntities(rootDir) {
  const sources = collectDatabaseSources(rootDir);
  const tables = [];

  for (const source of sources) {
    const content = fs.readFileSync(source, 'utf8');
    const relativePath = path.relative(rootDir, source).replaceAll(path.sep, '/');

    for (const table of extractTableBlocks(content)) {
      tables.push({
        ...table,
        source: relativePath,
        columns: extractColumns(table.body),
      });
    }
  }

  const uniqueTables = [
    ...new Map(
      tables.map((table) => [`${table.name}:${table.source}`, table]),
    ).values(),
  ];

  const sections = uniqueTables.length
    ? uniqueTables.map((table) => {
        const columns = table.columns.length
          ? table.columns
              .map(
                (column) =>
                  `| \`${column.name}\` | \`${column.definition.replaceAll('|', '\\|')}\` |`,
              )
              .join('\n')
          : '| — | — |';

        return `## ${table.name}

**Fuente:** \`${table.source}\`

| Columna | Definición |
|---|---|
${columns}
`;
      }).join('\n')
    : 'No se detectaron tablas en las fuentes SQL.';

  const content = `# Entidades automáticas de base de datos

> Este archivo es generado automáticamente. No editar manualmente.

${sections}
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/database/entities.md',
    content,
  );
}

module.exports = {
  generateDatabaseEntities,
};
