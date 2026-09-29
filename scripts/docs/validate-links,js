const fs = require('node:fs');
const path = require('node:path');

const MARKDOWN_LINK_PATTERN = /\]\(([^)]+)\)/g;

function findMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findMarkdownFiles(entryPath);
    }

    return entry.name.endsWith('.md') ? [entryPath] : [];
  });
}

function isExternalLink(target) {
  return /^(https?:|mailto:|#)/i.test(target);
}

function validateLinks(rootDir) {
  const docsDirectory = path.join(rootDir, 'docs');
  const files = findMarkdownFiles(docsDirectory);
  const errors = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');

    for (const match of content.matchAll(MARKDOWN_LINK_PATTERN)) {
      const target = match[1].trim();

      if (isExternalLink(target)) {
        continue;
      }

      const cleanTarget = target.split('#')[0];

      if (!cleanTarget) {
        continue;
      }

      const resolvedPath = path.resolve(
        path.dirname(filePath),
        cleanTarget,
      );

      if (!fs.existsSync(resolvedPath)) {
        errors.push(
          `${path.relative(rootDir, filePath)} -> ${target}`,
        );
      }
    }
  }

  return errors;
}

module.exports = {
  validateLinks,
};
