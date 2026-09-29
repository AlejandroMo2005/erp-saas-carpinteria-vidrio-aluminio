const fs = require('node:fs');
const path = require('node:path');

const ROUTE_DIRECTORIES = [
  ['backend', 'src', 'modules'],
  ['backend', 'src', 'routes'],
];

function findJavaScriptFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findJavaScriptFiles(entryPath);
    }

    return /\.(js|cjs|mjs)$/.test(entry.name) ? [entryPath] : [];
  });
}

function collectRouteFiles(rootDir) {
  const files = ROUTE_DIRECTORIES.flatMap((segments) =>
    findJavaScriptFiles(path.join(rootDir, ...segments)),
  );

  return [...new Set(files)];
}

module.exports = {
  collectRouteFiles,
};
