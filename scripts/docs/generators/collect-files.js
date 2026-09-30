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

function collectFiles(
  directory,
  {
    extensions = null,
    excludeDirectories = EXCLUDED_DIRECTORIES,
  } = {},
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
      if (!excludeDirectories.has(entry.name)) {
        collectFiles(
          fullPath,
          {
            extensions,
            excludeDirectories,
          },
          files,
        );
      }

      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (
      extensions &&
      !extensions.some((extension) =>
        entry.name.endsWith(extension)
      )
    ) {
      continue;
    }

    files.push(fullPath);
  }

  return files.sort();
}

function collectProjectFiles(
  rootDir,
  options = {},
) {
  return collectFiles(
    rootDir,
    options,
  );
}

module.exports = {
  EXCLUDED_DIRECTORIES,
  collectFiles,
  collectProjectFiles,
};
