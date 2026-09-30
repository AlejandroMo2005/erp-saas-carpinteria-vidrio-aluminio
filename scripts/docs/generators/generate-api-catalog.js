const { collectRoutesSources } = require('./collect-routes');
const { parseRouteFiles } = require('./parse-routes');
const { writeGeneratedFile } = require('./write-file');

function formatRoutes(routes, rootDir) {
  if (routes.length === 0) {
    return 'No se encontraron rutas HTTP en los archivos analizados.';
  }

  const sortedRoutes = [...routes].sort((a, b) => {
    const pathComparison = a.path.localeCompare(b.path);

    if (pathComparison !== 0) {
      return pathComparison;
    }

    const methodComparison = a.method.localeCompare(b.method);

    if (methodComparison !== 0) {
      return methodComparison;
    }

    return a.file.localeCompare(b.file);
  });

  return sortedRoutes
    .map(
      ({ method, path: routePath, file }) =>
        `| \`${method}\` | \`${routePath}\` | \`${file}\` |`,
    )
    .join('\n');
}

function generateApiCatalog(rootDir) {
  const routeSources = collectRoutesSources(rootDir);
  const routes = parseRouteFiles(routeSources);

  const formattedRoutes = routes.map((route) => ({
    ...route,
    file: require('./parse-routes').formatRouteFile(
      rootDir,
      route.file,
    ),
  }));

  const content = `# Catálogo automático de endpoints

> Archivo generado automáticamente. No editar manualmente.

## Endpoints detectados

| Método | Ruta | Fuente |
|---|---|---|
${formatRoutes(formattedRoutes, rootDir)}

## Fuente

Los endpoints se obtienen mediante análisis estático de las declaraciones de rutas Express del proyecto.

- Fuentes de rutas analizadas: ${routeSources.length}
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
