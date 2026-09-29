const fs = require('node:fs');
const path = require('node:path');

const { collectDatabaseSources } = require('./collect-sql');
const { writeGeneratedFile } = require('./write-file');

function extractObjects(content, pattern) {
  return [...content.matchAll(pattern)].map((match) => match[1]);
}

function generateDatabaseSchema(rootDir) {
  const sources = collectDatabaseSources(rootDir);
  const tables = [];
  const triggers = [];
  const procedures = [];

  for (const source of sources) {
    const content = fs.readFileSync(source, 'utf8');
    const relativePath = path.relative(rootDir, source).replaceAll(path.sep, '/');

    for (const name of extractObjects(
      content,
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`([^`]+)`/gi,
    )) {
      tables.push({ name, source: relativePath });
    }

    for (const name of extractObjects(
      content,
      /CREATE\s+TRIGGER\s+`?([A-Za-z0-9_]+)`?/gi,
    )) {
      triggers.push({ name, source: relativePath });
    }

    for (const name of extractObjects(
      content,
      /CREATE\s+PROCEDURE\s+`?([A-Za-z0-9_]+)`?/gi,
    )) {
      procedures.push({ name, source: relativePath });
    }
  }

  const unique = (items) => [
    ...new Map(items.map((item) => [`${item.name}:${item.source}`, item])).values(),
  ];

  const uniqueTables = unique(tables);
  const uniqueTriggers = unique(triggers);
  const uniqueProcedures = unique(procedures);

  const sourceRows = sources.length
    ? sources
        .map((source) => {
          const relativePath = path.relative(rootDir, source).replaceAll(path.sep, '/');
          return `| \`${relativePath}\` |`;
        })
        .join('\n')
    : '| — |';

  const tableRows = uniqueTables.length
    ? uniqueTables
        .map((table) => `| \`${table.name}\` | \`${table.source}\` |`)
        .join('\n')
    : '| — | — |';

  const triggerRows = uniqueTriggers.length
    ? uniqueTriggers
        .map((trigger) => `| \`${trigger.name}\` | \`${trigger.source}\` |`)
        .join('\n')
    : '| — | — |';

  const procedureRows = uniqueProcedures.length
    ? uniqueProcedures
        .map((procedure) => `| \`${procedure.name}\` | \`${procedure.source}\` |`)
        .join('\n')
    : '| — | — |';

  const content = `# Esquema automático de base de datos

> Este archivo es generado automáticamente. No editar manualmente.

## Fuentes SQL

| Archivo |
|---|
${sourceRows}

## Tablas detectadas

| Tabla | Fuente |
|---|---|
${tableRows}

## Triggers detectados

| Trigger | Fuente |
|---|---|
${triggerRows}

## Procedimientos almacenados detectados

| Procedimiento | Fuente |
|---|---|
${procedureRows}

## Resumen

- Fuentes SQL: ${sources.length}
- Tablas: ${uniqueTables.length}
- Triggers: ${uniqueTriggers.length}
- Procedimientos: ${uniqueProcedures.length}
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/database/schema.md',
    content,
  );
}

module.exports = {
  generateDatabaseSchema,
};
