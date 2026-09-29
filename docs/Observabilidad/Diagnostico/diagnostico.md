# Diagnóstico

## Descripción

Esta documentación define los mecanismos y criterios para diagnosticar problemas de disponibilidad, rendimiento, seguridad, integridad y funcionamiento de la plataforma ERP/SaaS.

El diagnóstico utiliza las señales generadas por los diferentes componentes de observabilidad para identificar la causa de un problema y establecer una secuencia reproducible de investigación.

## Propósito

El propósito es proporcionar un procedimiento estructurado para analizar incidentes y degradaciones sin depender de suposiciones.

El diagnóstico debe partir de evidencia observable y relacionar los eventos encontrados entre frontend, backend, base de datos, Redis, servicios de inteligencia artificial e infraestructura.

## Alcance

Comprende:

- Disponibilidad.
- Errores funcionales.
- Rendimiento.
- Base de datos.
- Redis.
- Autenticación.
- Seguridad.
- IA.
- Consumo de recursos.
- Procesos administrados mediante PM2.
- Logs.
- Métricas.
- Health checks.
- Auditoría.
- Trazabilidad.
- Incidentes de despliegue.

## Principios de diagnóstico

El diagnóstico debe seguir estos principios:

- Partir de evidencia.
- Identificar primero el alcance del problema.
- Diferenciar síntomas de causas.
- Correlacionar señales de diferentes componentes.
- Evitar modificaciones no justificadas.
- Reproducir el problema cuando sea posible.
- Registrar las acciones realizadas durante la investigación.
- Validar la solución después del cambio.

Una alerta o un error aislado no debe considerarse automáticamente como la causa raíz.

## Inicio del diagnóstico

Ante un problema se debe determinar inicialmente:

- Qué funcionalidad está afectada.
- Desde cuándo ocurre.
- Si afecta a todos los usuarios o a un subconjunto.
- Si afecta a una empresa específica.
- Si ocurre en frontend, backend o ambos.
- Si existe un cambio reciente relacionado.
- Si existen errores repetidos.
- Si existe una degradación de rendimiento.
- Si alguna dependencia presenta problemas.

Esta clasificación permite reducir el espacio de búsqueda.

## Diagnóstico mediante Health Checks

El endpoint `GET /health` constituye una fuente inicial para verificar el estado del backend y sus dependencias.

El diagnóstico debe utilizarlo para comprobar:

- Disponibilidad del backend.
- Conectividad con MySQL.
- Estado de las tablas verificadas.
- Respuesta general de la aplicación.

Un resultado negativo del health check debe analizarse junto con los logs correspondientes.

## Diagnóstico mediante logs

Winston proporciona los registros operativos utilizados para analizar el comportamiento del backend.

Durante una investigación deben revisarse:

- Fecha y hora.
- Nivel del log.
- Operación afectada.
- Mensaje.
- Error.
- Usuario cuando corresponda.
- Empresa cuando corresponda.
- Identificadores de correlación disponibles.
- Dependencia afectada.

Los logs deben analizarse en el contexto temporal del incidente y no únicamente mediante eventos aislados.

## Diagnóstico mediante métricas

Las métricas permiten identificar cambios de comportamiento que no siempre aparecen como errores explícitos.

Deben revisarse cuando corresponda:

- Latencia.
- Throughput.
- Tasa de errores.
- Uso de CPU.
- Uso de memoria.
- Conexiones MySQL.
- Latencia de Redis.
- Duración de operaciones de IA.
- Métricas del frontend.

Una variación respecto de una línea base puede indicar una degradación aunque la aplicación continúe respondiendo.

## Diagnóstico mediante trazabilidad

La trazabilidad permite relacionar una operación con los componentes involucrados.

Los identificadores disponibles pueden incluir:

- `jti`.
- `token_id`.
- `empresa_id`.
- `usuario_id`.
- Identificadores de registros auditables.
- Identificadores específicos de operaciones.

Cuando exista un identificador común, debe utilizarse para recorrer la operación desde su origen hasta el punto donde se produjo el error.

## Diagnóstico mediante auditoría

La tabla `auditoria_acciones` proporciona información persistente sobre determinados eventos.

Puede utilizarse para investigar:

- Inicios de sesión.
- Inicios de sesión fallidos.
- Cierres de sesión.
- Renovaciones de tokens.
- Cambios de contraseña.
- Eliminaciones.
- Anulaciones.

La auditoría debe utilizarse como evidencia complementaria a los logs y no como sustituto del sistema de logging operativo.

## Diagnóstico del backend

Cuando el problema se encuentra en el backend se debe revisar:

1. Logs de la aplicación.
2. Estado del proceso Node.js.
3. Health check.
4. Errores HTTP.
5. Dependencias utilizadas por el endpoint.
6. Consultas MySQL.
7. Operaciones Redis.
8. Servicios externos.
9. Consumo de memoria y CPU.
10. Cambios recientes.

El objetivo es determinar si el problema se origina en la lógica de aplicación o en una dependencia.

