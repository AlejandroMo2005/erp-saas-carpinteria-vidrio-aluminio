const fs = require('node:fs');
const path = require('node:path');

const MODULES_INDEX = [
  'backend',
  'src',
  'modules',
  'index.js',
];

const APP_FILE = [
  'backend',
  'app.js',
];

function findJavaScriptFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(
    directory,
    { withFileTypes: true },
  ).flatMap((entry) => {
    const entryPath = path.join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      return findJavaScriptFiles(entryPath);
    }

    return /\.(js|cjs|mjs)$/.test(entry.name)
      ? [entryPath]
      : [];
  });
}

function readSource(filePath) {
  return fs.readFileSync(
    filePath,
    'utf8',
  );
}

function resolveRouteFile(rootDir, modulePath) {
  const basePath = path.resolve(
    rootDir,
    'backend',
    'src',
    'modules',
    modulePath,
  );

  const candidates = [
    basePath,
    `${basePath}.js`,
    path.join(basePath, 'index.js'),
  ];

  return candidates.find((candidate) =>
    fs.existsSync(candidate) &&
    fs.statSync(candidate).isFile()
  ) || null;
}

function collectMountedRouteFiles(rootDir) {
  const indexPath = path.join(
    rootDir,
    ...MODULES_INDEX,
  );

  if (!fs.existsSync(indexPath)) {
    return [];
  }

  const source = readSource(indexPath);
  const routes = [];

  const pattern =
    /app\.use\s*\(\s*['"`]([^'"`]+)['"`]\s*,([\s\S]*?)loadModule\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\)/g;

  for (const match of source.matchAll(pattern)) {
    const mountPath = match[1];
    const modulePath = match[3];
    const routeFile = resolveRouteFile(
      rootDir,
      modulePath,
    );

    if (!routeFile) {
      continue;
    }

    routes.push({
      filePath: routeFile,
      mountPath,
      source: 'module',
    });
  }

  return routes;
}

function collectDirectRouteFiles(rootDir) {
  const appPath = path.join(
    rootDir,
    ...APP_FILE,
  );

  if (!fs.existsSync(appPath)) {
    return [];
  }

  return [{
    filePath: appPath,
    mountPath: '',
    source: 'app',
  }];
}

function collectRouteFiles(rootDir) {
  return findJavaScriptFiles(
    path.join(
      rootDir,
      'backend',
      'src',
      'modules',
    ),
  );
}

function collectRoutesSources(rootDir) {
  return [
    ...collectMountedRouteFiles(rootDir),
    ...collectDirectRouteFiles(rootDir),
  ];
}

module.exports = {
  collectRouteFiles,
  collectMountedRouteFiles,
  collectDirectRouteFiles,
  collectRoutesSources,
};
