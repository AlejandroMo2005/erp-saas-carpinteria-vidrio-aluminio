const fs = require('node:fs');
const path = require('node:path');

const {
  formatList,
} = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

const GENERATED_DIR = 'docs/generated';
const MANIFEST_FILE = 'documentation-manifest.md';
const INDEX_FILE = 'README.md';

function collectGeneratedFiles(
  directory,
  rootDirectory = directory,
  files = [],
) {
  if (!fs.existsSync(directory)) {
    return files;
  }

  for (const entry of fs.readdirSync(
    directory,
    { withFileTypes: true },
  )) {
    const fullPath = path.join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      collectGeneratedFiles(
        fullPath,
        rootDirectory,
        files,
      );
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith('.md') &&
      entry.name !== MANIFEST_FILE &&
      entry.name !== INDEX_FILE
    ) {
      files.push(
        path.relative(
          rootDirectory,
          fullPath,
        ).replaceAll(path.sep, '/'),
      );
    }
  }

  return files.sort();
}

function generateDocumentationManifest(rootDir) {
  const generatedDirectory = path.join(
    rootDir,
    GENERATED_DIR,
  );

  const files = collectGeneratedFiles(
    generatedDirectory,
  );

  const fileLinks = files.map(
    (file) => `[${file}](${file})`,
  );

  const documentList = files.length > 0
    ? formatList(fileLinks)
    : 'No existen documentos generados disponibles.';

  const content = [
    '# Índice de documentación generada',
    '',
    'Este archivo se genera automáticamente a partir de los documentos disponibles en `docs/generated`.',
    '',
    '## Archivos generados',
    '',
    documentList,
    '',
  ].join('\n');

  return writeGeneratedFile(
    rootDir,
    path.join(
      GENERATED_DIR,
      MANIFEST_FILE,
    ),
    content,
  );
}

module.exports = {
  GENERATED_DIR,
  MANIFEST_FILE,
  INDEX_FILE,
  collectGeneratedFiles,
  generateDocumentationManifest,
};
