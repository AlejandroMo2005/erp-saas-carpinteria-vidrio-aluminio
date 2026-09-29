# Métricas

## Descripción

Documenta la estrategia de medición de la plataforma para obtener indicadores cuantificables sobre disponibilidad, rendimiento, uso de recursos, comportamiento de servicios y funcionamiento de componentes críticos.

Este documento se enfoca exclusivamente en la responsabilidad de métricas dentro de la observabilidad.

## Índice

- [Propósito](#propósito)
- [Tipos de métricas](#tipos-de-métricas)
- [Métricas de aplicación](#métricas-de-aplicación)
- [Métricas del backend](#métricas-del-backend)
- [Métricas de base de datos](#métricas-de-base-de-datos)
- [Métricas de Redis](#métricas-de-redis)
- [Métricas de IA](#métricas-de-ia)
- [Métricas del frontend](#métricas-del-frontend)
- [Métricas de rendimiento](#métricas-de-rendimiento)
- [Métricas de errores](#métricas-de-errores)
- [Métricas de seguridad](#métricas-de-seguridad)
- [Métricas de infraestructura](#métricas-de-infraestructura)
- [Recolección y almacenamiento](#recolección-y-almacenamiento)
- [Interpretación de métricas](#interpretación-de-métricas)
- [Estado actual](#estado-actual)
- [Aspectos pendientes](#aspectos-pendientes)
- [Documentación relacionada](#documentación-relacionada)

## Propósito

Las métricas permiten representar mediante valores cuantificables el comportamiento de la plataforma.

Su finalidad es proporcionar información que permita:

- identificar degradaciones de rendimiento;
- detectar incrementos anómalos de errores;
- observar el comportamiento de servicios;
- analizar consumo de recursos;
- evaluar disponibilidad;
- identificar tendencias;
- apoyar decisiones técnicas;
- complementar logs, trazabilidad y monitoreo.

Las métricas deben representar información útil para la operación y no generarse únicamente por el hecho de poder medir un determinado comportamiento.

## Tipos de métricas

Las métricas pueden clasificarse según el componente o comportamiento observado.

| Categoría | Propósito |
|---|---|
| Aplicación | Observar el funcionamiento de los módulos y operaciones del sistema. |
| Backend | Medir solicitudes, errores, tiempos y comportamiento del servidor. |
| Base de datos | Observar consultas, conexiones y comportamiento de MySQL. |
| Redis | Observar disponibilidad y utilización del sistema de caché y sesiones. |
| IA | Medir solicitudes, resultados, errores y duración de procesos de IA. |
| Frontend | Observar rendimiento y experiencia técnica de la interfaz. |
| Infraestructura | Medir recursos utilizados por los procesos y servicios. |
| Seguridad | Identificar comportamientos anómalos relacionados con eventos de seguridad. |

## Métricas de aplicación

Las métricas de aplicación deben representar el comportamiento de las operaciones relevantes del ERP/SaaS.

Entre las métricas que pueden resultar relevantes se encuentran:

- cantidad de solicitudes procesadas;
- cantidad de operaciones exitosas;
- cantidad de operaciones fallidas;
- tiempo de procesamiento;
- frecuencia de errores;
- cantidad de operaciones por módulo;
- comportamiento de procesos críticos.

Las métricas deben asociarse a operaciones concretas cuando esto aporte información útil para diagnóstico.

## Métricas del backend

El backend puede observarse mediante métricas relacionadas con las solicitudes HTTP y el procesamiento interno.

Entre las métricas relevantes se encuentran:

- solicitudes por unidad de tiempo;
- tasa de respuestas exitosas;
- tasa de errores;
- códigos HTTP;
- latencia;
- duración de operaciones;
- solicitudes concurrentes;
- consumo de memoria;
- reinicios de procesos;
- disponibilidad del servicio.

Estas métricas permiten complementar la información obtenida mediante los logs del backend.

## Métricas de base de datos

MySQL constituye una dependencia crítica del backend.

Las métricas relacionadas con la base de datos pueden contemplar:

- conexiones activas;
- conexiones disponibles;
- utilización del pool;
- tiempo de ejecución de consultas;
- errores de conexión;
- errores de consultas;
- bloqueos;
- transacciones;
- disponibilidad;
- comportamiento de operaciones críticas.

El objetivo es detectar problemas de persistencia que puedan afectar a los módulos de la aplicación.

La estructura y comportamiento de la base de datos se documentan en [Base de Datos](../../Base%20de%20Datos/database.md).

## Métricas de Redis

Redis se utiliza como componente de soporte para funcionalidades que requieren almacenamiento temporal y mecanismos asociados a autenticación.

Las métricas pueden contemplar:

- disponibilidad;
- conexiones;
- errores;
- utilización de memoria;
- operaciones;
- latencia;
- comportamiento de claves;
- fallos de comunicación.

Cuando Redis presenta problemas, las métricas deben permitir diferenciar un fallo del servicio de un problema producido por el backend.

La configuración de despliegue se documenta en [Redis](../../Despliegue/Redis/redis.md).

## Métricas de IA

La plataforma incorpora procesos relacionados con generación y procesamiento mediante servicios de IA.

La tabla `ia_requests` permite conservar información asociada a solicitudes de IA, incluyendo:

- tipo de trabajo;
- modelo;
- duración;
- estado;
- fecha de creación;
- usuario;
- empresa;
- hash de la imagen de entrada.

Estos datos pueden utilizarse como fuente para analizar el comportamiento de las operaciones de IA.

Las métricas relevantes pueden incluir:

- cantidad de solicitudes;
- solicitudes exitosas;
- solicitudes con error;
- solicitudes con timeout;
- duración de procesamiento;
- comportamiento por modelo;
- frecuencia de errores de servicios externos.

## Métricas del frontend

El frontend debe observarse mediante indicadores relacionados con carga, interacción y estabilidad de la interfaz.

Entre las métricas relevantes se encuentran:

- tiempo de carga;
- Largest Contentful Paint (LCP);
- Cumulative Layout Shift (CLS);
- Interaction to Next Paint (INP);
- errores de JavaScript;
- errores de solicitudes;
- tiempos de respuesta de la API;
- comportamiento de componentes críticos.

Las métricas obtenidas mediante Lighthouse forman parte de la evaluación de rendimiento del frontend.

## Métricas de rendimiento

Las métricas de rendimiento permiten identificar degradaciones antes de que se conviertan en problemas funcionales.

Deben observarse, según corresponda:

- latencia;
- throughput;
- tiempo de respuesta;
- consumo de CPU;
- consumo de memoria;
- tiempos de consultas;
- tiempos de solicitudes externas;
- tiempos de procesamiento de IA;
- rendimiento de carga del frontend.

Las pruebas de carga y rendimiento constituyen una responsabilidad relacionada pero diferenciada y se documentan en [Rendimiento](../Rendimiento/rendimiento.md).

## Métricas de errores

Las métricas de errores permiten cuantificar la frecuencia y distribución de fallos.

Pueden contemplar:

- cantidad de errores;
- porcentaje de errores;
- errores por endpoint;
- errores por módulo;
- errores por tipo;
- errores de base de datos;
- errores de Redis;
- errores de servicios externos;
- errores de autenticación;
- errores de validación.

Una métrica de errores debe poder relacionarse con los registros correspondientes cuando sea necesario realizar una investigación.

## Métricas de seguridad

Las métricas de seguridad permiten identificar patrones anómalos y apoyar la detección de incidentes.

Entre las métricas relevantes pueden encontrarse:

- intentos de autenticación fallidos;
- accesos denegados;
- solicitudes rechazadas;
- errores relacionados con autenticación;
- actividad relacionada con sesiones;
- eventos asociados con rate limiting;
- comportamiento anómalo de solicitudes.

Las métricas de seguridad no sustituyen los registros de seguridad ni la auditoría.

## Métricas de infraestructura

La infraestructura debe observarse mediante métricas que permitan identificar agotamiento o degradación de recursos.

Entre ellas:

- uso de CPU;
- memoria;
- almacenamiento;
- procesos activos;
- reinicios;
- conexiones;
- disponibilidad de servicios;
- consumo de recursos por proceso.

PM2 proporciona información operacional sobre los procesos Node.js y forma parte de la infraestructura de ejecución del backend.

La configuración relacionada con el despliegue se documenta en [Backend](../../Despliegue/Backend/backend.md).

## Recolección y almacenamiento

La estrategia definitiva de métricas debe determinar:

- qué métricas se recopilan;
- con qué frecuencia;
- dónde se almacenan;
- durante cuánto tiempo;
- quién puede consultarlas;
- cómo se relacionan con logs y trazas;
- qué métricas requieren alertas.

La plataforma debe evitar una recolección indiscriminada que produzca costos innecesarios o dificulte la interpretación de la información.

La solución concreta de monitoreo y almacenamiento dependerá del entorno de despliegue.

## Interpretación de métricas

Una métrica aislada no siempre representa un problema.

Su interpretación debe considerar:

- valor actual;
- comportamiento histórico;
- tendencia;
- frecuencia;
- duración;
- contexto de la operación;
- relación con otras métricas;
- logs asociados;
- cambios recientes en el sistema.

Por ejemplo, un incremento de latencia debe analizarse conjuntamente con errores, consumo de recursos, estado de MySQL, Redis y otros componentes involucrados.

## Estado actual

La plataforma dispone de indicadores de rendimiento obtenidos durante las evaluaciones realizadas sobre el frontend.

Entre los resultados registrados se encuentran:

- Performance: 98;
- Accessibility: 100;
- Best Practices: 100;
- SEO: 100;
- LCP: 2.45 segundos;
- CLS: 0;
- INP: 56 milisegundos.

Estos valores corresponden a una evaluación concreta y no deben interpretarse como valores permanentes del sistema.

La plataforma también conserva información relacionada con solicitudes de IA mediante la entidad `ia_requests`.

El esquema definitivo de recolección centralizada de métricas operacionales todavía debe establecerse de acuerdo con la infraestructura de despliegue.

## Aspectos pendientes

Los siguientes aspectos pueden formar parte de la evolución de la observabilidad:

- definir el catálogo definitivo de métricas;
- establecer nombres y unidades consistentes;
- implementar una solución centralizada de recolección;
- definir períodos de retención;
- establecer dashboards;
- relacionar métricas con alertas;
- integrar métricas con logs y trazabilidad;
- definir métricas específicas para pruebas de carga;
- establecer umbrales operacionales basados en evidencia.

Estos puntos no deben considerarse funcionalidades implementadas hasta contar con evidencia de su incorporación al proyecto.

## Documentación relacionada

| Documento | Relación |
|---|---|
| [Observabilidad](../observability.md) | Índice general de la documentación de observabilidad. |
| [Logging](../Logging/logging.md) | Documenta el registro de eventos técnicos y operativos. |
| [Health Checks](../Health%20Checks/health-checks.md) | Documenta la verificación del estado de servicios y dependencias. |
| [Monitoreo](../Monitoreo/monitoreo.md) | Documenta la supervisión operacional de la plataforma. |
| [Alertas](../Alertas/alertas.md) | Documenta la utilización de métricas y eventos para generar alertas. |
| [Trazabilidad](../Trazabilidad/trazabilidad.md) | Documenta el seguimiento de operaciones entre componentes. |
| [Rendimiento](../Rendimiento/rendimiento.md) | Documenta la evaluación del rendimiento de la plataforma. |
| [Seguridad](../Seguridad/seguridad.md) | Documenta las consideraciones de seguridad relacionadas con observabilidad. |
| [Diagnóstico](../Diagnostico/diagnostico.md) | Documenta el uso de evidencias para investigar problemas. |
| [Base de Datos](../../Base%20de%20Datos/database.md) | Documenta la estructura y comportamiento de la base de datos. |
| [Redis](../../Despliegue/Redis/redis.md) | Documenta el despliegue y configuración de Redis. |
| [Backend](../../Despliegue/Backend/backend.md) | Documenta el despliegue y operación del backend. |
