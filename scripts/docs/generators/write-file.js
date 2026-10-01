const fs = require('node:fs');
const path = require('node:path');

const GENERATED_MARKER =
  '> Este archivo es generado automáticamente. No editar manualmente.';

function ensureGeneratedMarker(content) {
  const normalizedContent = String(
    content ?? '',
  ).trimEnd();

  if (normalizedContent.includes(GENERATED_MARKER)) {
    return `${normalizedContent}\n`;
  }

  return [
    normalizedContent,
    '',
    GENERATED_MARKER,
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

  fs.mkdirSync(
    path.dirname(filePath),
    {
      recursive: true,
    },
  );

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
