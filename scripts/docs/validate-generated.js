#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const GENERATED_DIR = path.join(ROOT_DIR, 'docs', 'generated');

function findMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findMarkdownFiles(entryPath);
    }

    return entry.name.endsWith('.md') ? [entryPath] : [];
  });
}

function validateGeneratedDocumentation() {
  const files = findMarkdownFiles(GENERATED_DIR);

  if (files.length === 0) {
    throw new Error(
      'No se encontraron archivos de documentación generada.',
    );
  }

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');

    if (!content.trim()) {
      throw new Error(
        `El archivo de documentación está vacío: ${filePath}`,
      );
    }

    if (!content.startsWith('# ')) {
      throw new Error(
        `El archivo no contiene un título Markdown válido: ${filePath}`,
      );
    }
  }

  console.log(
    `Documentación generada válida: ${files.length} archivo(s).`,
  );
}

try {
  validateGeneratedDocumentation();
} catch (error) {
  console.error(`Validación de documentación fallida: ${error.message}`);
  process.exit(1);
}
