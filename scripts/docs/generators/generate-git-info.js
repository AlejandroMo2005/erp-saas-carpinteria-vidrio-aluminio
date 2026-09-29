const { execFileSync } = require('node:child_process');

const { writeGeneratedFile } = require('./write-file');

function runGitCommand(rootDir, args) {
  try {
    return execFileSync('git', args, {
      cwd: rootDir,
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'No disponible';
  }
}

function generateGitInfo(rootDir) {
  const branch = runGitCommand(rootDir, [
    'branch',
    '--show-current',
  ]);

  const commit = runGitCommand(rootDir, [
    'rev-parse',
    '--short',
    'HEAD',
  ]);

  const status = runGitCommand(rootDir, [
    'status',
    '--short',
  ]);

  const content = `# Información automática del repositorio

> Este archivo es generado automáticamente. No editar manualmente.

| Campo | Valor |
|---|---|
| Rama | \`${branch || 'No disponible'}\` |
| Commit | \`${commit || 'No disponible'}\` |
| Estado | \`${status ? 'Con cambios' : 'Limpio'}\` |

## Cambios pendientes

\`\`\`text
${status || 'Sin cambios pendientes.'}
\`\`\`
`;

  return writeGeneratedFile(
    rootDir,
    'docs/generated/repository/git-info.md',
    content,
  );
}

module.exports = {
  generateGitInfo,
};
