#!/usr/bin/env node

const path = require('node:path');
const { execFileSync } = require('node:child_process');

const GENERATED_DIR = path.join(
  'docs',
  'generated',
);

function getGitChangedFiles(rootDir) {
  try {
    const output = execFileSync(
      'git',
      [
        'status',
        '--short',
        '--untracked-files=all',
        '--',
        GENERATED_DIR,
      ],
      {
        cwd: rootDir,
        encoding: 'utf8',
      },
    );

    return output
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.slice(3).trim())
      .sort();
  } catch (error) {
    throw new Error(
      `No fue posible consultar el estado Git de la documentación generada: ${error.message}`,
      { cause: error },
    );
  }
}

function verifyGeneratedDocumentation(rootDir) {
  const changedFiles = getGitChangedFiles(
    rootDir,
  );

  return {
    valid: changedFiles.length === 0,
    changedFiles,
  };
}

if (require.main === module) {
  const rootDir = path.resolve(
    __dirname,
    '../..',
  );

  try {
    const result =
      verifyGeneratedDocumentation(rootDir);

    if (!result.valid) {
      console.error(
        'La documentación generada presenta cambios pendientes:',
      );

      for (const file of result.changedFiles) {
        console.error(`- ${file}`);
      }

      process.exit(1);
    }

    console.log(
      'La documentación generada está sincronizada con el repositorio.',
    );
  } catch (error) {
    console.error(
      `Verificación de documentación fallida: ${error.message}`,
    );
    process.exit(1);
  }
}

module.exports = {
  GENERATED_DIR,
  getGitChangedFiles,
  verifyGeneratedDocumentation,
};
