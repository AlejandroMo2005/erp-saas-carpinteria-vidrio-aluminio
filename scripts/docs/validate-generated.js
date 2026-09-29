#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { validateLinks } = require('./validate-links');
const {
  validateGeneratedConsistency,
} = require('./validate-generated-consistency');

const ROOT_DIR = path.resolve(__dirname, '../..');
const GENERATED_DIR_NAME = path.join('docs', 'generated');

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

function validateGeneratedDocumentation(rootDir = ROOT_DIR) {
  const generatedDirectory = path.join(rootDir, GENERATED_DIR_NAME);
  const files = findMarkdownFiles(generatedDirectory);

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

  const consistencyResult = validateGeneratedConsistency(rootDir);

  if (!consistencyResult.valid) {
    throw new Error(
      'La documentación generada no cumple las reglas de consistencia.',
    );
  }

  const linkErrors = validateLinks(rootDir);

  if (linkErrors.length > 0) {
    throw new Error(
      `Se encontraron ${linkErrors.length} enlaces internos inválidos.`,
    );
  }

  console.log(
    `Documentación generada válida: ${files.length} archivo(s).`,
  );

  return {
    valid: true,
    files: files.length,
  };
}

if (require.main === module) {
  try {
    validateGeneratedDocumentation();
  } catch (error) {
    console.error(
      `Validación de documentación fallida: ${error.message}`,
    );
    process.exit(1);
  }
}

module.exports = {
  validateGeneratedDocumentation,
};
