# Solución de Problemas

## Descripción

Esta documentación centraliza los procedimientos generales para identificar, analizar y resolver problemas de la plataforma ERP/SaaS.

La documentación se enfoca en problemas operativos, funcionales, de infraestructura, persistencia, autenticación, rendimiento, despliegue y dependencias.

## Propósito

El propósito es proporcionar una referencia para diagnosticar problemas de forma estructurada, reducir tiempos de resolución y evitar correcciones basadas únicamente en suposiciones.

Los procedimientos deben partir de evidencia observable y considerar el contexto del entorno donde ocurre el problema.

## Alcance

Comprende problemas relacionados con:

- Frontend.
- Backend.
- API.
- MySQL.
- Redis.
- Autenticación.
- Sesiones.
- Multiempresa.
- IA.
- Rendimiento.
- Procesos PM2.
- Configuración.
- Variables de entorno.
- Despliegue.
- CI/CD.
- Seguridad.
- Integridad de datos.

## Principios de resolución

La resolución de problemas debe seguir estos principios:

- Identificar primero el alcance.
- Confirmar el problema mediante evidencia.
- Determinar el componente afectado.
- Diferenciar síntoma y causa.
- Revisar cambios recientes.
- Correlacionar logs, métricas y trazabilidad.
- Evitar cambios destructivos sin respaldo.
- Aplicar una corrección controlada.
- Validar el resultado.
- Documentar problemas recurrentes.

## Clasificación inicial

Antes de aplicar una corrección se debe determinar:

1. Qué funcionalidad está afectada.
2. En qué entorno ocurre.
3. Desde cuándo ocurre.
4. A qué usuarios afecta.
5. Si afecta a una empresa específica.
6. Si el problema es reproducible.
7. Si existe un cambio reciente relacionado.
8. Qué componentes participan en la operación.

Esta clasificación permite reducir el área de investigación.

## Problemas del frontend

Ante un problema en la interfaz se debe revisar:

- Consola del navegador.
- Errores de JavaScript.
- Solicitudes realizadas a la API.
- Código HTTP de las respuestas.
- Payload enviado.
- Respuesta recibida.
- Estado de React Query.
- Variables de entorno del frontend.
- Configuración de Vite.
- Errores de renderizado.
- Recursos no encontrados.

Cuando una operación depende del backend, se debe verificar primero si la API respondió correctamente antes de modificar el componente frontend.

## Problemas del backend

Ante un problema del backend se debe revisar:

- Logs de Winston.
- Endpoint afectado.
- Código HTTP.
- Validación de entrada.
- Middleware involucrado.
- Autenticación.
- Autorización.
- Contexto `empresa_id`.
- Consultas MySQL.
- Operaciones Redis.
- Servicios externos.
- Estado del proceso Node.js.

El endpoint `GET /health` debe utilizarse como comprobación inicial de disponibilidad cuando corresponda.

## Problemas de API

Cuando una solicitud HTTP falla se debe comprobar:

- Método HTTP.
- URL.
- Parámetros.
- Headers.
- Cookies.
- Payload.
- Código de respuesta.
- Mensaje de error.
- Logs del backend.
- Dependencias utilizadas por el endpoint.

Los errores de validación, autenticación, autorización y servidor deben analizarse por separado.

## Problemas de autenticación

Ante problemas de inicio de sesión o sesión se debe revisar:

- Usuario.
- Estado de la cuenta.
- Credenciales.
- Empresa asociada.
- JWT.
- `jti`.
- `token_id`.
- Sesiones existentes.
- Redis.
- `token_blacklist`.
- `usuarios_sesiones`.
- Registros de auditoría.

No se deben registrar ni solicitar contraseñas o tokens completos durante el diagnóstico.

## Problemas de sesión

Cuando una sesión no se mantiene o deja de ser válida se debe comprobar:

- Expiración.
- Cookie correspondiente.
- Sesión persistida.
- Estado del token.
- Blacklist.
- Redis.
- Renovación del token.
- Cambios recientes de autenticación.

