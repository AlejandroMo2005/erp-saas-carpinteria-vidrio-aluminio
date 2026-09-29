const fs = require('node:fs');
const path = require('node:path');

const { writeGeneratedFile } = require('./write-file');

function generateProjectMetadata(rootDir) {
  const packagePath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(
    fs.readFileSync(packagePath, 'utf8'),
  );

  const dependencies = Object.keys(packageJson.dependencies || {}).sort();
  const devDependencies = Object.keys(
    packageJson.devDependencies || {},
  ).sort();

  const content = `# Metadatos automáticos del proyecto

> Este archivo es generado automáticamente. No editar manualmente.

## Proyecto

| Campo | Valor |
|---|---|
| Nombre | \`${packageJson.name || 'No definido'}\` |
| Versión | \`${packageJson.version || 'No definida'}\` |
| Node requerido | \`${packageJson.engines?.node || 'No definido'}\` |
| Gestor de paquetes | npm |

## Scripts

| Script | Comando |
|---|---|
${Object.entries(packageJson.scripts || {})
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, command]) => `| \`${name}\` | \`${command}\` |`)
  .join('\n')}

## Dependencias de producción

${dependencies.length > 0
  ? dependencies.map((dependency) => `- \`${dependency}\``).join('\n')
  : '- No definidas.'}

## Dependencias de desarrollo

${devDependencies.length > 0
  ? devDependencies.map((dependency) => `- \`${dependency}\``).join('\n')
  : '- No definidas.'}
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/project-metadata.md',
    content,
  );
}

module.exports = {
  generateProjectMetadata,
};
