const path = require('node:path');

const { writeGeneratedFile } = require('./write-file');

function generateDocumentationIndex(rootDir) {
  const content = `# Documentación generada

> Este archivo es generado automáticamente. No editar manualmente.

La documentación de este directorio proviene de fuentes técnicas del proyecto y puede regenerarse mediante el flujo automatizado.

## Arquitectura

- [Estructura del proyecto](./architecture/project-structure.md)

## API

- [Catálogo de endpoints](./api/endpoints.md)

## Proyecto

- [Metadatos del proyecto](./project-metadata.md)
- [Dependencias](./dependencies.md)

## Calidad

- [Evidencia automática de pruebas](./quality/tests.md)
`;

  return writeGeneratedFile(
    rootDir,
    path.join('docs', 'generated', 'README.md'),
    content,
  );
}

module.exports = {
  generateDocumentationIndex,
};