## Diagnóstico del frontend

Cuando el problema se presenta en la interfaz se debe revisar:

- Consola del navegador.
- Solicitudes HTTP.
- Respuestas de la API.
- Código HTTP.
- Tiempo de respuesta.
- Errores de renderizado.
- Estado de React Query.
- Carga de recursos.
- Errores de JavaScript.
- Comportamiento del componente afectado.

Cuando el frontend funciona correctamente pero una operación falla, debe comprobarse primero la respuesta de la API antes de modificar componentes de presentación.

## Diagnóstico de MySQL

Cuando una operación presenta errores o lentitud se debe analizar:

- Conectividad.
- Disponibilidad.
- Tiempo de consulta.
- Índices utilizados.
- Bloqueos.
- Deadlocks.
- Transacciones.
- Conexiones disponibles en el pool.
- Integridad de los datos.

Las operaciones críticas deben analizarse considerando también la estrategia de concurrencia definida para la base de datos.

## Diagnóstico de Redis

Ante problemas relacionados con sesiones, tokens o mecanismos de caché se debe comprobar:

- Disponibilidad de Redis.
- Conectividad.
- Latencia.
- Errores de comandos.
- Expiración de claves.
- Estado de la blacklist.
- Consumo de memoria.

Un problema de Redis debe diferenciarse de un problema del mecanismo de autenticación que lo utiliza.

## Diagnóstico de autenticación

Ante errores de autenticación se debe revisar:

- Credenciales recibidas.
- Validación de usuario.
- Estado del usuario.
- Empresa asociada.
- Generación del JWT.
- `jti`.
- `token_id`.
- Sesiones existentes.
- Blacklist.
- Redis.
- Auditoría de autenticación.

No deben registrarse credenciales ni tokens completos durante la investigación.

## Diagnóstico de aislamiento multiempresa

Cuando exista una sospecha de acceso incorrecto entre empresas se debe verificar:

- `empresa_id` recibido o resuelto.
- Usuario autenticado.
- Contexto del tenant.
- Consultas realizadas.
- Filtros utilizados.
- Registros afectados.
- Autorización aplicada.

Este tipo de problema debe tratarse como un evento de seguridad además de un posible defecto funcional.

## Diagnóstico de inteligencia artificial

Las operaciones de IA dependen de servicios externos y pueden presentar fallos que no se originan en la plataforma.

La tabla `ia_requests` permite revisar:

- Tipo de trabajo.
- Modelo.
- Duración.
- Estado.
- Fecha de creación.
- Hash de la imagen de entrada.

Los estados `OK`, `ERROR` y `TIMEOUT` permiten diferenciar resultados exitosos, errores y tiempos de espera.

Los errores de proveedor deben separarse de los errores internos de la aplicación.

## Diagnóstico de rendimiento

Ante una degradación de rendimiento se debe determinar primero si afecta:

- Frontend.
- API.
- MySQL.
- Redis.
- IA.
- Infraestructura.

Posteriormente se deben correlacionar:

- Latencia.
- Errores.
- CPU.
- Memoria.
- Consultas.
- Conexiones.
- Logs.
- Dependencias externas.

Las mediciones deben compararse con las líneas base disponibles.

## Diagnóstico de memoria

PM2 administra los procesos de la aplicación y tiene configurado `max_memory_restart` en 400 MB.

Un reinicio provocado por este límite debe considerarse una señal de diagnóstico, no una solución definitiva.

La investigación debe determinar:

- Qué proceso alcanzó el límite.
- Qué operación se ejecutaba.
- Si el consumo creció progresivamente.
- Si existe una operación que genere acumulación de memoria.
- Si el comportamiento puede reproducirse.

## Diagnóstico de errores HTTP

Los códigos HTTP deben utilizarse para clasificar inicialmente el problema.

Se debe diferenciar entre:

- Errores de autenticación.
- Errores de autorización.
- Errores de validación.
- Recursos inexistentes.
- Conflictos.
- Errores internos.
- Problemas de dependencias.

El código HTTP debe complementarse con los logs y el contexto de la operación.

## Diagnóstico de despliegues

Cuando un problema aparece después de un despliegue se debe comparar:

- Versión anterior.
- Versión desplegada.
- Cambios realizados.
- Migraciones ejecutadas.
- Variables de entorno.
- Dependencias modificadas.
- Estado de servicios.
- Logs posteriores al despliegue.

No debe asumirse que una modificación reciente es necesariamente la causa sin evidencia que la relacione con el problema.

## Diagnóstico de base de datos

Los problemas de persistencia deben analizarse diferenciando:

- Error de conexión.
- Error de consulta.
- Error de integridad.
- Error de transacción.
- Problema de concurrencia.
- Problema de índice.
- Problema de datos.

Las restricciones, relaciones, índices, triggers y procedimientos existentes deben considerarse durante la investigación.

## Diagnóstico de seguridad

Los eventos relacionados con seguridad deben correlacionarse con:

