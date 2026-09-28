# CI/CD

## Propósito

La integración y entrega continua (CI/CD) establece un flujo automatizado para validar los cambios del proyecto antes de integrarlos y facilitar su preparación para despliegue.

El flujo está orientado a detectar errores de calidad, pruebas, linting y construcción antes de que los cambios avancen hacia etapas posteriores del ciclo de desarrollo.

## Flujo general

```text
Commit / Pull Request
        ↓
Checkout del repositorio
        ↓
Configuración de Node.js
        ↓
Instalación de dependencias
        ↓
Lint
        ↓
Pruebas automatizadas
        ↓
Cobertura
        ↓
Construcción / validaciones adicionales
        ↓
Artefactos y resultados
