#!/usr/bin/env node

const path = require('node:path');

const {
  validateGeneratedDocumentation,
} = require('./validate-generated');

function validateDocumentation(rootDir) {
  return validateGeneratedDocumentation(rootDir);
}

if (require.main === module) {
  const rootDir = path.resolve(
    __dirname,
    '../..',
  );

  try {
    const result = validateDocumentation(
      rootDir,
    );

    console.log(
      `Documentación generada válida: ${result.files} archivo(s).`,
    );
  } catch (error) {
    console.error(
      `Validación de documentación fallida: ${error.message}`,
    );

    process.exit(1);
  }
}

module.exports = {
  validateDocumentation,
};
