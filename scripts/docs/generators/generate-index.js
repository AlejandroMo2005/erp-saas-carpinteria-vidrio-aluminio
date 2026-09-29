const fs = require('node:fs');
const path = require('node:path');

const { writeGeneratedFile } = require('./write-file');

const GENERATED_DIR = 'docs/generated';

function collectMarkdownFiles(directory, rootDirectory, files = []) {
  if (!fs.existsSync(directory)) {
    return files;
  }

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    const fullPath = path.join(directory, entry.name);

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
      fullPath !== path.join(
        rootDirectory,
        'README.md',
      )
    ) {
      files.push(
        path.relative(rootDirectory, fullPath)
          .replaceAll(path.sep, '/'),
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
    generatedDirectory,
  );

  const lines = [
    '# Documentación generada',
    '',
    'Índice principal de la documentación técnica generada automáticamente.',
    '',
    '## Documentos',
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
    'docs/generated/README.md',
    lines.join('\n'),
  );
}

module.exports = {
  generateIndex,
};
