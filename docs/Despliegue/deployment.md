# Despliegue

## Descripción

Este documento funciona como índice de la documentación de despliegue del sistema ERP/SaaS. La información se encuentra organizada por arquitectura, entornos, infraestructura, configuración, servicios, automatización, operación, seguridad y recuperación.

## Arquitectura de despliegue

La arquitectura general y la comunicación entre frontend, backend, MySQL y Redis se documentan en:

- [Arquitectura de despliegue](./Arquitectura/arquitectura-despliegue.md)

## Entornos

La configuración y propósito de cada entorno se documentan por separado:

- [Desarrollo](./Entornos/desarrollo.md)
- [Testing](./Entornos/testing.md)
- [Staging](./Entornos/staging.md)
- [Producción](./Entornos/produccion.md)

## Infraestructura

- [Requisitos de infraestructura](./Infraestructura/requisitos-infraestructura.md)

## Configuración

- [Configuración del entorno](./Configuracion/configuracion-entorno.md)
- [Variables de entorno](./Configuracion/variables-entorno.md)
- [Gestión de secretos](./Configuracion/secretos.md)

## Frontend

- [Despliegue del frontend](./Frontend/frontend.md)

## Backend

- [Despliegue del backend](./Backend/backend.md)

## MySQL

- [Configuración y operación de MySQL](./MySQL/mysql.md)

## Redis

- [Configuración y operación de Redis](./Redis/redis.md)

## Docker

- [Docker y contenedores](./Docker/docker.md)

## CI/CD

- [Despliegue mediante CI/CD](./CI-CD/ci-cd-deployment.md)

## Operación

- [Health Checks](./Operacion/health-checks.md)
- [Monitoreo](./Operacion/monitoreo.md)
- [Logs](./Operacion/logs.md)

## Seguridad

- [Seguridad del despliegue](./Seguridad/seguridad-despliegue.md)

## Red

- [HTTPS](./Red/https.md)
- [Dominios](./Red/dominios.md)

## Escalabilidad

- [Estrategia de escalabilidad](./Escalabilidad/escalabilidad.md)

## Recuperación

- [Rollback](./Recuperacion/rollback.md)
- [Recuperación ante fallos](./Recuperacion/recuperacion-fallos.md)
- [Continuidad del servicio](./Recuperacion/continuidad-servicio.md)

## Checklists

Los procedimientos de despliegue y las verificaciones asociadas se documentan dentro de los documentos correspondientes de cada entorno, CI/CD y recuperación.

## Historial de cambios

Los cambios relevantes de la estrategia de despliegue deben registrarse mediante commits y actualizarse en los documentos afectados.
