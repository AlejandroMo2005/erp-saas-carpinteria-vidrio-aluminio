#!/usr/bin/env node

const path = require('node:path');

const { generateApiCatalog } = require('./generators/generate-api-catalog');
const { generateDocumentationIndex } = require('./generators/generate-index');

const ROOT_DIR = path.resolve(__dirname, '../..');

function main() {
  console.log('Iniciando generación de documentación...');

  const generatedFiles = [
    generateApiCatalog(ROOT_DIR),
    generateDocumentationIndex(ROOT_DIR),
  ];

  console.log('\nDocumentación generada:');

  for (const filePath of generatedFiles) {
    console.log(`- ${filePath}`);
  }

  console.log('\nGeneración completada.');
}

main();
```

feat(docs): integrar índice en generación automática

Integra la generación del índice de documentación con el flujo principal para que el catálogo y el índice se actualicen en una misma ejecución.
