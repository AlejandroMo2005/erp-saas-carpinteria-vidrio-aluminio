#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '../..');

function verifyGeneratedDocumentation() {
  try {
    const status = execFileSync(
      'git',
      ['status', '--short', '--', 'docs/generated'],
      {
        cwd: ROOT_DIR,
        encoding: 'utf8',
      },
    ).trim();

    if (status) {
      console.error(
        'La documentación generada produjo cambios en docs/generated/.',
      );
      console.error('\nCambios detectados:\n');
      console.error(status);

      process.exit(1);
    }

    console.log(
      'La documentación generada está sincronizada con el repositorio.',
    );
  } catch (error) {
    console.error(
      `No fue posible verificar la documentación generada: ${error.message}`,
    );
    process.exit(1);
  }
}

verifyGeneratedDocumentation();
