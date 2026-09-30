const fs = require('node:fs');
const path = require('node:path');

const {
  formatList,
} = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

const GENERATED_DIR = 'docs/generated';
const INDEX_FILE = 'README.md';
const MANIFEST_FILE = 'documentation-manifest.md';

function collectMarkdownFiles(
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
      collectMarkdownFiles(
        fullPath,
        rootDirectory,
        files,
      );
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith('.md') &&
      entry.name !== INDEX_FILE &&
      entry.name !== MANIFEST_FILE
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

function generateIndex(rootDir) {
  const generatedDirectory = path.join(
    rootDir,
    GENERATED_DIR,
  );

  const files = collectMarkdownFiles(
    generatedDirectory,
  );

  const documentList = files.length > 0
    ? formatList(
        files.map(
          (file) => `[${file}](${file})`,
        ),
      )
    : 'No existen documentos generados disponibles.';

  const content = [
    '# Documentación generada',
    '',
    'Índice principal de la documentación técnica generada automáticamente.',
    '',
    '## Documentos',
    '',
    documentList,
    '',
  ].join('\n');

  return writeGeneratedFile(
    rootDir,
    path.join(
      GENERATED_DIR,
      INDEX_FILE,
    ),
    content,
  );
}

module.exports = {
  GENERATED_DIR,
  INDEX_FILE,
  MANIFEST_FILE,
  collectMarkdownFiles,
  generateIndex,
};