Los problemas de sesión deben diferenciarse de problemas generales de conectividad con el backend.

## Problemas de multiempresa

Cuando un usuario obtiene información incorrecta o no puede acceder a sus recursos se debe revisar:

- `empresa_id`.
- Usuario autenticado.
- Middleware de tenant.
- Consultas realizadas.
- Filtros aplicados.
- Autorización.
- Empresa asociada al registro.

Cualquier comportamiento que pueda permitir acceso entre empresas debe tratarse como un problema de seguridad además de un problema funcional.

## Problemas de MySQL

Ante errores de persistencia se debe revisar:

- Variables de entorno de conexión.
- Disponibilidad del servidor.
- Usuario y permisos.
- Base de datos seleccionada.
- Tablas requeridas.
- Integridad referencial.
- Restricciones.
- Índices.
- Triggers.
- Procedimientos.
- Transacciones.
- Conexiones del pool.
- Bloqueos y concurrencia.

Los errores de conexión deben diferenciarse de los errores producidos por consultas específicas.

## Problemas de Redis

Ante problemas relacionados con Redis se debe comprobar:

- Disponibilidad del servicio.
- Host y puerto configurados.
- Conectividad.
- Autenticación cuando corresponda.
- Latencia.
- Estado de las claves utilizadas.
- Expiración.
- Errores registrados por el backend.

Debe verificarse si el fallo afecta únicamente a una funcionalidad dependiente de Redis o a otras operaciones del backend.

## Problemas de IA

Las operaciones de inteligencia artificial dependen de servicios externos.

Ante un problema se debe revisar:

- Proveedor utilizado.
- Modelo configurado.
- Credenciales del proveedor.
- Código de respuesta.
- Tiempo de espera.
- Duración de la operación.
- Estado registrado en `ia_requests`.
- Logs generados.
- Disponibilidad del servicio externo.

Los estados `OK`, `ERROR` y `TIMEOUT` de `ia_requests` permiten diferenciar resultados exitosos, errores y tiempos de espera.

Un error del proveedor externo no debe atribuirse automáticamente al backend.

## Problemas de rendimiento

Ante una degradación se debe determinar primero qué componente presenta el problema:

- Frontend.
- Backend.
- API.
- MySQL.
- Redis.
- IA.
- Infraestructura.

Después se deben revisar:

- Latencia.
- Errores.
- CPU.
- Memoria.
- Consultas.
- Conexiones.
- Logs.
- Dependencias externas.

La línea base disponible del frontend incluye Performance 98, LCP de 2.45 s, CLS de 0 e INP de 56 ms.

No deben asumirse capacidades de concurrencia o tiempos de respuesta del backend que todavía no hayan sido medidos.

## Problemas de memoria

PM2 utiliza `max_memory_restart` con un límite configurado de 400 MB.

Si un proceso alcanza este límite y se reinicia, se debe investigar:

- Operación ejecutada.
- Crecimiento del consumo.
- Logs previos al reinicio.
- Frecuencia de los reinicios.
- Cambios recientes.
- Posibles acumulaciones de memoria.

El reinicio automático constituye una medida de contención y no una solución definitiva al origen del problema.

## Problemas de configuración

Ante un comportamiento inesperado se debe verificar:

- Variables de entorno.
- Valores requeridos.
- Configuración del frontend.
- Configuración del backend.
- Configuración de MySQL.
- Configuración de Redis.
- Configuración de PM2.
- Configuración del entorno.

No se deben introducir secretos directamente en archivos versionados.

## Problemas de variables de entorno

Cuando una aplicación no inicia o una dependencia no funciona correctamente se debe comprobar:

- Que la variable exista.
- Que tenga el nombre esperado.
- Que el valor corresponda al entorno.
- Que no exista una variable sobrescrita.
- Que el proceso haya sido reiniciado después del cambio.

Los valores sensibles deben comprobarse sin exponerlos en logs o capturas.

## Problemas de despliegue

Ante un problema posterior a un despliegue se debe revisar:

