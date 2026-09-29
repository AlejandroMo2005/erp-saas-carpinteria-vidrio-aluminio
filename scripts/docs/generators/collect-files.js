const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_EXTENSIONS = ['.js', '.cjs', '.mjs'];

function collectFiles(directory, extensions = DEFAULT_EXTENSIONS) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath, extensions));
      continue;
    }

    if (extensions.includes(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

module.exports = {
  collectFiles,
};
