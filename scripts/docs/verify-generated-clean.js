#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const GENERATED_DIR = path.join(
  'docs',
  'generated',
);

function getGeneratedFiles(rootDir) {
  const generatedDirectory = path.join(
    rootDir,
    GENERATED_DIR,
  );

  if (!fs.existsSync(generatedDirectory)) {
    return [];
  }

  const files = [];

  function collect(directory) {
    for (const entry of fs.readdirSync(
      directory,
      { withFileTypes: true },
    )) {
      const fullPath = path.join(
        directory,
        entry.name,
      );

      if (entry.isDirectory()) {
        collect(fullPath);
        continue;
      }

      if (
        entry.isFile() &&
        entry.name.endsWith('.md')
      ) {
        files.push(
          path.relative(rootDir, fullPath)
            .replaceAll(path.sep, '/'),
        );
      }
    }
  }

  collect(generatedDirectory);

  return files.sort();
}

function getGitChangedFiles(rootDir) {
  try {
    const output = execFileSync(
      'git',
      [
        'status',
        '--short',
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
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.slice(3))
      .sort();
  } catch {
    return [];
  }
}

function verifyGeneratedDocumentation(
  rootDir,
  expectedChangedFiles = getGitChangedFiles(rootDir),
) {
  const generatedFiles = getGeneratedFiles(
    rootDir,
  );

  const changedFiles = generatedFiles.filter(
    (file) => expectedChangedFiles.includes(file),
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

  const result = verifyGeneratedDocumentation(
    rootDir,
  );

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
    'La documentación generada está sincronizada.',
  );
}

module.exports = {
  getGeneratedFiles,
  getGitChangedFiles,
  verifyGeneratedDocumentation,
};
