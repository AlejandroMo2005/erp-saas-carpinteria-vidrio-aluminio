#!/usr/bin/env node

const path = require('node:path');

const { validateLinks } = require('./validate-links');

const ROOT_DIR = path.resolve(__dirname, '../..');

function validateDocumentation() {
  const errors = validateLinks(ROOT_DIR);

  if (errors.length > 0) {
    console.error('Se encontraron enlaces internos inválidos:\n');

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log('Validación de documentación completada correctamente.');
}

validateDocumentation();
