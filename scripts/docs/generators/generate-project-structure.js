const fs = require('node:fs');
const path = require('node:path');

const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'coverage',
  'dist',
  'build',
  'docs',
]);

function collectDirectories(directory, rootDir, result = []) {
  if (!fs.existsSync(directory)) {
    return result;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || EXCLUDED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);
    const relativePath = path.relative(rootDir, entryPath);

    result.push(relativePath);
    collectDirectories(entryPath, rootDir, result);
  }

  return result;
}

function generateProjectStructure(rootDir) {
  const directories = collectDirectories(rootDir, rootDir)
    .sort()
    .map((directory) => `- \`${directory.replaceAll(path.sep, '/')}/\``);

  const content = `# Estructura automática del proyecto

> Este archivo es generado automáticamente. No editar manualmente.

## Directorios detectados

${directories.length > 0 ? directories.join('\n') : '- No se encontraron directorios.'}

## Fuente

La estructura se obtiene mediante análisis del sistema de archivos del repositorio.

- Directorios detectados: ${directories.length}
`;

  return {
    relativePath: 'docs/generated/architecture/project-structure.md',
    content,
  };
}

module.exports = {
  generateProjectStructure,
};
