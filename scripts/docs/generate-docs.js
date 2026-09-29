#!/usr/bin/env node

const path = require('node:path');

const {
  generateDocumentation,
} = require('./generators/generate-docs');

const ROOT_DIR = path.resolve(__dirname, '../..');

function main() {
  console.log('Iniciando generación de documentación...');

  const generatedFiles = generateDocumentation(ROOT_DIR);

  console.log('\nDocumentación generada:');

  for (const filePath of generatedFiles) {
    console.log(`- ${filePath}`);
  }

  console.log('\nGeneración completada.');
}

main();