1. Versión desplegada.
2. Cambios incluidos.
3. Resultado del CI/CD.
4. Variables de entorno.
5. Dependencias.
6. Migraciones.
7. Estado del backend.
8. Estado del frontend.
9. MySQL.
10. Redis.
11. Logs posteriores al despliegue.

Si el problema está relacionado con una versión concreta, debe evaluarse el procedimiento de rollback documentado.

## Problemas de CI/CD

Cuando un pipeline falla se debe identificar la etapa:

- Instalación de dependencias.
- Lint.
- Pruebas unitarias.
- Cobertura.
- Integración.
- E2E.
- Seguridad.
- Análisis estático.
- Construcción.
- Despliegue.

El error debe analizarse en el contexto de la etapa que lo produjo y no únicamente a partir del estado final del pipeline.

## Problemas de pruebas

Cuando una prueba falla se debe determinar si corresponde a:

- Cambio funcional.
- Defecto real.
- Fixture incorrecta.
- Mock incorrecto.
- Dependencia externa.
- Configuración del entorno.
- Problema de datos.
- Condición de carrera.
- Prueba inestable.

No se debe modificar una prueba únicamente para hacer desaparecer un fallo sin determinar primero la causa.

## Problemas de seguridad

Ante un posible problema de seguridad se debe conservar la evidencia y revisar:

- Logs.
- Auditoría.
- Autenticación.
- Autorización.
- Sesiones.
- Tokens.
- `empresa_id`.
- Solicitudes realizadas.
- Respuestas generadas.
- Cambios recientes.

Los controles de seguridad no deben deshabilitarse como primera medida de diagnóstico.

## Problemas de integridad de datos

Cuando existen datos inconsistentes se debe revisar:

- Restricciones de base de datos.
- Relaciones.
- Triggers.
- Transacciones.
- Operaciones concurrentes.
- Código responsable de la modificación.
- Registros de auditoría.
- Historial disponible.

Las correcciones manuales de datos deben realizarse de forma controlada y documentada.

## Problemas de concurrencia

Cuando un error aparece únicamente bajo solicitudes simultáneas se debe revisar:

- Transacciones.
- Bloqueos.
- Deadlocks.
- Pool de conexiones.
- Operaciones sobre inventario.
- Actualizaciones simultáneas.
- Orden de las operaciones.
- Idempotencia.

Los problemas concurrentes requieren pruebas específicas y no deben diagnosticarse únicamente mediante ejecuciones secuenciales.

## Uso de logs durante la investigación

Durante una investigación se deben consultar los logs correspondientes al intervalo temporal del problema.

La revisión debe considerar:

- Primer error observado.
- Errores posteriores.
- Operaciones inmediatamente anteriores.
- Dependencias involucradas.
- Reinicios del proceso.
- Cambios de comportamiento.

Debe evitarse registrar información sensible adicional únicamente para facilitar una investigación puntual.

## Uso de auditoría durante la investigación

La tabla `auditoria_acciones` puede utilizarse para reconstruir eventos relacionados con:

- `LOGIN`.
- `LOGOUT`.
- `LOGIN_FALLIDO`.
- `REFRESH_TOKEN`.
- `CAMBIO_PASSWORD`.
- `DELETE`.
- `ANULACION`.

La auditoría debe utilizarse junto con logs y trazabilidad para obtener una visión completa del incidente.

## Uso de health checks

Los health checks deben utilizarse para determinar si un componente está disponible.

Un resultado correcto no garantiza que todas las funcionalidades estén funcionando correctamente. Una operación específica puede fallar aunque el servicio general permanezca disponible.

Por esta razón, los health checks deben complementarse con logs, métricas y pruebas funcionales.

## Cambios recientes

Los cambios recientes constituyen una hipótesis inicial útil, pero no deben considerarse automáticamente como causa raíz.

Se deben revisar:

- Commits recientes.
- Cambios de dependencias.
- Modificaciones de configuración.
- Migraciones.
- Cambios de infraestructura.
- Cambios de seguridad.
- Cambios en consultas.

La relación causal debe confirmarse mediante evidencia o reproducción.

