const fs = require('node:fs');
const path = require('node:path');

const ROUTE_METHOD_PATTERN =
  /\brouter\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi;

const APP_ROUTE_METHOD_PATTERN =
  /\bapp\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi;

function normalizeRoutePath(routePath) {
  if (!routePath || routePath === '/') {
    return '';
  }

  const normalized = routePath
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  return normalized ? `/${normalized}` : '';
}

function combineRoutePaths(mountPath, routePath) {
  const normalizedMount = normalizeRoutePath(
    mountPath,
  );

  const normalizedRoute = normalizeRoutePath(
    routePath,
  );

  const combined = `${normalizedMount}${normalizedRoute}`;

  return combined || '/';
}

function parseRouteSource(
  source,
  {
    filePath,
    mountPath = '',
    pattern = ROUTE_METHOD_PATTERN,
  } = {},
) {
  const routes = [];

  for (const match of source.matchAll(pattern)) {
    routes.push({
      method: match[1].toUpperCase(),
      path: combineRoutePaths(
        mountPath,
        match[2],
      ),
      file: filePath,
    });
  }

  return routes;
}

function parseRouteFile(
  filePath,
  mountPath = '',
) {
  const source = fs.readFileSync(
    filePath,
    'utf8',
  );

  return parseRouteSource(
    source,
    {
      filePath,
      mountPath,
      pattern: ROUTE_METHOD_PATTERN,
    },
  );
}

function parseAppRouteFile(filePath) {
  const source = fs.readFileSync(
    filePath,
    'utf8',
  );

  return parseRouteSource(
    source,
    {
      filePath,
      mountPath: '',
      pattern: APP_ROUTE_METHOD_PATTERN,
    },
  );
}

function parseRouteFiles(routeSources) {
  return routeSources.flatMap((routeSource) => {
    if (typeof routeSource === 'string') {
      return parseRouteFile(routeSource);
    }

    if (routeSource.source === 'app') {
      return parseAppRouteFile(
        routeSource.filePath,
      );
    }

    return parseRouteFile(
      routeSource.filePath,
      routeSource.mountPath,
    );
  });
}

function formatRouteFile(rootDir, filePath) {
  return path.relative(
    rootDir,
    filePath,
  ).replaceAll(path.sep, '/');
}

module.exports = {
  normalizeRoutePath,
  combineRoutePaths,
  parseRouteSource,
  parseRouteFile,
  parseAppRouteFile,
  parseRouteFiles,
  formatRouteFile,
};
