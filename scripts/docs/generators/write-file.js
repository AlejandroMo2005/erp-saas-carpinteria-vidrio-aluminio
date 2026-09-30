const fs = require('node:fs');
const path = require('node:path');

const GENERATED_MARKER =
  '> Este archivo es generado automáticamente. No editar manualmente.\n';

function ensureGeneratedMarker(content) {
  const normalizedContent = content.trimEnd();

  if (
    normalizedContent.includes(
      'generado automáticamente',
    )
  ) {
    return `${normalizedContent}\n`;
  }

  return [
    normalizedContent,
    '',
    GENERATED_MARKER.trimEnd(),
    '',
  ].join('\n');
}

function writeGeneratedFile(
  rootDir,
  relativePath,
  content,
) {
  const filePath = path.join(
    rootDir,
    relativePath,
  );

  const directory = path.dirname(filePath);

  fs.mkdirSync(directory, {
    recursive: true,
  });

  const normalizedContent =
    ensureGeneratedMarker(content);

  fs.writeFileSync(
    filePath,
    normalizedContent,
    'utf8',
  );

  return filePath;
}

module.exports = {
  GENERATED_MARKER,
  ensureGeneratedMarker,
  writeGeneratedFile,
};
