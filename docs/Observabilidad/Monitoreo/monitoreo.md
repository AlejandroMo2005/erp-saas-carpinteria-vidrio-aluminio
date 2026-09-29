# Monitoreo

## Descripción

El monitoreo permite supervisar de forma continua el estado operativo de la plataforma, utilizando información proveniente de métricas, logs, health checks, trazabilidad y mecanismos de alerta.

Su objetivo es proporcionar una visión operacional del sistema y facilitar la detección temprana de degradaciones, errores, indisponibilidad y comportamientos anómalos en los componentes del ERP/SaaS.

Este documento define el enfoque de monitoreo de la plataforma y su relación con los demás mecanismos de observabilidad.

## Propósito

El monitoreo debe permitir:

- Detectar indisponibilidad de servicios.
- Identificar degradaciones de rendimiento.
- Observar errores recurrentes.
- Supervisar dependencias críticas.
- Detectar problemas de base de datos y Redis.
- Identificar fallos en procesos relacionados con IA.
- Supervisar el comportamiento del backend y frontend.
- Facilitar el diagnóstico de incidentes.
- Proporcionar evidencia para evaluar cambios y despliegues.

El monitoreo complementa los logs y las métricas. No los sustituye.

## Alcance

El monitoreo contempla los siguientes componentes:

- Frontend.
- Backend.
- MySQL.
- Redis.
- Servicios relacionados con IA.
- Procesos administrados mediante PM2.
- Infraestructura donde se despliega la aplicación.
- Flujos críticos de la aplicación.

La supervisión debe considerar tanto el estado técnico de los componentes como los indicadores necesarios para detectar problemas en operaciones críticas.

## Señales de monitoreo

La estrategia de monitoreo se basa principalmente en cuatro tipos de señales:

| Señal | Propósito |
|---|---|
| Logs | Registrar eventos y errores para análisis posterior |
| Métricas | Medir comportamiento y rendimiento |
| Health checks | Determinar disponibilidad y estado operativo |
| Trazabilidad | Relacionar operaciones distribuidas entre componentes |

Las alertas utilizan estas señales como fuente para detectar condiciones que requieren atención.

## Monitoreo del backend

El backend constituye uno de los componentes principales del monitoreo debido a que concentra las operaciones de negocio, autenticación, acceso a datos, generación de documentos y comunicación con servicios externos.

Los indicadores relevantes incluyen:

- Disponibilidad del servicio.
- Tiempo de respuesta de endpoints.
- Tasa de errores HTTP.
- Errores de aplicación.
- Errores de autenticación.
- Fallos de acceso a MySQL.
- Fallos de comunicación con Redis.
- Fallos de servicios externos.
- Uso de memoria del proceso.
- Reinicios del proceso.
- Operaciones críticas.

El endpoint `GET /health` forma parte de los mecanismos disponibles para comprobar el estado básico del backend.

## Monitoreo del frontend

El frontend debe supervisarse desde la perspectiva de disponibilidad, rendimiento y errores de ejecución.

Entre los indicadores relevantes se encuentran:

- Disponibilidad de la aplicación web.
- Tiempo de carga.
- Core Web Vitals.
- Errores de JavaScript.
- Errores de comunicación con la API.
- Fallos de autenticación.
- Fallos de navegación.
- Comportamiento de operaciones críticas.

Las mediciones realizadas mediante Lighthouse proporcionan evidencia de rendimiento del frontend.

Los valores registrados actualmente incluyen:

- Performance: 98.
- Accessibility: 100.
- Best Practices: 100.
- SEO: 100.
- LCP: 2.45 s.
- CLS: 0.
- INP: 56 ms.

Estas mediciones representan una evaluación realizada en un contexto concreto y no sustituyen el monitoreo continuo en producción.

## Monitoreo de MySQL

La base de datos debe supervisarse como dependencia crítica del backend.

Los indicadores relevantes incluyen:

- Disponibilidad de la instancia.
- Tiempo de respuesta de consultas.
- Errores de conexión.
- Saturación del pool de conexiones.
- Consultas lentas.
- Bloqueos.
- Deadlocks.
- Uso de CPU.
- Uso de memoria.
- Espacio disponible.
- Estado de índices.
- Crecimiento de tablas.
- Errores relacionados con restricciones e integridad.

La configuración conocida del backend utiliza un pool de conexiones MySQL de tamaño 10.

La supervisión de estos indicadores debe complementarse con los mecanismos documentados en la documentación de base de datos.

## Monitoreo de Redis

Redis participa en mecanismos relacionados con autenticación, sesiones y listas de revocación de tokens.

El monitoreo debe considerar:

