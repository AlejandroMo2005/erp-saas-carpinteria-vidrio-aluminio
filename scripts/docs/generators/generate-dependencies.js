const fs = require('node:fs');
const path = require('node:path');

const { writeGeneratedFile } = require('./write-file');

function readPackage(packagePath) {
  if (!fs.existsSync(packagePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function formatDependencies(dependencies) {
  const entries = Object.entries(dependencies || {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  if (entries.length === 0) {
    return '- Ninguna.';
  }

  return entries
    .map(([name, version]) => `| \`${name}\` | \`${version}\` |`)
    .join('\n');
}

function generateDependencies(rootDir) {
  const packages = [
    {
      name: 'Raíz',
      path: path.join(rootDir, 'package.json'),
    },
    {
      name: 'Backend',
      path: path.join(rootDir, 'backend', 'package.json'),
    },
  ];

  const sections = [];

  for (const packageInfo of packages) {
    const packageJson = readPackage(packageInfo.path);

    if (!packageJson) {
      continue;
    }

    sections.push(`## ${packageInfo.name}

### Producción

| Dependencia | Versión |
|---|---|
${formatDependencies(packageJson.dependencies)}

### Desarrollo

| Dependencia | Versión |
|---|---|
${formatDependencies(packageJson.devDependencies)}
`);
  }

  const content = `# Dependencias automáticas del proyecto

> Este archivo es generado automáticamente. No editar manualmente.

${sections.join('\n')}
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/dependencies.md',
    content,
  );
}

module.exports = {
  generateDependencies,
};
