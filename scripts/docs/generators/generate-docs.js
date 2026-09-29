const path = require('node:path');

const { generateApiCatalog } = require('./generate-api-catalog');
const { generateDocumentationIndex } = require('./generate-index');
const {
  generateProjectStructure,
} = require('./generate-project-structure');
const { writeGeneratedFile } = require('./write-file');

function generateDocumentation(rootDir) {
  const generatedFiles = [
    generateApiCatalog(rootDir),
    generateDocumentationIndex(rootDir),
    generateProjectStructure(rootDir),
  ];

  const projectStructure = generateProjectStructure(rootDir);

  generatedFiles.push(
    writeGeneratedFile(
      rootDir,
      projectStructure.relativePath,
      projectStructure.content,
    ),
  );

  return generatedFiles;
}

module.exports = {
  generateDocumentation,
};