- Logs.
- Auditoría.
- Autenticación.
- Sesiones.
- Tokens.
- `empresa_id`.
- Métricas.
- Alertas.

La investigación debe evitar modificar o eliminar evidencia necesaria para determinar la secuencia de acontecimientos.

## Diagnóstico de incidentes

Un incidente debe documentarse al menos con:

- Fecha y hora.
- Componente afectado.
- Descripción del problema.
- Alcance.
- Evidencias encontradas.
- Acciones ejecutadas.
- Resultado de cada acción.
- Causa identificada cuando sea posible.
- Solución aplicada.
- Validación posterior.
- Acciones preventivas.

La documentación debe distinguir claramente entre hechos observados, hipótesis y conclusiones verificadas.

## Análisis de causa raíz

La causa raíz debe establecerse únicamente cuando exista evidencia suficiente.

El análisis puede considerar:

- Cambios recientes.
- Dependencias.
- Configuración.
- Datos.
- Código.
- Infraestructura.
- Concurrencia.
- Recursos.
- Servicios externos.

Una solución temporal no debe confundirse con la eliminación de la causa raíz.

## Reproducción

Cuando sea posible, el problema debe reproducirse en un entorno controlado.

La reproducción debe registrar:

- Condiciones iniciales.
- Datos utilizados.
- Solicitud ejecutada.
- Configuración relevante.
- Resultado esperado.
- Resultado obtenido.
- Logs generados.
- Tiempo de respuesta.

La reproducción debe evitar utilizar datos productivos sensibles cuando no sean necesarios.

## Validación de la solución

Después de aplicar una corrección se debe comprobar:

- Que el problema original ya no ocurre.
- Que el flujo funcional continúa funcionando.
- Que no aparecen nuevos errores.
- Que el rendimiento no se degrada.
- Que los controles de seguridad permanecen activos.
- Que las pruebas correspondientes continúan pasando.

Las correcciones deben validarse con evidencia antes de considerarse cerradas.

## Estado actual

La plataforma dispone de varias fuentes que permiten realizar diagnóstico:

- Winston para logging.
- `GET /health` para comprobación de estado.
- `auditoria_acciones` para eventos auditables.
- `ia_requests` para operaciones de IA.
- PM2 para administración de procesos.
- Métricas de frontend obtenidas mediante Lighthouse.
- Información de sesiones y tokens.
- MySQL y Redis como dependencias observables.

El diagnóstico se encuentra distribuido entre estos mecanismos y debe continuar consolidándose mediante métricas, alertas y procedimientos reproducibles.

## Aspectos pendientes

Queda pendiente:

- Definir procedimientos formales para incidentes frecuentes.
- Establecer líneas base completas del backend.
- Incorporar pruebas de carga y rendimiento.
- Definir métricas operativas de MySQL y Redis.
- Establecer alertas basadas en mediciones reales.
- Consolidar mecanismos de correlación de solicitudes.
- Documentar procedimientos de recuperación por tipo de fallo.
- Automatizar la recopilación de evidencia cuando sea apropiado.
- Definir procedimientos de análisis posterior a incidentes.
- Mantener actualizada la documentación conforme evolucione la arquitectura.

## Documentación relacionada

| Documento | Relación |
|---|---|
| [Observabilidad](../observability.md) | Índice general de observabilidad. |
| [Logging](../Logging/logging.md) | Registros utilizados durante el diagnóstico. |
| [Métricas](../Metricas/metricas.md) | Indicadores utilizados para detectar degradaciones. |
| [Health Checks](../Health%20Checks/health-checks.md) | Verificación de disponibilidad y dependencias. |
| [Monitoreo](../Monitoreo/monitoreo.md) | Supervisión general de componentes. |
| [Alertas](../Alertas/alertas.md) | Detección de condiciones que requieren atención. |
| [Trazabilidad](../Trazabilidad/trazabilidad.md) | Correlación de operaciones. |
| [Auditoría](../Auditoria/auditoria.md) | Evidencia persistente de eventos auditables. |
| [Rendimiento](../Rendimiento/rendimiento.md) | Análisis de latencia y consumo de recursos. |
| [Seguridad](../Seguridad/seguridad.md) | Diagnóstico de eventos de seguridad. |
| [Health checks del despliegue](../../Despliegue/Operacion/health-checks.md) | Comprobación operativa durante el despliegue. |
| [Recuperación de fallos](../../Despliegue/Recuperacion/recuperacion-fallos.md) | Procedimientos de recuperación. |
| [Rollback](../../Despliegue/Recuperacion/rollback.md) | Reversión de cambios de despliegue. |
| [Concurrencia](../../Base%20de%20Datos/Concurrencia/concurrencia.md) | Diagnóstico de problemas concurrentes. |
| [Integridad](../../Base%20de%20Datos/Integridad/integridad.md) | Diagnóstico de problemas de integridad. |
| [Arquitectura](../../Arquitectura/architecture.md) | Componentes y dependencias de la plataforma. |
