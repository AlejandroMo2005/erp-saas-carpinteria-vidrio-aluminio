const { execFileSync } = require('node:child_process');

const {
  formatTable,
  formatCode,
} = require('./format-markdown');
const { writeGeneratedFile } = require('./write-file');

function runGitCommand(rootDir, args) {
  try {
    return execFileSync(
      'git',
      args,
      {
        cwd: rootDir,
        encoding: 'utf8',
      },
    ).trim();
  } catch {
    return 'No disponible';
  }
}

function generateGitInfo(rootDir) {
  const branch = runGitCommand(
    rootDir,
    ['branch', '--show-current'],
  );

  const commit = runGitCommand(
    rootDir,
    ['rev-parse', '--short', 'HEAD'],
  );

  const status = runGitCommand(
    rootDir,
    ['status', '--short'],
  );

  const branchValue =
    branch || 'No disponible';

  const commitValue =
    commit || 'No disponible';

  const statusValue = status
    ? 'Con cambios'
    : 'Limpio';

  const content = [
    '# Información automática del repositorio',
    '',
    formatTable(
      ['Campo', 'Valor'],
      [
        [
          'Rama',
          formatCode(branchValue),
        ],
        [
          'Commit',
          formatCode(commitValue),
        ],
        [
          'Estado',
          formatCode(statusValue),
        ],
      ],
    ),
    '',
    '## Cambios pendientes',
    '',
    formatCode(
      status || 'Sin cambios pendientes.',
      'text',
    ),
    '',
  ].join('\n');

  return writeGeneratedFile(
    rootDir,
    'docs/generated/repository/git-info.md',
    content,
  );
}

module.exports = {
  runGitCommand,
  generateGitInfo,
};