- Disponibilidad.
- Tiempo de respuesta.
- Errores de conexión.
- Uso de memoria.
- Cantidad de claves.
- Expiración de claves.
- Fallos relacionados con operaciones de sesión.
- Estado de las estructuras utilizadas para blacklist de tokens.

Una indisponibilidad de Redis debe analizarse considerando qué funcionalidades dependen de este servicio y qué comportamiento de contingencia existe.

## Monitoreo de IA

Las operaciones relacionadas con IA requieren indicadores específicos debido a que pueden depender de servicios externos y presentar tiempos de procesamiento superiores a las operaciones convencionales.

La tabla `ia_requests` permite almacenar información relacionada con solicitudes de IA, incluyendo:

- Tipo de trabajo.
- Usuario.
- Empresa.
- Prompt.
- Hash de imagen de entrada.
- URL del resultado.
- Modelo utilizado.
- Duración en milisegundos.
- Estado de la solicitud.
- Fecha de creación.

Los estados registrados para las solicitudes son:

- `OK`
- `ERROR`
- `TIMEOUT`

Estos datos permiten analizar posteriormente duración, frecuencia de errores y comportamiento de las operaciones de IA.

## Monitoreo de PM2

PM2 participa en la administración del proceso del backend.

El monitoreo debe considerar:

- Estado del proceso.
- Reinicios.
- Consumo de memoria.
- Tiempo de actividad.
- Errores del proceso.
- Cantidad de instancias cuando se utilice ejecución en cluster.
- Eventos asociados a reinicios.

La configuración conocida contempla `max_memory_restart` de 400 MB.

Los reinicios automáticos deben analizarse como señales operativas y no únicamente como mecanismos de recuperación.

## Monitoreo de disponibilidad

La disponibilidad debe evaluarse mediante comprobaciones periódicas de los servicios críticos.

Como mínimo deben contemplarse:

1. Disponibilidad del frontend.
2. Disponibilidad del backend.
3. Estado de la conexión con MySQL.
4. Estado de Redis.
5. Disponibilidad de dependencias externas críticas cuando corresponda.

El endpoint `GET /health` proporciona un mecanismo para comprobar el estado del backend y sus dependencias de base de datos.

## Monitoreo de rendimiento

El monitoreo de rendimiento debe considerar diferentes niveles.

### Frontend

- LCP.
- CLS.
- INP.
- Tiempo de carga.
- Errores de ejecución.
- Tiempo de respuesta de solicitudes HTTP.

### Backend

- Latencia de endpoints.
- Tiempo de consultas.
- Tiempo de operaciones críticas.
- Tasa de errores.
- Uso de memoria.
- Reinicios.

### Base de datos

- Latencia de consultas.
- Consultas lentas.
- Conexiones activas.
- Bloqueos.
- Deadlocks.

### IA

- Duración de solicitudes.
- Tasa de errores.
- Timeouts.
- Distribución de tiempos de respuesta.

## Monitoreo de errores

Los errores deben analizarse considerando:

- Frecuencia.
- Severidad.
- Componente afectado.
- Endpoint o operación.
- Usuario y empresa cuando sea necesario y permitido.
- Dependencia involucrada.
- Momento de ocurrencia.
- Cambios recientes.
- Repetición del problema.

Los logs proporcionan el contexto detallado del evento, mientras que las métricas permiten identificar tendencias.

## Monitoreo de seguridad

El monitoreo también debe considerar eventos relacionados con seguridad.

Entre ellos:

- Intentos de autenticación fallidos.
- Inicio de sesión.
- Cierre de sesión.
- Renovación de tokens.
- Cambios de contraseña.
- Operaciones administrativas relevantes.
- Acciones auditables.
- Errores asociados a controles de seguridad.

La información de seguridad debe manejarse evitando exponer contraseñas, tokens, secretos u otros datos sensibles.

La auditoría de acciones se documenta de manera específica en:

[Auditoría](../Auditoria/auditoria.md)

## Monitoreo multiempresa

La plataforma utiliza un modelo multiempresa, por lo que los mecanismos de monitoreo deben conservar la separación entre tenants.

Cuando una métrica, log o evento incluya información relacionada con una empresa, el contexto debe asociarse correctamente con su `empresa_id` sin permitir exposición cruzada de información.

Los datos utilizados para diagnóstico deben mantener las mismas restricciones de seguridad aplicables a los datos operativos.

## Dashboards

Un sistema de monitoreo puede utilizar dashboards para representar:

- Disponibilidad.
- Latencia.
- Errores.
- Consumo de recursos.
- Estado de dependencias.
- Rendimiento.
- Eventos de seguridad.
- Operaciones de IA.

