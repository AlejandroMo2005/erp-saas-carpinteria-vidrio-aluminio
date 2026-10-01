const { generateApiCatalog } = require('./generate-api-catalog');
const {
  generateDatabaseEntities,
} = require('./generate-database-entities');
const {
  generateDatabaseIndexes,
} = require('./generate-database-indexes');
const {
  generateDatabaseProgrammability,
} = require('./generate-database-programmability');
const {
  generateDatabaseRelations,
} = require('./generate-database-relations');
const {
  generateDatabaseSchema,
} = require('./generate-database-schema');
const {
  generateDependencies,
} = require('./generate-dependencies');
const {
  generateDocumentationManifest,
} = require('./generate-documentation-manifest');
const {
  generateGitInfo,
} = require('./generate-git-info');
const {
  generateIndex,
} = require('./generate-index');
const {
  generateLintEvidence,
} = require('./generate-lint-evidence');
const {
  generateProjectMetadata,
} = require('./generate-project-metadata');
const {
  generateProjectStructure,
} = require('./generate-project-structure');
const {
  generateTestEvidence,
} = require('./generate-test-evidence');
const {
  generateTestReport,
} = require('./generate-test-report');

const GENERATORS = [
  generateApiCatalog,
  generateDatabaseSchema,
  generateDatabaseEntities,
  generateDatabaseRelations,
  generateDatabaseIndexes,
  generateDatabaseProgrammability,
  generateDependencies,
  generateGitInfo,
  generateLintEvidence,
  generateProjectMetadata,
  generateProjectStructure,
  generateTestEvidence,
  generateTestReport,
];

const INDEX_GENERATORS = [
  generateDocumentationManifest,
  generateIndex,
];

function runGenerators(
  generators,
  rootDir,
) {
  const generatedFiles = [];

  for (const generate of generators) {
    generatedFiles.push(
      generate(rootDir),
    );
  }

  return generatedFiles;
}

function generateDocumentation(rootDir) {
  const generatedFiles = runGenerators(
    GENERATORS,
    rootDir,
  );

  generatedFiles.push(
    ...runGenerators(
      INDEX_GENERATORS,
      rootDir,
    ),
  );

  return generatedFiles;
}

module.exports = {
  GENERATORS,
  INDEX_GENERATORS,
  runGenerators,
  generateDocumentation,
};
