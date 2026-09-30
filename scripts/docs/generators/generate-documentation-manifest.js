const fs = require('node:fs');
const path = require('node:path');

const { writeGeneratedFile } = require('./write-file');

const GENERATED_DIR = 'docs/generated';
const MANIFEST_FILE = 'documentation-manifest.md';
const INDEX_FILE = 'README.md';

function collectGeneratedFiles(directory, files = []) {
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
          directory,
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

  const lines = [
    '# Índice de documentación generada',
    '',
    'Este archivo se genera automáticamente a partir de los documentos disponibles en `docs/generated`.',
    '',
    '## Archivos generados',
    '',
  ];

  if (files.length === 0) {
    lines.push(
      'No existen documentos generados disponibles.',
    );
  } else {
    for (const file of files) {
      lines.push(
        `- [${file}](${file})`,
      );
    }
  }

  lines.push('');

  return writeGeneratedFile(
    rootDir,
    path.join(
      GENERATED_DIR,
      MANIFEST_FILE,
    ),
    lines.join('\n'),
  );
}

module.exports = {
  collectGeneratedFiles,
  generateDocumentationManifest,
};
