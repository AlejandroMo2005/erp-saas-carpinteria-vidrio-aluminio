# CI/CD de despliegue

## Descripción

El proceso de CI/CD de despliegue automatiza las validaciones y operaciones necesarias para llevar una versión del proyecto desde el repositorio hasta un entorno de ejecución.

El pipeline debe separar claramente las etapas de validación, construcción, publicación y despliegue. Las operaciones de producción deben ejecutarse únicamente después de superar las validaciones establecidas para el entorno.

Este documento se concentra en el despliegue. La configuración general de CI/CD se encuentra en [CI/CD](../../CI-CD/ci-cd.md).

---

## Objetivo

El proceso de CI/CD de despliegue debe permitir:

- Validar cambios antes de desplegarlos.
- Mantener trazabilidad entre código y versión desplegada.
- Construir artefactos reproducibles.
- Separar los entornos.
- Gestionar secretos sin incorporarlos al repositorio.
- Automatizar despliegues cuando corresponda.
- Reducir errores manuales.
- Facilitar rollback.
- Generar evidencia de las validaciones realizadas.
- Mantener controles de seguridad durante el ciclo de entrega.

---

## Principios

El proceso debe seguir estos principios:

1. **Validar antes de desplegar.**
2. **Construir a partir de código versionado.**
3. **Mantener separados los entornos.**
4. **No almacenar secretos en el repositorio.**
5. **Mantener trazabilidad de cada despliegue.**
6. **Promover artefactos previamente validados.**
7. **Evitar modificaciones manuales sobre artefactos desplegados.**
8. **Permitir recuperación ante fallos.**
9. **Conservar evidencia suficiente de las ejecuciones.**
10. **No convertir CI/CD en un mecanismo para ocultar problemas arquitectónicos.**

---

## Flujo general

El flujo esperado es:

```text
Commit / Pull Request
        |
        v
Checkout
        |
        v
Instalación de dependencias
        |
        v
Lint
        |
        v
Pruebas unitarias
        |
        v
Pruebas de integración
        |
        v
Pruebas E2E
        |
        v
Build
        |
        v
Análisis de seguridad
        |
        v
Artefacto
        |
        v
Staging
        |
        v
Validación
        |
        v
Producción
