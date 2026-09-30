const { generateApiCatalog } = require('./generate-api-catalog');
const { generateDatabaseEntities } = require('./generate-database-entities');
const { generateDatabaseIndexes } = require('./generate-database-indexes');
const { generateDatabaseProgrammability } = require('./generate-database-programmability');
const { generateDatabaseRelations } = require('./generate-database-relations');
const { generateDatabaseSchema } = require('./generate-database-schema');
const { generateDependencies } = require('./generate-dependencies');
const { generateDocumentationManifest } = require('./generate-documentation-manifest');
const { generateGitInfo } = require('./generate-git-info');
const { generateIndex } = require('./generate-index');
const { generateLintEvidence } = require('./generate-lint-evidence');
const { generateProjectMetadata } = require('./generate-project-metadata');
const { generateProjectStructure } = require('./generate-project-structure');
const { generateTestEvidence } = require('./generate-test-evidence');
const { generateTestsReport } = require('./generate-test-report');

function generateDocumentation(rootDir) {
  const generatedFiles = [];

  generatedFiles.push(generateApiCatalog(rootDir));
  generatedFiles.push(generateDatabaseSchema(rootDir));
  generatedFiles.push(generateDatabaseEntities(rootDir));
  generatedFiles.push(generateDatabaseRelations(rootDir));
  generatedFiles.push(generateDatabaseIndexes(rootDir));
  generatedFiles.push(generateDatabaseProgrammability(rootDir));
  generatedFiles.push(generateDependencies(rootDir));
  generatedFiles.push(generateGitInfo(rootDir));
  generatedFiles.push(generateLintEvidence(rootDir));
  generatedFiles.push(generateProjectMetadata(rootDir));
  generatedFiles.push(generateProjectStructure(rootDir));
  generatedFiles.push(generateTestEvidence(rootDir));
  generatedFiles.push(generateTestsReport(rootDir));
  generatedFiles.push(generateDocumentationManifest(rootDir));
  generatedFiles.push(generateIndex(rootDir));

  return generatedFiles;
}

module.exports = {
  generateDocumentation,
};
