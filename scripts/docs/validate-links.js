const fs = require('node:fs');
const path = require('node:path');

const GENERATED_DIR = path.join(
  'docs',
  'generated',
);

function findMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(
    directory,
    { withFileTypes: true },
  ).flatMap((entry) => {
    const entryPath = path.join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      return findMarkdownFiles(entryPath);
    }

    return entry.name.endsWith('.md')
      ? [entryPath]
      : [];
  });
}

function extractMarkdownLinks(content) {
  const links = [];
  const pattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of content.matchAll(pattern)) {
    links.push(match[1]);
  }

  return links;
}

function isExternalLink(link) {
  return (
    link.startsWith('http://') ||
    link.startsWith('https://') ||
    link.startsWith('mailto:') ||
    link.startsWith('#')
  );
}

function resolveInternalLink(filePath, link) {
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
          `${path.relative(rootDir, filePath)} -> ${link}`,
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
  extractMarkdownLinks,
  isExternalLink,
  resolveInternalLink,
  validateLinks,
};
