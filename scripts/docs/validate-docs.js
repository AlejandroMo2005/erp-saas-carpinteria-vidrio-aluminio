const fs = require('node:fs');
const path = require('node:path');

const GENERATED_DIR = path.resolve(__dirname, '../../docs/generated');

function collectMarkdownFiles(directory, files = []) {
  if (!fs.existsSync(directory)) {
    return files;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      collectMarkdownFiles(fullPath, files);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function validateGeneratedDocumentation() {
  const files = collectMarkdownFiles(GENERATED_DIR);
  const errors = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    if (!content.trim()) {
      errors.push(`${relativePath}: archivo vacío.`);
      continue;
    }

    if (!/^#\s+\S+/m.test(content)) {
      errors.push(`${relativePath}: falta un título de nivel 1.`);
    }

    const links = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)];

    for (const [, target] of links) {
      if (/^(https?:\/\/|mailto:|#)/i.test(target)) {
        continue;
      }

      const cleanTarget = target.split('#')[0];

      if (!cleanTarget) {
        continue;
      }

      const targetPath = path.resolve(
        path.dirname(filePath),
        cleanTarget,
      );

      if (!fs.existsSync(targetPath)) {
        errors.push(
          `${relativePath}: enlace inexistente -> ${target}`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Validación de documentación fallida:\n${errors.join('\n')}`,
    );
  }

  return {
    valid: true,
    files: files.length,
  };
}

if (require.main === module) {
  const result = validateGeneratedDocumentation();

  console.log(
    `Documentación generada válida: ${result.files} archivos.`,
  );
}

module.exports = {
  validateGeneratedDocumentation,
};
