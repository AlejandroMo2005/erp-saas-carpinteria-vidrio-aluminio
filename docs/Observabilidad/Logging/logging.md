# Logging

## Descripción

Documenta la estrategia de registro de eventos de la plataforma, incluyendo el sistema utilizado, niveles de severidad, estructura de los registros, contexto, seguridad, manejo de errores y uso operacional. Este documento se enfoca exclusivamente en la responsabilidad de logging dentro de la observabilidad de la plataforma.

## Índice

- [Propósito](#propósito)
- [Sistema de logging](#sistema-de-logging)
- [Niveles de log](#niveles-de-log)
- [Estructura y formato](#estructura-y-formato)
- [Contexto de los registros](#contexto-de-los-registros)
- [Eventos registrados](#eventos-registrados)
- [Logging de errores](#logging-de-errores)
- [Logging de autenticación y seguridad](#logging-de-autenticación-y-seguridad)
- [Logging de operaciones críticas](#logging-de-operaciones-críticas)
- [Protección de información sensible](#protección-de-información-sensible)
- [Log Injection](#log-injection)
- [Gestión por entorno](#gestión-por-entorno)
- [Persistencia y gestión de logs](#persistencia-y-gestión-de-logs)
- [Integración con PM2](#integración-con-pm2)
- [Uso para diagnóstico](#uso-para-diagnóstico)
- [Estado actual](#estado-actual)
- [Aspectos pendientes](#aspectos-pendientes)
- [Documentación relacionada](#documentación-relacionada)

## Propósito

El logging proporciona evidencia técnica sobre el comportamiento de la aplicación durante su ejecución.

Su finalidad principal es permitir:

- identificar errores;
- diagnosticar fallos;
- conocer eventos relevantes de la aplicación;
- investigar incidentes;
- analizar operaciones críticas;
- apoyar el monitoreo;
- complementar la auditoría;
- facilitar el mantenimiento de la plataforma.

Los logs deben registrar información suficiente para comprender un evento sin convertirse en un mecanismo para almacenar indiscriminadamente información de negocio o datos sensibles.

## Sistema de logging

El backend utiliza Winston como biblioteca de logging.

La implementación principal del logger se encuentra en:

```text
backend/src/shared/utils/logger.js
```

Esta ubicación corresponde a la arquitectura modular actual del backend.

También existe un archivo de compatibilidad:

```text
backend/utils/logger.js
```

La existencia de esta referencia permite mantener compatibilidad con componentes que todavía dependen de la estructura anterior mientras continúa la migración arquitectónica.

El sistema centralizado permite mantener un comportamiento uniforme para los registros generados desde diferentes módulos.

La centralización evita que cada controlador, servicio o middleware implemente mecanismos independientes de logging.

## Niveles de log

Los registros se clasifican de acuerdo con su severidad y finalidad.

| Nivel | Finalidad |
|---|---|
| `error` | Registra errores que afectan una operación o requieren investigación. |
| `warn` | Registra situaciones anómalas que no necesariamente interrumpen la operación. |
| `info` | Registra eventos operativos relevantes. |
| `debug` | Registra información útil para diagnóstico durante desarrollo o investigación técnica. |

La selección del nivel debe responder a la importancia real del evento.

Un evento esperado no debe registrarse como `error`, mientras que un fallo que impide completar una operación no debe ocultarse como información de diagnóstico de baja prioridad.

## Estructura y formato

Los registros deben mantener una estructura consistente para facilitar su lectura, búsqueda y análisis.

Como mínimo, un evento de log debe permitir identificar:

- nivel;
- mensaje;
- momento del evento;
- módulo o componente relacionado;
- información contextual necesaria;
- error asociado cuando corresponda.

El formato utilizado debe ser compatible con las necesidades operativas del backend y con las herramientas utilizadas posteriormente para diagnóstico y monitoreo.

Las funciones auxiliares del logger permiten centralizar formatos y eventos recurrentes en lugar de construir mensajes diferentes en cada módulo.

## Contexto de los registros

El contexto permite determinar qué componente generó un evento y qué operación estaba ejecutándose.

Dependiendo del evento, puede resultar relevante registrar:

- módulo;
- controlador;
- servicio;
- operación;
- usuario;
- empresa;
- identificador del registro;
- recurso afectado;
- tipo de operación;
- error producido.

El contexto debe limitarse a la información necesaria para diagnóstico.

No se debe incorporar información sensible únicamente para hacer que un log sea más detallado.

## Eventos registrados

El sistema dispone de funciones auxiliares para registrar eventos operativos y de seguridad.

Entre los eventos contemplados se encuentran:

- inicio de sesión exitoso;
- intento de inicio de sesión fallido;
- cierre de sesión;
- acceso denegado;
- eventos relacionados con stock;
- errores de aplicación;
- operaciones relacionadas con autenticación;
- eventos operativos relevantes.

Los eventos que requieren persistencia como evidencia de auditoría tienen una responsabilidad diferente y se almacenan mediante el mecanismo de auditoría de la base de datos.

La diferencia entre ambos mecanismos es importante:

| Logging | Auditoría |
|---|---|
| Orientado al diagnóstico y operación. | Orientada al registro persistente de acciones auditables. |
| Puede contener información técnica. | Registra eventos definidos como auditables. |
| Se utiliza para investigar fallos. | Se utiliza como evidencia de acciones realizadas. |
| Su estructura responde a necesidades operativas. | Su estructura está definida por la entidad de auditoría. |

La implementación de auditoría se documenta en [Auditoría](../Auditoria/auditoria.md).

## Logging de errores

Los errores deben registrarse con información suficiente para determinar:

- qué operación falló;
- dónde ocurrió;
- qué tipo de error se produjo;
- qué módulo estaba involucrado;
- qué contexto técnico es necesario para investigar el problema.

Cuando se dispone de un objeto de error, el logger debe conservar información técnica útil sin exponer datos sensibles.

El cliente no debe recibir automáticamente información interna del error únicamente porque esta haya sido registrada en el servidor.

La información detallada del servidor y la respuesta pública de la API deben mantenerse como responsabilidades separadas.

## Logging de autenticación y seguridad

Los procesos de autenticación y autorización requieren registros específicos debido a su relevancia para la seguridad.

Entre los eventos relevantes se encuentran:

- inicio de sesión exitoso;
- inicio de sesión fallido;
- cierre de sesión;
- acceso denegado;
- eventos relacionados con sesiones;
- eventos relacionados con tokens cuando sean necesarios para diagnóstico.

Los registros de seguridad no deben contener tokens completos, contraseñas ni secretos.

Cuando un identificador técnico sea necesario para investigar un evento, debe utilizarse únicamente la información necesaria para correlacionar el evento.

## Logging de operaciones críticas

Las operaciones críticas de la plataforma requieren registros que permitan investigar fallos y comportamiento inesperado.

Entre las áreas que pueden requerir logging se encuentran:

- autenticación;
- autorización;
- inventario;
- proformas;
- pedidos;
- facturación;
- persistencia;
- MySQL;
- Redis;
- integración con servicios externos;
- procesamiento de IA.

El objetivo no es registrar cada operación indiscriminadamente, sino disponer de evidencia suficiente cuando una operación pueda producir un impacto funcional, técnico o de seguridad.

## Protección de información sensible

Los logs deben tratarse como información potencialmente sensible.

No deben registrarse directamente:

- contraseñas;
- tokens de acceso;
- refresh tokens;
- claves privadas;
- secretos de configuración;
- credenciales de bases de datos;
- credenciales de servicios externos;
- valores completos de cookies sensibles.

También debe evitarse registrar información personal o empresarial que no sea necesaria para el propósito del evento.

La información recibida desde solicitudes HTTP debe considerarse potencialmente no confiable antes de incorporarla a un registro.

## Log Injection

Las entradas controladas por usuarios pueden contener caracteres o secuencias que afecten la interpretación de los registros.

Por esta razón, los valores externos utilizados en mensajes de logging deben manejarse de manera segura.

Se debe evitar:

- concatenar directamente entradas no confiables en mensajes estructurados;
- permitir que una entrada externa simule eventos adicionales;
- registrar contenido sin considerar caracteres de control;
- incorporar grandes cantidades de contenido proveniente del usuario sin necesidad.

Los controles de validación existentes en la aplicación contribuyen a reducir este riesgo, pero el logging debe mantener su propia responsabilidad de tratamiento seguro de los datos.

## Gestión por entorno

El comportamiento del logging debe adaptarse al entorno.

### Desarrollo

Debe proporcionar información suficiente para diagnosticar errores durante la construcción y las pruebas de la aplicación.

### Testing

Debe permitir identificar fallos de pruebas, errores de integración y problemas de configuración.

### Staging

Debe aproximarse al comportamiento operativo de producción y permitir validar los mecanismos de observabilidad antes de un despliegue productivo.

### Producción

Debe priorizar:

- errores;
- advertencias relevantes;
- eventos operativos;
- eventos de seguridad;
- información necesaria para diagnóstico.

Debe evitarse el exceso de logs de diagnóstico que produzca ruido operacional o incremente innecesariamente el almacenamiento.

La configuración general de cada entorno se documenta en [Configuración de entorno](../../Despliegue/Configuracion/configuracion-entorno.md).

## Persistencia y gestión de logs

El sistema de logging debe considerar el ciclo de vida de los registros.

La gestión operacional debe contemplar:

- ubicación de los archivos;
- permisos;
- rotación;
- retención;
- tamaño;
- disponibilidad para diagnóstico;
- eliminación controlada de registros antiguos.

La estrategia concreta de almacenamiento y retención debe definirse de acuerdo con el entorno de despliegue y las necesidades operativas.

Los logs no deben utilizarse como sustituto de una base de datos para información que requiera persistencia transaccional.

## Integración con PM2

PM2 forma parte de la operación del backend y administra los procesos de Node.js.

El logging debe ser compatible con la ejecución del backend bajo PM2 y permitir investigar eventos producidos por los procesos administrados.

La observabilidad de los procesos no debe depender exclusivamente de los logs de PM2. Los registros propios de la aplicación deben conservar el contexto funcional necesario para diagnosticar los problemas.

La configuración operacional de PM2 se relaciona con la documentación de [Backend](../../Despliegue/Backend/backend.md).

## Uso para diagnóstico

Los logs constituyen una de las fuentes de evidencia utilizadas durante la investigación de incidentes.

Un diagnóstico puede combinar:

1. logs de aplicación;
2. health checks;
3. métricas;
4. monitoreo;
5. trazabilidad;
6. auditoría;
7. información de despliegue;
8. estado de MySQL;
9. estado de Redis.

Los logs por sí solos no deben considerarse evidencia suficiente cuando el problema requiere información proveniente de otros componentes.

La estrategia general de diagnóstico se documentará en [Diagnóstico](../Diagnostico/diagnostico.md).

## Estado actual

Actualmente el backend utiliza Winston como sistema centralizado de logging.

La implementación principal se encuentra en:

```text
backend/src/shared/utils/logger.js
```

La implementación incluye funciones auxiliares para eventos recurrentes y mecanismos relacionados con seguridad y operación.

Existe un archivo de compatibilidad en:

```text
backend/utils/logger.js
```

Las pruebas automatizadas existentes validan el comportamiento del logger en diferentes escenarios, incluyendo:

- creación del directorio de logs;
- uso de un directorio existente;
- formato;
- funciones auxiliares;
- eventos relacionados con stock;
- eventos de autenticación;
- comportamiento en producción.

## Aspectos pendientes

Los siguientes aspectos deben mantenerse como puntos de evolución cuando correspondan a la arquitectura final:

- completar la migración de referencias heredadas al logger modular;
- definir formalmente las políticas de retención por entorno;
- establecer mecanismos de correlación entre logs de diferentes componentes;
- integrar los registros con la estrategia definitiva de monitoreo;
- establecer mecanismos centralizados de consulta cuando la infraestructura de producción lo requiera;
- definir políticas operativas para eliminación y conservación de registros.

Estos puntos no deben considerarse funcionalidades implementadas hasta que exista evidencia de su incorporación al proyecto.

## Documentación relacionada

| Documento | Relación |
|---|---|
| [Observabilidad](../observability.md) | Índice general de la documentación de observabilidad. |
| [Métricas](../Metricas/metricas.md) | Define las métricas utilizadas para observar el comportamiento de la plataforma. |
| [Health Checks](../Health%20Checks/health-checks.md) | Documenta la comprobación del estado de servicios y dependencias. |
| [Monitoreo](../Monitoreo/monitoreo.md) | Documenta la supervisión operacional de la plataforma. |
| [Alertas](../Alertas/alertas.md) | Documenta la generación y gestión de alertas. |
| [Trazabilidad](../Trazabilidad/trazabilidad.md) | Documenta el seguimiento de una operación entre diferentes componentes. |
| [Auditoría](../Auditoria/auditoria.md) | Documenta los eventos persistentes de auditoría. |
| [Rendimiento](../Rendimiento/rendimiento.md) | Relaciona los registros con el análisis del comportamiento y rendimiento. |
| [Seguridad](../Seguridad/seguridad.md) | Documenta los controles de seguridad aplicables a la observabilidad. |
| [Diagnóstico](../Diagnostico/diagnostico.md) | Documenta el proceso de investigación de problemas. |
| [Configuración de entorno](../../Despliegue/Configuracion/configuracion-entorno.md) | Documenta la configuración específica de los entornos de ejecución. |
| [Backend](../../Despliegue/Backend/backend.md) | Documenta el despliegue y operación del backend. |
