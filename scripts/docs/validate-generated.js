#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { validateLinks } = require('./validate-links');
const {
  validateGeneratedConsistency,
} = require('./validate-generated-consistency');

const ROOT_DIR = path.resolve(
  __dirname,
  '../..',
);

const GENERATED_DIR_NAME = path.join(
  'docs',
  'generated',
);

function findMarkdownFiles(
  directory,
  files = [],
) {
  if (!fs.existsSync(directory)) {
    return files;
  }

  for (const entry of fs.readdirSync(
    directory,
    { withFileTypes: true },
  )) {
    const entryPath = path.join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      findMarkdownFiles(
        entryPath,
        files,
      );
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith('.md')
    ) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function validateBasicStructure(files) {
  const errors = [];

  for (const filePath of files) {
    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    if (!content.trim()) {
      errors.push(
        `El archivo de documentación está vacío: ${filePath}`,
      );
      continue;
    }

    if (!/^#\s+\S+/m.test(content)) {
      errors.push(
        `El archivo no contiene un título Markdown válido: ${filePath}`,
      );
    }
  }

  return errors;
}

function validateGeneratedDocumentation(
  rootDir = ROOT_DIR,
) {
  const generatedDirectory = path.join(
    rootDir,
    GENERATED_DIR_NAME,
  );

  const files = findMarkdownFiles(
    generatedDirectory,
  );

  if (files.length === 0) {
    throw new Error(
      'No se encontraron archivos de documentación generada.',
    );
  }

  const structureErrors =
    validateBasicStructure(files);

  if (structureErrors.length > 0) {
    throw new Error(
      [
        'La documentación generada presenta errores estructurales:',
        ...structureErrors.map(
          (error) => `- ${error}`,
        ),
      ].join('\n'),
    );
  }

  const consistencyResult =
    validateGeneratedConsistency(rootDir);

  if (!consistencyResult.valid) {
    throw new Error(
      'La documentación generada no cumple las reglas de consistencia.',
    );
  }

  const linkErrors = validateLinks(
    rootDir,
  );

  if (linkErrors.length > 0) {
    throw new Error(
      [
        'La documentación generada contiene enlaces internos inválidos:',
        ...linkErrors.map(
          (error) => `- ${error}`,
        ),
      ].join('\n'),
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
  GENERATED_DIR_NAME,
  findMarkdownFiles,
  validateBasicStructure,
  validateGeneratedDocumentation,
};
