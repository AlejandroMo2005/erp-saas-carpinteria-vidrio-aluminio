# Alertas

## Descripción

Las alertas permiten identificar automáticamente condiciones que requieren atención técnica u operativa dentro de la plataforma.

Una alerta debe representar una condición observable y accionable. Su propósito es reducir el tiempo entre la detección de un problema y su diagnóstico o intervención.

Este documento define los criterios generales para la generación, clasificación, gestión y seguimiento de alertas.

## Propósito

El sistema de alertas debe permitir:

- Detectar indisponibilidad de servicios.
- Identificar degradaciones relevantes de rendimiento.
- Detectar incrementos anómalos de errores.
- Identificar problemas en MySQL o Redis.
- Detectar fallos repetitivos en operaciones de IA.
- Identificar reinicios inesperados del backend.
- Detectar eventos relevantes de seguridad.
- Reducir el tiempo de detección de incidentes.
- Facilitar la respuesta ante incidentes operativos.

Las alertas deben estar relacionadas con señales observables provenientes de logs, métricas, health checks o mecanismos de trazabilidad.

## Fuentes de alertas

Las principales fuentes consideradas son:

| Fuente | Ejemplos |
|---|---|
| Health checks | Servicio no disponible, dependencia no saludable |
| Métricas | Latencia elevada, incremento de errores, consumo de recursos |
| Logs | Errores repetitivos, fallos críticos |
| Seguridad | Intentos de autenticación fallidos, eventos anómalos |
| Base de datos | Errores de conexión, bloqueos, deadlocks |
| Redis | Indisponibilidad, errores de conexión |
| IA | Errores, timeouts, incremento de duración |
| PM2 | Reinicios, consumo elevado de memoria |

## Principios de diseño

Las alertas deben cumplir los siguientes principios:

### Accionables

Una alerta debe indicar una condición que pueda requerir investigación o intervención.

### Específicas

Debe ser posible identificar el componente y condición que originaron la alerta.

### Medibles

Cuando sea posible, la condición debe expresarse mediante una métrica, estado o evento observable.

### Contextualizadas

La alerta debe proporcionar suficiente información para iniciar el diagnóstico sin exponer información sensible.

### No redundantes

Varias señales generadas por una misma causa no deberían producir una cantidad innecesaria de alertas independientes.

## Severidad

La severidad debe representar el impacto operativo de la condición detectada.

| Nivel | Descripción |
|---|---|
| Crítica | Condición que compromete un servicio o flujo esencial |
| Alta | Problema significativo que requiere atención prioritaria |
| Media | Degradación o error que requiere seguimiento |
| Baja | Evento informativo o condición de bajo impacto |

La clasificación definitiva debe considerar el impacto real sobre el sistema y no únicamente el tipo de evento.

## Alertas de disponibilidad

Las alertas de disponibilidad deben considerar:

- Backend no disponible.
- Frontend no disponible.
- Health check fallido.
- MySQL inaccesible.
- Redis inaccesible.
- Dependencia externa crítica no disponible.

Cuando una dependencia no esté disponible, debe determinarse si afecta realmente a una funcionalidad crítica antes de generar una alerta de máxima severidad.

## Alertas de rendimiento

Las alertas de rendimiento pueden generarse ante:

- Incrementos sostenidos de latencia.
- Aumento de consultas lentas.
- Uso elevado de memoria.
- Reinicios frecuentes.
- Incremento significativo de errores.
- Degradación de operaciones de IA.
- Saturación de recursos.

Los valores utilizados como umbrales deben definirse a partir de mediciones del entorno correspondiente y no asumirse como valores universales.

## Alertas del backend

El backend puede generar condiciones de alerta relacionadas con:

- Incremento de respuestas `5xx`.
- Fallos de conexión con MySQL.
- Fallos de conexión con Redis.
- Excepciones no controladas.
- Reinicios inesperados.
- Incremento de errores de autenticación.
- Fallos repetitivos en operaciones críticas.

Los logs proporcionan el detalle necesario para investigar estas condiciones.

## Alertas de MySQL

Las condiciones potencialmente alertables incluyen:

