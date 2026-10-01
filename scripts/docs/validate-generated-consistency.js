const fs = require('node:fs');
const path = require('node:path');

const {
  GENERATED_MARKER,
} = require('./generators/write-file');

const GENERATED_DIR = 'docs/generated';

function collectMarkdownFiles(
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
    const fullPath = path.join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      collectMarkdownFiles(
        fullPath,
        files,
      );
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith('.md')
    ) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function validateGeneratedConsistency(
  rootDir,
) {
  const generatedDir = path.join(
    rootDir,
    GENERATED_DIR,
  );

  const files = collectMarkdownFiles(
    generatedDir,
  );

  const errors = [];

  for (const filePath of files) {
    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    const relativePath = path.relative(
      rootDir,
      filePath,
    );

    if (!/^#\s+\S+/m.test(content)) {
      errors.push(
        `${relativePath}: falta un título Markdown de nivel 1.`,
      );
    }

    if (!content.includes(GENERATED_MARKER)) {
      errors.push(
        `${relativePath}: falta el marcador oficial de generación automática.`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      [
        'Se encontraron inconsistencias en documentación generada:',
        ...errors.map(
          (error) => `- ${error}`,
        ),
      ].join('\n'),
    );
  }

  return {
    valid: true,
    files: files.length,
  };
}

if (require.main === module) {
  const rootDir = path.resolve(
    __dirname,
    '../..',
  );

  try {
    const result =
      validateGeneratedConsistency(
        rootDir,
      );

    console.log(
      `Documentación generada válida: ${result.files} archivos.`,
    );
  } catch (error) {
    console.error(
      `Validación de consistencia fallida: ${error.message}`,
    );
    process.exit(1);
  }
}

module.exports = {
  GENERATED_DIR,
  collectMarkdownFiles,
  validateGeneratedConsistency,
};
