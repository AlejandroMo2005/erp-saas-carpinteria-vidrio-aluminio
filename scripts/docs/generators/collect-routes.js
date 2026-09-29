const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

const ROUTE_DIRECTORIES = [
  path.join(BACKEND_DIR, 'src', 'modules'),
  path.join(BACKEND_DIR, 'src', 'routes'),
];

function findJavaScriptFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...findJavaScriptFiles(entryPath));
      continue;
    }

    if (/\.(js|cjs|mjs)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function collectRouteFiles() {
  return ROUTE_DIRECTORIES
    .flatMap(findJavaScriptFiles)
    .filter((filePath, index, files) => files.indexOf(filePath) === index);
}

module.exports = {
  collectRouteFiles,
};