## Corrección controlada

Una corrección debe aplicarse de forma controlada.

Antes del cambio se debe determinar:

- Qué se modificará.
- Por qué se modificará.
- Qué resultado se espera.
- Cómo se validará.
- Cómo revertirlo si falla.

Cuando el cambio afecte datos o infraestructura, debe existir un mecanismo de recuperación apropiado.

## Validación posterior

Después de una corrección se debe comprobar:

- Que el problema original desapareció.
- Que el flujo afectado funciona.
- Que las pruebas continúan pasando.
- Que no aparecen nuevos errores.
- Que el rendimiento no se deterioró.
- Que los controles de seguridad continúan activos.

La resolución debe considerarse completa únicamente después de esta validación.

## Documentación de incidentes

Los problemas relevantes deben registrar:

- Fecha.
- Entorno.
- Componente afectado.
- Síntoma.
- Alcance.
- Evidencias.
- Causa identificada.
- Corrección aplicada.
- Validación.
- Acciones preventivas.

La documentación debe diferenciar hechos comprobados de hipótesis utilizadas durante la investigación.

## Estado actual

La plataforma dispone de documentación especializada para observabilidad, logging, métricas, health checks, monitoreo, alertas, trazabilidad, auditoría, rendimiento, seguridad y diagnóstico.

Esta documentación de solución de problemas funciona como punto de referencia transversal para utilizar dichos mecanismos durante una investigación.

## Aspectos pendientes

Queda pendiente:

- Definir procedimientos específicos para incidentes frecuentes.
- Documentar casos de fallo reproducibles.
- Incorporar resultados de pruebas de carga.
- Definir métricas operativas completas.
- Establecer umbrales de alerta basados en líneas base.
- Automatizar tareas de diagnóstico repetitivas cuando corresponda.
- Mantener procedimientos actualizados después de cambios arquitectónicos.
- Registrar problemas recurrentes y sus soluciones verificadas.

## Documentación relacionada

| Documento | Relación |
|---|---|
| [Observabilidad](../Observabilidad/observability.md) | Índice general de observabilidad. |
| [Diagnóstico](../Observabilidad/Diagnostico/diagnostico.md) | Procedimientos generales de investigación. |
| [Logging](../Observabilidad/Logging/logging.md) | Registros utilizados durante la resolución. |
| [Métricas](../Observabilidad/Metricas/metricas.md) | Indicadores utilizados para detectar problemas. |
| [Health Checks](../Observabilidad/Health%20Checks/health-checks.md) | Comprobación de disponibilidad. |
| [Monitoreo](../Observabilidad/Monitoreo/monitoreo.md) | Supervisión de componentes. |
| [Alertas](../Observabilidad/Alertas/alertas.md) | Detección de condiciones anómalas. |
| [Trazabilidad](../Observabilidad/Trazabilidad/trazabilidad.md) | Correlación de operaciones. |
| [Auditoría](../Observabilidad/Auditoria/auditoria.md) | Evidencia persistente de eventos. |
| [Rendimiento](../Observabilidad/Rendimiento/rendimiento.md) | Diagnóstico de degradaciones de rendimiento. |
| [Seguridad](../Observabilidad/Seguridad/seguridad.md) | Diagnóstico de eventos de seguridad. |
| [Arquitectura](../Arquitectura/architecture.md) | Componentes y dependencias del sistema. |
| [Base de Datos](../Base%20de%20Datos/database.md) | Estructura general de persistencia. |
| [Concurrencia](../Base%20de%20Datos/Concurrencia/concurrencia.md) | Diagnóstico de problemas concurrentes. |
| [Despliegue](../Despliegue/deployment.md) | Operación de los diferentes entornos. |
| [Rollback](../Despliegue/Recuperacion/rollback.md) | Reversión controlada de despliegues. |
| [Recuperación de fallos](../Despliegue/Recuperacion/recuperacion-fallos.md) | Procedimientos de recuperación. |
| [CI/CD](../CI-CD/ci-cd.md) | Diagnóstico de pipelines automatizados. |
