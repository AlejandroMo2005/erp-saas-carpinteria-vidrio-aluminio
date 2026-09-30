const path = require('node:path');

const { collectGeneratedFiles } = require('./collect-files');
const { writeGeneratedFile } = require('./write-file');

const GENERATED_DIR = 'docs/generated';
const MANIFEST_FILE = 'documentation-manifest.md';
const INDEX_FILE = 'README.md';

function generateDocumentationManifest(rootDir) {
  const generatedDirectory = path.join(
    rootDir,
    GENERATED_DIR,
  );

  const files = collectGeneratedFiles(
    generatedDirectory,
    {
      exclude: new Set([
        MANIFEST_FILE,
        INDEX_FILE,
      ]),
    },
  );

  const content = [
    '# Índice de documentación generada',
    '',
    'Este archivo se genera automáticamente a partir de los documentos disponibles en `docs/generated`.',
    '',
    '## Archivos generados',
    '',
    files.length > 0
      ? ...files.map((file) => `- [${file}](${file})`)
      : 'No existen documentos generados disponibles.',
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
  generateDocumentationManifest,
};
