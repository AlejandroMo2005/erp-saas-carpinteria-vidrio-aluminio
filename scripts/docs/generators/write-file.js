const fs = require('node:fs');
const path = require('node:path');

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeGeneratedFile(rootDir, relativePath, content) {
  const outputPath = path.join(rootDir, relativePath);

  ensureDirectory(outputPath);
  fs.writeFileSync(outputPath, content, 'utf8');

  return outputPath;
}

module.exports = {
  writeGeneratedFile,
};
