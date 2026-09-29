const fs = require('node:fs');
const path = require('node:path');

const GENERATED_MARKER = '> Este archivo es generado automáticamente. No editar manualmente.\n';

function ensureGeneratedMarker(content) {
  const normalizedContent = content.trimEnd();

  if (normalizedContent.includes('generado automáticamente')) {
    return `${normalizedContent}\n`;
  }

  return `${normalizedContent}\n\n${GENERATED_MARKER}`;
}

function writeGeneratedFile(rootDir, relativePath, content) {
  const filePath = path.join(rootDir, relativePath);
  const directory = path.dirname(filePath);

  fs.mkdirSync(directory, {
    recursive: true,
  });

  fs.writeFileSync(
    filePath,
    ensureGeneratedMarker(content),
    'utf8',
  );

  return filePath;
}

module.exports = {
  GENERATED_MARKER,
  ensureGeneratedMarker,
  writeGeneratedFile,
};
