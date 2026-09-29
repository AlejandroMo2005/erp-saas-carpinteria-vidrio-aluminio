const fs = require('node:fs');
const path = require('node:path');

const GENERATED_DIR = 'docs/generated';
const MANIFEST_FILE = 'documentation-manifest.md';

function collectGeneratedFiles(directory, rootDirectory, files = []) {
  if (!fs.existsSync(directory)) {
    return files;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      collectGeneratedFiles(fullPath, rootDirectory, files);
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith('.md') &&
      fullPath !== path.join(rootDirectory, MANIFEST_FILE)
    ) {
      files.push(
        path.relative(rootDirectory, fullPath).replaceAll(path.sep, '/'),
      );
    }
  }

  return files.sort();
}

function generateDocumentationManifest(rootDir) {
  const generatedDirectory = path.join(rootDir, GENERATED_DIR);
  const manifestPath = path.join(generatedDirectory, MANIFEST_FILE);

  fs.mkdirSync(generatedDirectory, { recursive: true });

  const files = collectGeneratedFiles(
    generatedDirectory,
    generatedDirectory,
  );

  const content = [
    '# Índice de documentación generada',
    '',
    'Este archivo se genera automáticamente a partir de los documentos disponibles en `docs/generated`.',
    '',
    '## Archivos generados',
    '',
    ...files.map((file) => `- [${file}](${file})`),
    '',
  ].join('\n');

  fs.writeFileSync(manifestPath, content, 'utf8');

  return manifestPath;
}

module.exports = {
  generateDocumentationManifest,
};
```

Commit title  
`fix(docs): evitar autorreferencia del manifiesto`

Commit description  
`Excluye documentation-manifest.md del listado que genera el propio manifiesto para mantener resultados deterministas entre ejecuciones.`