- Instancia no disponible.
- Errores repetitivos de conexión.
- Saturación del pool.
- Consultas lentas.
- Bloqueos.
- Deadlocks.
- Falta de espacio.
- Degradación sostenida del tiempo de respuesta.

Los eventos de base de datos deben analizarse considerando si afectan operaciones críticas del backend.

## Alertas de Redis

Las alertas de Redis pueden considerar:

- Servicio no disponible.
- Errores de conexión.
- Tiempo de respuesta elevado.
- Uso excesivo de memoria.
- Fallos en operaciones relacionadas con sesiones o blacklist de tokens.

Una alerta de Redis debe incluir el contexto suficiente para determinar qué funcionalidades pueden estar afectadas.

## Alertas de IA

Las operaciones de IA pueden generar alertas cuando exista:

- Incremento significativo de solicitudes con estado `ERROR`.
- Incremento de solicitudes con estado `TIMEOUT`.
- Aumento sostenido de la duración.
- Fallos repetitivos de proveedores externos.
- Incremento anómalo de solicitudes fallidas.

La tabla `ia_requests` contiene información que puede utilizarse para analizar estos eventos, incluyendo duración, estado, modelo y fecha de creación.

## Alertas de seguridad

Las alertas de seguridad deben considerar eventos como:

- Incrementos anómalos de intentos de autenticación fallidos.
- Actividad de autenticación inusual.
- Eventos repetitivos asociados a controles de seguridad.
- Comportamientos que requieran revisión de auditoría.

Las alertas no deben incluir contraseñas, tokens completos, secretos ni otra información sensible.

Los eventos de auditoría se documentan en:

[Auditoría](../Auditoria/auditoria.md)

## Alertas de PM2

PM2 puede proporcionar señales operativas relacionadas con:

- Reinicios del proceso.
- Consumo elevado de memoria.
- Caídas del proceso.
- Cambios inesperados en el estado del servicio.

La configuración conocida utiliza `max_memory_restart` de 400 MB.

Un reinicio automático debe generar suficiente evidencia para determinar posteriormente si fue causado por consumo de memoria, error de aplicación u otra condición.

## Umbrales

Los umbrales deben definirse considerando:

- Comportamiento normal del sistema.
- Capacidad de infraestructura.
- Tipo de operación.
- Impacto sobre el negocio.
- Variación esperada de la carga.
- Historial de incidentes.

No se deben utilizar umbrales arbitrarios sin conocer el comportamiento del entorno.

Los valores deben revisarse cuando cambien la infraestructura, la carga esperada o la arquitectura.

## Ventanas de evaluación

No todas las condiciones deben generar una alerta inmediatamente.

Dependiendo de la condición, puede ser necesario evaluar:

- Valor instantáneo.
- Promedio durante un período.
- Cantidad de eventos durante una ventana temporal.
- Porcentaje de errores.
- Persistencia de la condición.
- Repetición del evento.

Esto permite reducir alertas producidas por eventos aislados o transitorios.

## Deduplicación

Cuando varias señales representen la misma causa raíz, el sistema de alertas debe evitar generar notificaciones repetitivas.

La deduplicación puede considerar:

- Componente afectado.
- Tipo de condición.
- Intervalo temporal.
- Identificador de incidente.
- Dependencia afectada.

La implementación concreta de este mecanismo queda pendiente de la solución de monitoreo que se adopte.

## Escalamiento

Los incidentes deben poder escalarse cuando una condición:

- Permanece activa.
- Aumenta de severidad.
- Afecta más componentes.
- Compromete operaciones críticas.
- No recibe atención dentro del tiempo establecido.

El procedimiento concreto de escalamiento debe definirse según el entorno operativo.

## Canales de notificación

Las alertas pueden integrarse posteriormente con diferentes canales de notificación, dependiendo de la infraestructura disponible.

Entre las posibilidades se encuentran:

- Correo electrónico.
- Sistemas de mensajería.
- Plataformas de gestión de incidentes.
- Integraciones con herramientas de monitoreo.

Actualmente no se establece una plataforma específica de notificación como parte implementada de la arquitectura.

## Relación con incidentes

