const fs = require('node:fs');
const path = require('node:path');

const GENERATED_DIR = path.join(
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

function extractMarkdownLinks(content) {
  const links = [];
  const pattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of content.matchAll(pattern)) {
    links.push(match[1].trim());
  }

  return links;
}

function isExternalLink(link) {
  return (
    /^(?:https?|mailto):/i.test(link) ||
    link.startsWith('#')
  );
}

function resolveInternalLink(
  filePath,
  link,
) {
  const cleanLink = link.split('#')[0];

  if (!cleanLink) {
    return null;
  }

  return path.resolve(
    path.dirname(filePath),
    cleanLink,
  );
}

function validateLinks(rootDir) {
  const generatedDirectory = path.join(
    rootDir,
    GENERATED_DIR,
  );

  const files = findMarkdownFiles(
    generatedDirectory,
  );

  const errors = [];

  for (const filePath of files) {
    const content = fs.readFileSync(
      filePath,
      'utf8',
    );

    const links = extractMarkdownLinks(
      content,
    );

    for (const link of links) {
      if (isExternalLink(link)) {
        continue;
      }

      const targetPath = resolveInternalLink(
        filePath,
        link,
      );

      if (
        targetPath &&
        !fs.existsSync(targetPath)
      ) {
        errors.push(
          `${path.relative(
            rootDir,
            filePath,
          )} -> ${link}`,
        );
      }
    }
  }

  return errors;
}

if (require.main === module) {
  const rootDir = path.resolve(
    __dirname,
    '../..',
  );

  const errors = validateLinks(rootDir);

  if (errors.length > 0) {
    console.error(
      `Se encontraron ${errors.length} enlaces internos inválidos:`,
    );

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    process.exit(1);
  }

  console.log(
    'Todos los enlaces internos de la documentación son válidos.',
  );
}

module.exports = {
  GENERATED_DIR,
  findMarkdownFiles,
  extractMarkdownLinks,
  isExternalLink,
  resolveInternalLink,
  validateLinks,
};
