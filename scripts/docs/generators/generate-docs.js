const path = require('node:path');

const { generateApiCatalog } = require('./generators/generate-api-catalog');
const { generateDatabaseEntities } = require('./generators/generate-database-entities');
const { generateDatabaseIndexes } = require('./generators/generate-database-indexes');
const { generateDatabaseProgrammability } = require('./generators/generate-database-programmability');
const { generateDatabaseRelations } = require('./generators/generate-database-relations');
const { generateDatabaseSchema } = require('./generators/generate-database-schema');
const { generateDependencies } = require('./generators/generate-dependencies');
const { generateDocumentationManifest } = require('./generators/generate-documentation-manifest');
const { generateGitInfo } = require('./generators/generate-git-info');
const { generateIndex } = require('./generators/generate-index');
const { generateLintEvidence } = require('./generators/generate-lint-evidence');
const { generateProjectMetadata } = require('./generators/generate-project-metadata');
const { generateProjectStructure } = require('./generators/generate-project-structure');
const { generateTestEvidence } = require('./generators/generate-test-evidence');
const { generateTestsReport } = require('./generators/generate-tests-report');

const ROOT_DIR = path.resolve(__dirname, '../..');

function generateDocumentation() {
  const generatedFiles = [];

  generatedFiles.push(generateApiCatalog(ROOT_DIR));
  generatedFiles.push(generateDatabaseSchema(ROOT_DIR));
  generatedFiles.push(generateDatabaseEntities(ROOT_DIR));
  generatedFiles.push(generateDatabaseRelations(ROOT_DIR));
  generatedFiles.push(generateDatabaseIndexes(ROOT_DIR));
  generatedFiles.push(generateDatabaseProgrammability(ROOT_DIR));
  generatedFiles.push(generateDependencies(ROOT_DIR));
  generatedFiles.push(generateGitInfo(ROOT_DIR));
  generatedFiles.push(generateLintEvidence(ROOT_DIR));
  generatedFiles.push(generateProjectMetadata(ROOT_DIR));
  generatedFiles.push(generateProjectStructure(ROOT_DIR));
  generatedFiles.push(generateTestEvidence(ROOT_DIR));
  generatedFiles.push(generateTestsReport(ROOT_DIR));
  generatedFiles.push(generateDocumentationManifest(ROOT_DIR));
  generatedFiles.push(generateIndex(ROOT_DIR));

  return generatedFiles;
}

if (require.main === module) {
  generateDocumentation();
  console.log('Documentación generada correctamente.');
}

module.exports = {
  generateDocumentation,
};
