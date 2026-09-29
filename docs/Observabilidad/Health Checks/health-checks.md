# Health Checks

## Descripción

Documenta los mecanismos utilizados para comprobar el estado operativo de la plataforma y sus dependencias principales. Este documento se enfoca exclusivamente en la responsabilidad de health checks dentro de la observabilidad.

## Índice

- [Propósito](#propósito)
- [Tipos de health checks](#tipos-de-health-checks)
- [Health check del backend](#health-check-del-backend)
- [Disponibilidad de MySQL](#disponibilidad-de-mysql)
- [Disponibilidad de Redis](#disponibilidad-de-redis)
- [Dependencias externas](#dependencias-externas)
- [Liveness](#liveness)
- [Readiness](#readiness)
- [Estados de respuesta](#estados-de-respuesta)
- [Uso durante el desarrollo](#uso-durante-el-desarrollo)
- [Uso en CI/CD](#uso-en-cicd)
- [Uso durante el despliegue](#uso-durante-el-despliegue)
- [Monitoreo](#monitoreo)
- [Seguridad](#seguridad)
- [Estado actual](#estado-actual)
- [Aspectos pendientes](#aspectos-pendientes)
- [Documentación relacionada](#documentación-relacionada)

## Propósito

Los health checks permiten determinar si un servicio está disponible y si sus dependencias esenciales se encuentran en condiciones de operar.

Su finalidad es proporcionar una señal objetiva sobre el estado de los componentes, facilitando:

- detección de indisponibilidad;
- diagnóstico inicial;
- validación de despliegues;
- monitoreo;
- recuperación ante fallos;
- automatización de verificaciones;
- diferenciación entre un proceso activo y un servicio realmente operativo.

Un health check no sustituye las métricas, logs, trazabilidad ni las pruebas funcionales.

## Tipos de health checks

Los health checks pueden clasificarse según el nivel de comprobación.

| Tipo | Propósito |
|---|---|
| Liveness | Determinar si el proceso continúa ejecutándose correctamente. |
| Readiness | Determinar si el servicio está preparado para atender solicitudes. |
| Dependencia | Comprobar servicios requeridos por la aplicación. |
| Integridad | Verificar condiciones mínimas necesarias para operar. |

La separación entre estos mecanismos evita considerar disponible una aplicación que mantiene el proceso activo pero no puede utilizar sus dependencias principales.

## Health check del backend

El backend dispone de un endpoint de salud:

```text
GET /health
```

Este endpoint forma parte de los mecanismos de comprobación de disponibilidad del backend.

La comprobación se ejecuta sobre el servidor y permite validar el estado de componentes necesarios para la operación.

El health check debe mantenerse ligero y no ejecutar operaciones costosas o procesos de negocio que puedan afectar el rendimiento del servicio.

## Disponibilidad de MySQL

MySQL constituye una dependencia esencial del backend.

El health check del backend considera el estado de la conexión con la base de datos para determinar si la aplicación puede operar correctamente.

La comprobación debe permitir distinguir entre:

- backend disponible con base de datos disponible;
- backend activo pero base de datos no disponible;
- error de conexión;
- error de consulta;
- configuración incorrecta de la conexión.

La información estructural de MySQL se documenta en [Base de Datos](../../Base%20de%20Datos/database.md).

## Disponibilidad de Redis

Redis forma parte de la infraestructura de soporte utilizada por el backend.

Cuando una funcionalidad crítica depende de Redis, su estado debe poder verificarse de forma independiente.

El health check debe permitir identificar cuando:

- Redis está disponible;
- Redis no responde;
- existe un error de conexión;
- existe una configuración incorrecta;
- la aplicación no puede utilizar una funcionalidad que depende de Redis.

La configuración de Redis se documenta en [Redis](../../Despliegue/Redis/redis.md).

## Dependencias externas

La plataforma utiliza servicios externos para determinadas funcionalidades, particularmente procesos relacionados con IA.

Las dependencias externas deben diferenciarse de las dependencias internas.

Un servicio externo no disponible no necesariamente significa que todo el backend esté caído. El estado debe interpretarse según la criticidad de la funcionalidad afectada.

Las comprobaciones contra servicios externos deben evitar solicitudes costosas o innecesarias únicamente para determinar el estado general de la aplicación.

## Liveness

El liveness check responde a una pregunta concreta:

> ¿El proceso de la aplicación continúa ejecutándose?

Su objetivo es detectar procesos que dejaron de funcionar correctamente y requieren reinicio o intervención.

El liveness check debe ser simple y rápido.

No debe depender necesariamente de todas las dependencias externas, ya que un fallo de MySQL, Redis o un proveedor externo no implica automáticamente que el proceso Node.js haya dejado de estar vivo.

## Readiness

El readiness check responde a una pregunta diferente:

> ¿La aplicación está preparada para recibir y procesar solicitudes?

Para responder esta pregunta pueden evaluarse las dependencias necesarias para el funcionamiento normal.

Entre ellas pueden encontrarse:

- MySQL;
- Redis;
- configuración requerida;
- componentes internos esenciales.

La separación entre liveness y readiness permite evitar que un proceso saludable sea reiniciado únicamente porque una dependencia temporalmente no disponible afecta su capacidad de servicio.

## Estados de respuesta

Los health checks deben utilizar códigos HTTP coherentes con el estado detectado.

De forma general:

| Estado | Interpretación |
|---|---|
| `200 OK` | El servicio se encuentra disponible según la comprobación realizada. |
| `503 Service Unavailable` | El servicio no está preparado para operar correctamente. |
| `500 Internal Server Error` | Se produjo un error interno durante la comprobación. |

El código utilizado debe representar el estado real de la comprobación y no ocultar fallos de dependencias críticas.

## Uso durante el desarrollo

Durante el desarrollo, los health checks permiten verificar rápidamente si el backend y sus dependencias están funcionando.

Pueden utilizarse para comprobar:

- inicio correcto del backend;
- conexión con MySQL;
- disponibilidad de Redis;
- configuración del entorno;
- cambios realizados en infraestructura.

Esto reduce la necesidad de ejecutar manualmente operaciones funcionales para determinar si los servicios básicos están disponibles.

## Uso en CI/CD

Los health checks pueden utilizarse como verificaciones posteriores al inicio de servicios en pipelines de integración y despliegue.

Una estrategia de CI/CD puede utilizarlos para:

1. iniciar el servicio;
2. esperar su disponibilidad;
3. consultar el endpoint de salud;
4. verificar la respuesta;
5. continuar o detener el proceso según el resultado.

Los health checks no sustituyen las pruebas unitarias, integración ni E2E.

La estrategia general de CI/CD se documenta en [CI/CD](../../CI-CD/ci-cd.md).

## Uso durante el despliegue

Después de un despliegue, los health checks permiten comprobar que el nuevo proceso se encuentra operativo.

Una validación posterior al despliegue puede comprobar:

- disponibilidad del backend;
- disponibilidad de MySQL;
- disponibilidad de Redis;
- respuesta HTTP;
- configuración necesaria;
- estado general del servicio.

Esta comprobación puede formar parte de una estrategia de rollback cuando un nuevo despliegue no alcanza el estado esperado.

La estrategia de recuperación se documenta en [Rollback](../../Despliegue/Recuperacion/rollback.md).

## Monitoreo

Los health checks proporcionan señales que pueden ser consumidas por sistemas de monitoreo.

El monitoreo puede utilizar estas señales para:

- detectar indisponibilidad;
- generar alertas;
- identificar interrupciones;
- comprobar recuperación;
- registrar períodos de degradación.

El health check debe mantenerse independiente de la lógica de generación de alertas.

La estrategia general de monitoreo se documenta en [Monitoreo](../Monitoreo/monitoreo.md).

## Seguridad

Los endpoints de health check deben exponer únicamente la información necesaria para determinar el estado del servicio.

No deben devolver:

- credenciales;
- tokens;
- secretos;
- variables de entorno completas;
- información interna innecesaria;
- detalles de infraestructura que puedan facilitar ataques.

Los mensajes de error destinados a diagnóstico interno no deben exponerse directamente al cliente.

Cuando sea necesario proporcionar información adicional para monitoreo interno, debe diferenciarse entre endpoints públicos y mecanismos internos de observabilidad.

## Estado actual

El backend dispone de:

```text
GET /health
```

El health check existente realiza comprobaciones relacionadas con la base de datos y las tablas necesarias para determinar el estado del backend.

La aplicación también dispone de mecanismos de conexión con Redis y otros componentes que forman parte de la infraestructura.

El health check debe considerarse una señal de disponibilidad y no una prueba completa de funcionamiento de todos los módulos de negocio.

## Aspectos pendientes

Los siguientes aspectos pueden formar parte de la evolución de los health checks:

- separar formalmente liveness y readiness cuando la infraestructura lo requiera;
- definir el catálogo definitivo de dependencias críticas;
- establecer respuestas estandarizadas;
- integrar health checks con monitoreo;
- integrar health checks con alertas;
- incorporar validaciones posteriores al despliegue;
- definir comportamiento ante fallos parciales;
- establecer políticas para recuperación automática.

Estos puntos no deben considerarse funcionalidades implementadas hasta contar con evidencia de su incorporación al proyecto.

## Documentación relacionada

| Documento | Relación |
|---|---|
| [Observabilidad](../observability.md) | Índice general de la documentación de observabilidad. |
| [Logging](../Logging/logging.md) | Documenta los registros generados durante la operación y diagnóstico. |
| [Métricas](../Metricas/metricas.md) | Documenta las métricas utilizadas para observar el estado de la plataforma. |
| [Monitoreo](../Monitoreo/monitoreo.md) | Documenta la supervisión de los health checks y demás señales. |
| [Alertas](../Alertas/alertas.md) | Documenta las alertas asociadas con estados anómalos. |
| [Diagnóstico](../Diagnostico/diagnostico.md) | Documenta la investigación de fallos detectados mediante observabilidad. |
| [CI/CD](../../CI-CD/ci-cd.md) | Documenta los procesos de integración y despliegue. |
| [Backend](../../Despliegue/Backend/backend.md) | Documenta el despliegue y operación del backend. |
| [MySQL](../../Despliegue/MySQL/mysql.md) | Documenta el despliegue y configuración de MySQL. |
| [Redis](../../Despliegue/Redis/redis.md) | Documenta el despliegue y configuración de Redis. |
| [Rollback](../../Despliegue/Recuperacion/rollback.md) | Documenta la recuperación ante despliegues fallidos. |
