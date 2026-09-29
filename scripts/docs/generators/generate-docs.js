const {
  generateApiCatalog,
} = require('./generate-api-catalog');
const {
  generateDependencies,
} = require('./generate-dependencies');
const {
  generateDocumentationIndex,
} = require('./generate-index');
const {
  generateProjectMetadata,
} = require('./generate-project-metadata');
const {
  generateProjectStructure,
} = require('./generate-project-structure');
const {
  writeGeneratedFile,
} = require('./write-file');

function generateDocumentation(rootDir) {
  const projectStructure = generateProjectStructure(rootDir);

  return [
    generateApiCatalog(rootDir),
    generateDependencies(rootDir),
    generateDocumentationIndex(rootDir),
    generateProjectMetadata(rootDir),
    writeGeneratedFile(
      rootDir,
      projectStructure.relativePath,
      projectStructure.content,
    ),
  ];
}

module.exports = {
  generateDocumentation,
};
