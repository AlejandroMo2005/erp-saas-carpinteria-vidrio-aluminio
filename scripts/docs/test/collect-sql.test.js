const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  collectSqlFiles,
  collectDatabaseSources,
} = require('../generators/collect-sql');

describe('collect-sql', () => {
  let temporaryRoot;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'docs-sql-'),
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });

  it('recopila archivos SQL del proyecto', () => {
    fs.mkdirSync(
      path.join(
        temporaryRoot,
        'database',
      ),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'schema.sql',
      ),
      'CREATE TABLE clientes (id INT);',
      'utf8',
    );

    const files = collectSqlFiles(
      temporaryRoot,
    );

    expect(files).toHaveLength(1);
    expect(files[0]).toContain(
      path.join(
        'database',
        'schema.sql',
      ),
    );
  });

  it('recopila archivos SQL dentro de subdirectorios', () => {
    const directory = path.join(
      temporaryRoot,
      'database',
      'migrations',
      'v1',
    );

    fs.mkdirSync(directory, {
      recursive: true,
    });

    fs.writeFileSync(
      path.join(
        directory,
        '001-init.sql',
      ),
      'CREATE TABLE clientes (id INT);',
      'utf8',
    );

    const files = collectSqlFiles(
      temporaryRoot,
    );

    expect(files).toHaveLength(1);
    expect(files[0]).toContain(
      path.join(
        'database',
        'migrations',
        'v1',
        '001-init.sql',
      ),
    );
  });

  it('ignora directorios excluidos', () => {
    const excludedDirectories = [
      'node_modules',
      'coverage',
      'dist',
      'build',
      '.git',
    ];

    for (const directory of excludedDirectories) {
      const targetDirectory = path.join(
        temporaryRoot,
        directory,
      );

      fs.mkdirSync(targetDirectory, {
        recursive: true,
      });

      fs.writeFileSync(
        path.join(
          targetDirectory,
          'schema.sql',
        ),
        'CREATE TABLE test (id INT);',
        'utf8',
      );
    }

    expect(
      collectSqlFiles(temporaryRoot),
    ).toEqual([]);
  });

  it('devuelve una lista vacía cuando no existen fuentes SQL', () => {
    expect(
      collectSqlFiles(temporaryRoot),
    ).toEqual([]);
  });

  it('expone las fuentes de base de datos mediante collectDatabaseSources', () => {
    fs.mkdirSync(
      path.join(
        temporaryRoot,
        'database',
      ),
      { recursive: true },
    );

    fs.writeFileSync(
      path.join(
        temporaryRoot,
        'database',
        'schema.sql',
      ),
      'CREATE TABLE clientes (id INT);',
      'utf8',
    );

    const files = collectDatabaseSources(
      temporaryRoot,
    );

    expect(files).toHaveLength(1);
    expect(files[0]).toContain(
      'schema.sql',
    );
  });
});
