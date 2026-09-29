const fs = require('node:fs');
const path = require('node:path');

const { writeGeneratedFile } = require('./write-file');

function collectGeneratedFiles(directory, rootDir, files = []) {
  if (!fs.existsSync(directory)) {
    return files;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      collectGeneratedFiles(fullPath, rootDir, files);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(
        path.relative(rootDir, fullPath).replaceAll(path.sep, '/'),
      );
    }
  }

  return files.sort();
}

function generateDocumentationManifest(rootDir) {
  const generatedDir = path.join(rootDir, 'docs/generated');
  const files = collectGeneratedFiles(generatedDir, rootDir);

  const rows = files.length
    ? files
        .map((file) => `| \`${file}\` |`)
        .join('\n')
    : '| — |';

  const content = `# Manifiesto automático de documentación

> Este archivo es generado automáticamente. No editar manualmente.

| Archivo generado |
|---|
${rows}

## Resumen

- Archivos Markdown generados: ${files.length}
- Directorio raíz: \`docs/generated\`
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/documentation-manifest.md',
    content,
  );
}

module.exports = {
  generateDocumentationManifest,
};
