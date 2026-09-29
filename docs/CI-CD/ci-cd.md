# CI/CD

## Descripción

Este documento describe la estrategia de integración continua y las prácticas de automatización utilizadas en el proyecto ERP/SaaS.

La configuración de CI/CD permite validar los cambios mediante instalación reproducible de dependencias, análisis estático, pruebas automatizadas y generación de cobertura antes de integrar modificaciones al código.

## Objetivo

Establecer un proceso automatizado y reproducible para verificar la calidad del código, ejecutar pruebas y proporcionar evidencia técnica sobre el estado de los cambios realizados en el proyecto.

## Alcance

La estrategia de CI/CD contempla:

- GitHub Actions.
- Instalación reproducible de dependencias.
- Node.js 20.19.4.
- Linting.
- Pruebas automatizadas.
- Cobertura de código.
- Artefactos de ejecución.
- Validación del backend.
- Validación del frontend.
- Evolución hacia integración, E2E, rendimiento, seguridad y análisis de calidad.

## Plataforma

El proyecto utiliza GitHub Actions como plataforma de automatización.

Los workflows se almacenan en:

```text
.github/workflows/
```

Los workflows deben mantenerse versionados junto con el código fuente para conservar trazabilidad sobre las reglas de validación aplicadas al proyecto.

## Runtime

La ejecución automatizada utiliza Node.js 20.19.4.

La versión del runtime debe mantenerse alineada entre el entorno local y los workflows para reducir diferencias entre desarrollo y CI.

## Instalación de Dependencias

Los workflows utilizan:

```bash
npm ci
```

`npm ci` utiliza el archivo de bloqueo de dependencias para realizar una instalación reproducible.

No se debe utilizar `npm install` como sustituto dentro de los workflows destinados a validación reproducible cuando existe un `package-lock.json` válido.

## Flujo de Integración

El flujo general de validación es:

```text
Pull Request / Push
        │
        ▼
Checkout del repositorio
        │
        ▼
Configuración de Node.js
        │
        ▼
npm ci
        │
        ▼
Lint
        │
        ▼
Pruebas automatizadas
        │
        ▼
Cobertura
        │
        ▼
Artefactos
        │
        ▼
Resultado de CI
```

Cada etapa debe fallar cuando detecte una condición que impida considerar válido el cambio.

## Linting

ESLint se ejecuta como parte de la validación automatizada.

El objetivo es detectar problemas estáticos antes de integrar los cambios.

El linting debe ejecutarse mediante el script definido por el proyecto:

```bash
npm run lint
```

La corrección de problemas de linting debe realizarse en el código fuente y no mediante la desactivación indiscriminada de reglas.

## Pruebas Automatizadas

Las pruebas automatizadas se ejecutan mediante Vitest.

El comando utilizado para cobertura es:

```bash
npm run test:coverage
```

La ejecución permite comprobar el comportamiento de los componentes cubiertos por las suites de pruebas.

El resultado debe conservarse como evidencia de la validación realizada por CI.

## Cobertura

La cobertura se obtiene mediante V8.

La cobertura debe utilizarse como una métrica de apoyo para identificar áreas sin pruebas, no como sustituto de la calidad de las pruebas.

La existencia de cobertura no garantiza por sí sola que los flujos críticos, condiciones de error, concurrencia, seguridad o reglas de negocio estén correctamente validados.

## Backend

El backend dispone de un workflow específico de validación que contempla:

1. Checkout del repositorio.
2. Configuración de Node.js.
3. Instalación mediante `npm ci`.
4. Ejecución de ESLint.
5. Ejecución de pruebas con cobertura.
6. Publicación del resultado como artefacto.

El backend utiliza Vitest y V8 para sus pruebas y cobertura.

## Frontend

El frontend dispone de pruebas automatizadas mediante Vitest.

La validación del frontend debe mantener la misma disciplina de instalación reproducible y ejecución automatizada utilizada en el backend.

Las pruebas frontend deben evolucionar junto con los componentes y flujos de usuario.

## Variables de Entorno

Los workflows no deben almacenar secretos directamente en los archivos YAML.

Las variables necesarias para las pruebas deben configurarse mediante mecanismos apropiados del entorno de CI.

Los secretos deben permanecer fuera del repositorio.

Los archivos `.env` locales no deben incorporarse al control de versiones cuando contienen credenciales o información sensible.

## Dependencias Externas

Las pruebas que dependen de MySQL, Redis o servicios externos deben diferenciar entre:

- Dependencias necesarias para ejecutar la suite.
- Servicios simulados.
- Servicios de infraestructura.
- Servicios externos que requieren credenciales.

La ausencia de un servicio externo no debe interpretarse automáticamente como un defecto de la aplicación si el workflow no declara dicho servicio como requisito.

Cuando una prueba necesita infraestructura real, el workflow debe proporcionar dicha infraestructura o declarar explícitamente la dependencia.

## Artefactos

Los resultados relevantes de CI pueden conservarse como artefactos.

Entre los resultados útiles se encuentran:

- Reportes de cobertura.
- Reportes de pruebas.
- Logs de ejecución.
- Reportes E2E.
- Evidencias de análisis.