Una alerta representa una señal de que existe una condición que requiere revisión. No necesariamente representa un incidente confirmado.

El flujo recomendado es:

1. Generación de la alerta.
2. Validación de la condición.
3. Determinación del impacto.
4. Identificación del componente afectado.
5. Investigación.
6. Corrección o mitigación.
7. Verificación.
8. Cierre.
9. Registro de evidencias y acciones realizadas.

## Alertas y cambios de despliegue

Después de un despliegue se debe prestar especial atención a:

- Incrementos de errores.
- Fallos del health check.
- Aumento de latencia.
- Reinicios del backend.
- Errores de conexión con dependencias.
- Degradación de operaciones críticas.

La correlación temporal entre una alerta y un despliegue puede proporcionar información relevante para el diagnóstico, pero no debe asumirse automáticamente que el despliegue es la causa.

## Prevención de ruido

Un sistema de alertas excesivamente sensible puede generar fatiga de alertas.

Para reducirla se deben considerar:

- Umbrales adecuados.
- Ventanas de evaluación.
- Deduplicación.
- Agrupación de eventos relacionados.
- Diferenciación de severidades.
- Exclusión de eventos esperados.
- Revisión periódica de alertas que no producen acciones.

## Protección de información

Las alertas deben seguir los mismos principios de protección aplicables a logs y métricas.

No deben exponerse:

- Contraseñas.
- Tokens.
- Claves privadas.
- Secretos.
- Credenciales.
- Datos personales innecesarios.
- Contenido sensible de solicitudes.

Cuando sea necesario identificar un evento, deben utilizarse identificadores técnicos apropiados.

## Monitoreo multiempresa

La información asociada con empresas debe mantenerse aislada.

Las alertas generadas a partir de eventos multiempresa deben evitar revelar información de un tenant a otro.

Cuando se utilice `empresa_id` como contexto operacional, debe aplicarse el mismo control de acceso utilizado por el resto de la plataforma.

## Estado actual

Actualmente la plataforma dispone de fuentes que pueden servir como base para un sistema de alertas:

- `GET /health`.
- Logs mediante Winston.
- Datos de solicitudes de IA en `ia_requests`.
- Auditoría mediante `auditoria_acciones`.
- Procesos administrados mediante PM2.
- Métricas de rendimiento obtenidas mediante Lighthouse.

No se encuentra documentada como implementada una plataforma centralizada de alertas ni canales automáticos de notificación.

## Aspectos pendientes

Queda por definir o implementar:

- Plataforma de alertas.
- Umbrales específicos.
- Reglas de evaluación.
- Deduplicación.
- Agrupación de eventos.
- Canales de notificación.
- Escalamiento.
- Integración con gestión de incidentes.
- Retención de alertas.
- Dashboards relacionados.
- Procedimientos de respuesta.

Estas decisiones deben realizarse después de definir las necesidades operativas del entorno de despliegue.

## Documentación relacionada

| Documento | Descripción |
|---|---|
| [Observabilidad](../observability.md) | Índice general de observabilidad |
| [Logging](../Logging/logging.md) | Registro de eventos y errores |
| [Métricas](../Metricas/metricas.md) | Indicadores utilizados como fuentes de alerta |
| [Health Checks](../Health%20Checks/health-checks.md) | Comprobaciones de disponibilidad |
| [Monitoreo](../Monitoreo/monitoreo.md) | Estrategia general de supervisión |
| [Trazabilidad](../Trazabilidad/trazabilidad.md) | Correlación de operaciones |
| [Auditoría](../Auditoria/auditoria.md) | Registro de acciones auditables |
| [Rendimiento](../Rendimiento/rendimiento.md) | Indicadores de rendimiento |
| [Seguridad](../Seguridad/seguridad.md) | Observabilidad de eventos de seguridad |
| [Diagnóstico](../Diagnostico/diagnostico.md) | Análisis de incidentes |
| [Monitoreo de despliegue](../../Despliegue/Operacion/monitoreo.md) | Supervisión durante la operación |
| [Recuperación ante fallos](../../Despliegue/Recuperacion/recuperacion-fallos.md) | Procedimientos relacionados con fallos |
