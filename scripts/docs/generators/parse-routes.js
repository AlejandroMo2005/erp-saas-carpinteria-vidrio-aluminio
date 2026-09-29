const fs = require('node:fs');

const ROUTE_METHOD_PATTERN =
  /\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi;

function parseRouteFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const routes = [];

  for (const match of source.matchAll(ROUTE_METHOD_PATTERN)) {
    routes.push({
      method: match[1].toUpperCase(),
      path: match[2],
      file: filePath,
    });
  }

  return routes;
}

function parseRouteFiles(filePaths) {
  return filePaths.flatMap(parseRouteFile);
}

module.exports = {
  parseRouteFile,
  parseRouteFiles,
};