Los artefactos permiten conservar evidencia técnica de la ejecución sin modificar el código fuente.

## Pull Requests

Los Pull Requests deben utilizar CI como mecanismo de validación automática.

Antes de integrar un cambio se deben revisar:

- Resultado del workflow.
- Linting.
- Pruebas.
- Cobertura cuando corresponda.
- Cambios funcionales.
- Impacto arquitectónico.
- Impacto sobre seguridad.
- Impacto sobre persistencia.
- Documentación afectada.

El estado de CI no sustituye la revisión técnica del cambio.

## Integración Continua y Calidad

La integración continua debe detectar regresiones antes de que los cambios se incorporen a ramas compartidas.

La estrategia debe evolucionar progresivamente para incorporar:

- Pruebas unitarias.
- Pruebas de integración.
- Pruebas E2E.
- Pruebas de rendimiento.
- Análisis de seguridad.
- Análisis estático.
- Análisis de duplicación.
- Validación de reproducibilidad.

## SonarCloud

SonarCloud forma parte de la estrategia de análisis de calidad del proyecto.

Su función es complementar las pruebas y el linting mediante la identificación de problemas relacionados con:

- Confiabilidad.
- Mantenibilidad.
- Seguridad.
- Duplicación.
- Deuda técnica.

Los resultados de SonarCloud deben analizarse considerando la arquitectura actual y el proceso de migración de componentes legacy.

No se deben realizar correcciones mecánicas únicamente para reducir el número de issues. Cada cambio debe evaluarse según su impacto real sobre la arquitectura y el comportamiento del sistema.

## Seguridad en CI/CD

Los workflows deben tratarse como parte de la superficie de seguridad del proyecto.

Se deben controlar:

- Permisos de GitHub Actions.
- Secretos.
- Dependencias utilizadas por los workflows.
- Versiones de actions.
- Ejecución de código proveniente de Pull Requests.
- Exposición de variables de entorno.
- Artefactos generados.

Las acciones de terceros deben mantenerse controladas y actualizarse de manera deliberada.

## Reproducibilidad

Una ejecución de CI debe producir resultados consistentes cuando se ejecuta sobre el mismo estado del repositorio y las mismas condiciones declaradas.

Para favorecer la reproducibilidad:

- Se utiliza `npm ci`.
- Se mantiene el lockfile.
- Se fija la versión de Node.js.
- Los workflows se almacenan en el repositorio.
- Las pruebas deben minimizar dependencias implícitas del entorno local.

## Fallos de CI

Cuando un workflow falla, el diagnóstico debe comenzar por identificar la etapa responsable.

```text
Workflow
   │
   ├── Instalación
   ├── Lint
   ├── Tests
   ├── Coverage
   ├── E2E
   ├── Seguridad
   └── Análisis de calidad
```

Un fallo de infraestructura de CI debe diferenciarse de un fallo funcional de la aplicación.

Los errores deben analizarse antes de modificar el código para evitar introducir cambios innecesarios.

## Evolución del Pipeline

La estrategia de CI/CD debe evolucionar junto con la madurez del proyecto.

Las etapas adicionales previstas para la validación integral incluyen:

- Integración frontend-backend.
- E2E.
- Rendimiento y carga.
- DAST.
- SonarCloud.
- Docker y reproducibilidad.
- Validaciones adicionales de seguridad.
- Automatización del despliegue.

Cada etapa debe incorporarse cuando exista una configuración reproducible y una evidencia verificable de su ejecución.

## Despliegue

La automatización de CI no implica que todos los workflows realicen despliegues automáticos.

La estrategia de despliegue se documenta de forma independiente en:

[`docs/Despliegue/deployment.md`](../Despliegue/deployment.md)

La separación permite mantener independientes las responsabilidades de validación y despliegue.

## Evidencia

Los resultados de CI constituyen evidencia técnica del estado del proyecto.

La evidencia debe permitir identificar:

- Commit evaluado.
- Workflow ejecutado.
- Fecha de ejecución.
- Etapas ejecutadas.
- Resultado.
- Pruebas ejecutadas.
- Cobertura generada.
- Artefactos disponibles.

La evidencia no debe sustituir la documentación de decisiones técnicas.

## Mantenimiento

Los workflows deben actualizarse cuando cambien:

- Versiones de Node.js.
- Scripts del proyecto.
- Herramientas de testing.
- Estructura del repositorio.
- Requisitos de seguridad.
- Herramientas de análisis.
- Estrategia de despliegue.

Todo cambio relevante en CI/CD debe validarse ejecutando nuevamente el workflow completo.

## Documentación Relacionada

- [`Arquitectura`](../Arquitectura/architecture.md)
- [`Contratos de API`](../API/api-contracts.md)
- [`Base de Datos`](../Base%20de%20Datos/database.md)
- [`Decisiones Técnicas`](../Decisiones%20Técnicas/decisions.md)
- [`Deuda Técnica`](../Decisiones%20Técnicas/technical-debt.md)
- [`Despliegue`](../Despliegue/deployment.md)
- [`Observabilidad`](../Observabilidad/observability.md)
- [`Solución de Problemas`](../Solucion%20de%20Problemas/troubleshooting.md)
