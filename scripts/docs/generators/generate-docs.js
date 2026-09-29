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
  generateGitInfo,
} = require('./generate-git-info');
const {
  generateProjectMetadata,
} = require('./generate-project-metadata');
const {
  generateProjectStructure,
} = require('./generate-project-structure');
const {
  generateTestsReport,
} = require('./generate-tests-report');
const {
  writeGeneratedFile,
} = require('./write-file');

function generateDocumentation(rootDir) {
  const projectStructure = generateProjectStructure(rootDir);

  return [
    generateApiCatalog(rootDir),
    generateDependencies(rootDir),
    generateDocumentationIndex(rootDir),
    generateGitInfo(rootDir),
    generateProjectMetadata(rootDir),
    generateTestsReport(rootDir),
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
