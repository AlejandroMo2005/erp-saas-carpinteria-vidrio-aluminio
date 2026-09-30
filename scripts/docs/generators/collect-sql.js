const fs = require('node:fs');
const path = require('node:path');

const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'coverage',
  'dist',
  'build',
  '.vite',
  '.next',
]);

function collectSqlFiles(
  directory,
  files = [],
) {
  if (!fs.existsSync(directory)) {
    return files;
  }

  for (const entry of fs.readdirSync(
    directory,
    { withFileTypes: true },
  )) {
    const fullPath = path.join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      if (
        !EXCLUDED_DIRECTORIES.has(
          entry.name,
        )
      ) {
        collectSqlFiles(
          fullPath,
          files,
        );
      }

      continue;
    }

    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith('.sql')
    ) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function collectDatabaseSources(rootDir) {
  return collectSqlFiles(rootDir);
}

module.exports = {
  EXCLUDED_DIRECTORIES,
  collectSqlFiles,
  collectDatabaseSources,
};
