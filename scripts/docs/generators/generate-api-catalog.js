const path = require('node:path');

const { collectRouteFiles } = require('./collect-routes');
const { parseRouteFiles } = require('./parse-routes');
const { writeGeneratedFile } = require('./write-file');

function formatRoutes(routes) {
  if (routes.length === 0) {
    return 'No se encontraron rutas HTTP en los archivos analizados.';
  }

  const sortedRoutes = [...routes].sort((a, b) => {
    const pathComparison = a.path.localeCompare(b.path);

    if (pathComparison !== 0) {
      return pathComparison;
    }

    return a.method.localeCompare(b.method);
  });

  return sortedRoutes
    .map(
      ({ method, path: routePath }) =>
        `| \`${method}\` | \`${routePath}\` |`,
    )
    .join('\n');
}

function generateApiCatalog(rootDir) {
  const routeFiles = collectRouteFiles(rootDir);
  const routes = parseRouteFiles(routeFiles);

  const content = `# Catálogo automático de endpoints

> Archivo generado automáticamente. No editar manualmente.

## Endpoints detectados

| Método | Ruta |
|---|---|
${formatRoutes(routes)}

## Fuente

Los endpoints se obtienen mediante análisis estático de los archivos de rutas del backend.

- Archivos de rutas analizados: ${routeFiles.length}
- Endpoints detectados: ${routes.length}
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/api/endpoints.md',
    content,
  );
}

module.exports = {
  generateApiCatalog,
};