Actualmente no se establece en esta documentación una herramienta específica de dashboards como requisito implementado.

La incorporación de una solución concreta de visualización debe evaluarse según los requisitos del entorno de despliegue.

## Monitoreo durante despliegues

Los despliegues deben acompañarse de comprobaciones que permitan detectar degradaciones posteriores al cambio.

Como mínimo deben verificarse:

- Estado del servicio.
- Health checks.
- Errores del backend.
- Errores del frontend.
- Conectividad con MySQL.
- Conectividad con Redis.
- Reinicios inesperados.
- Cambios anómalos en tiempos de respuesta.

La información de despliegue se complementa con:

[Documentación de despliegue](../../Despliegue/deployment.md)

[Monitoreo de despliegue](../../Despliegue/Operacion/monitoreo.md)

## Monitoreo durante incidentes

Durante un incidente, el monitoreo debe utilizarse para determinar:

1. Qué componente está afectado.
2. Cuándo comenzó el problema.
3. Qué operaciones presentan errores.
4. Si existe degradación de rendimiento.
5. Qué dependencias están afectadas.
6. Si existe relación con un cambio reciente.
7. Si el problema continúa después de aplicar una corrección.

El monitoreo debe proporcionar evidencia para el diagnóstico y no sustituir el análisis técnico del incidente.

## Retención de información

Los datos de monitoreo deben conservarse durante un período compatible con:

- Necesidades operativas.
- Diagnóstico de incidentes.
- Auditoría.
- Capacidad de almacenamiento.
- Requisitos legales aplicables.
- Políticas de seguridad.

La política concreta de retención debe definirse según el entorno de despliegue y las necesidades operativas.

## Privacidad y protección de datos

Los mecanismos de monitoreo no deben convertirse en una vía alternativa para almacenar información sensible.

Se debe evitar registrar innecesariamente:

- Contraseñas.
- Tokens completos.
- Secretos.
- Credenciales.
- Datos personales que no sean necesarios para el diagnóstico.
- Contenido sensible de solicitudes.

Cuando sea necesario registrar identificadores, estos deben utilizarse bajo los mismos controles de acceso y protección aplicables al sistema.

## Estado actual

Actualmente la plataforma cuenta con diferentes mecanismos que pueden utilizarse como base para el monitoreo:

- Logs mediante Winston.
- Endpoint `GET /health`.
- Registro de solicitudes de IA en `ia_requests`.
- Auditoría mediante `auditoria_acciones`.
- Administración de procesos mediante PM2.
- Métricas de rendimiento obtenidas mediante Lighthouse.
- Pruebas automatizadas del backend y frontend.

No se establece como implementada una plataforma centralizada de monitoreo, APM o dashboards operacionales.

## Aspectos pendientes

Queda por definir o implementar según las necesidades del entorno:

- Plataforma centralizada de métricas.
- Dashboards operacionales.
- Monitoreo continuo en producción.
- Alertas automáticas.
- Retención automatizada de métricas.
- Correlación entre señales mediante identificadores de trazabilidad.
- Monitoreo avanzado de MySQL y Redis.
- Monitoreo de infraestructura.
- Integración con canales de notificación.
- Umbrales operacionales específicos.

Estas actividades deben abordarse posteriormente sin asumir que una herramienta concreta forma parte de la arquitectura actual.

## Documentación relacionada

| Documento | Descripción |
|---|---|
| [Observabilidad](../observability.md) | Índice general de observabilidad |
| [Logging](../Logging/logging.md) | Registro y gestión de eventos |
| [Métricas](../Metricas/metricas.md) | Indicadores cuantitativos del sistema |
| [Health Checks](../Health%20Checks/health-checks.md) | Comprobaciones de disponibilidad y estado |
| [Alertas](../Alertas/alertas.md) | Gestión de condiciones que requieren atención |
| [Trazabilidad](../Trazabilidad/trazabilidad.md) | Correlación de operaciones entre componentes |
| [Auditoría](../Auditoria/auditoria.md) | Registro de acciones auditables |
| [Rendimiento](../Rendimiento/rendimiento.md) | Observabilidad específica del rendimiento |
| [Seguridad](../Seguridad/seguridad.md) | Observabilidad de eventos de seguridad |
| [Diagnóstico](../Diagnostico/diagnostico.md) | Procedimiento para análisis de incidentes |
| [Monitoreo de despliegue](../../Despliegue/Operacion/monitoreo.md) | Monitoreo operativo durante el despliegue |
| [Health checks de despliegue](../../Despliegue/Operacion/health-checks.md) | Comprobaciones operativas del entorno |
| [Logs de despliegue](../../Despliegue/Operacion/logs.md) | Gestión de logs durante la operación |
