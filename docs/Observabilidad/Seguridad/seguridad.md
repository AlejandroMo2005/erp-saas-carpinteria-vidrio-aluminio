# Seguridad

## Descripción

Esta documentación define los aspectos de seguridad que deben observarse desde la perspectiva de la observabilidad de la plataforma ERP/SaaS.

La observabilidad de seguridad permite identificar eventos relacionados con autenticación, autorización, sesiones, aislamiento multiempresa, solicitudes potencialmente anómalas y errores que puedan afectar la protección de la información.

## Propósito

El propósito es establecer qué señales de seguridad deben registrarse, monitorearse y relacionarse con otros mecanismos de observabilidad.

La observabilidad de seguridad no sustituye los controles preventivos. Su función es proporcionar evidencia para detectar, analizar y responder ante eventos relevantes.

## Alcance

Comprende:

- Autenticación.
- Autorización.
- Gestión de sesiones.
- Tokens JWT.
- Lista de revocación de tokens.
- Aislamiento multiempresa.
- Validación de solicitudes.
- Eventos de seguridad.
- Errores de autenticación.
- Auditoría.
- Logs relacionados con seguridad.
- Detección de comportamientos anómalos.
- Diagnóstico de incidentes.

## Autenticación

Las operaciones de autenticación constituyen una fuente importante de señales de seguridad.

Deben observarse:

- Inicios de sesión exitosos.
- Inicios de sesión fallidos.
- Cierres de sesión.
- Renovaciones de tokens.
- Cambios de contraseña.
- Expiración de sesiones.
- Errores durante la autenticación.

La tabla `auditoria_acciones` contempla acciones específicas relacionadas con autenticación, incluyendo `LOGIN`, `LOGOUT`, `LOGIN_FALLIDO`, `REFRESH_TOKEN` y `CAMBIO_PASSWORD`.

## Autorización

La observabilidad debe permitir identificar operaciones rechazadas por falta de permisos.

Entre los eventos relevantes se encuentran:

- Acceso a recursos sin autorización.
- Intentos de utilizar funciones fuera del rol asignado.
- Acceso a recursos pertenecientes a otra empresa.
- Solicitudes rechazadas por middleware de seguridad.
- Errores relacionados con permisos.

Estos eventos deben diferenciarse de errores funcionales o de disponibilidad.

## Gestión de sesiones

La plataforma utiliza mecanismos de sesión asociados a tokens y almacenamiento persistente de sesiones.

La tabla `usuarios_sesiones` permite registrar información relacionada con las sesiones, incluyendo:

- Usuario.
- Hash del token.
- Dirección IP.
- User agent.
- Fecha de expiración.
- Fecha de creación.
- Último uso.

La observabilidad de sesiones debe evitar registrar tokens utilizables o credenciales en texto plano.

## Tokens JWT

Los tokens JWT forman parte del mecanismo de autenticación.

El identificador `jti` permite asociar un token con eventos relacionados con su ciclo de vida. El sistema también utiliza `token_id` para determinados mecanismos de gestión de sesión.

La observabilidad debe utilizar estos identificadores únicamente como elementos de correlación y nunca como sustitutos del control de acceso.

## Revocación de tokens

La plataforma utiliza Redis y MySQL para mecanismos relacionados con la lista de bloqueo de tokens.

La tabla `token_blacklist` contiene:

- `jti`.
- `expires_at`.
- `created_at`.

Desde la perspectiva de observabilidad deben considerarse:

- Errores de consulta de la blacklist.
- Fallos de conexión con Redis.
- Tokens rechazados por revocación.
- Expiraciones.
- Inconsistencias detectadas durante la validación.

## Aislamiento multiempresa

El sistema utiliza `empresa_id` como elemento de aislamiento de los datos entre empresas.

La observabilidad debe prestar especial atención a:

- Solicitudes con `empresa_id`.
- Consultas que deben respetar el contexto de empresa.
- Intentos de acceso a información fuera del contexto autorizado.
- Errores de resolución del tenant.
- Operaciones ejecutadas sin contexto de empresa cuando este sea obligatorio.

Un evento relacionado con posible violación del aislamiento debe tratarse como evento de seguridad y no únicamente como error funcional.

## Validación de solicitudes

La validación de entradas constituye una fuente adicional de señales de seguridad.

Deben observarse los errores relevantes producidos por:

- Datos con formato inválido.
- Parámetros inesperados.
- Payloads que superan límites establecidos.
- Valores incompatibles con los esquemas esperados.
- Solicitudes rechazadas antes de llegar a la lógica de negocio.

La información registrada debe ser suficiente para diagnosticar el evento sin almacenar datos sensibles innecesarios.

## Protección contra abuso

Los mecanismos de protección contra solicitudes excesivas deben generar señales observables cuando una operación alcance los límites configurados.

Los eventos relevantes incluyen:

- Solicitudes rechazadas por limitación de frecuencia.
- Incrementos anormales de solicitudes.
- Repetición de operaciones de autenticación.
- Incrementos inusuales de errores.
- Patrones de solicitudes incompatibles con el comportamiento esperado.

Los umbrales concretos deben definirse a partir de mediciones y comportamiento operativo real.

## Logging de seguridad

Winston constituye el mecanismo conocido de logging de la aplicación.

Los eventos de seguridad deben mantener suficiente contexto para facilitar el diagnóstico, considerando:

- Fecha y hora.
- Nivel del evento.
- Operación.
- Usuario cuando corresponda.
- Empresa cuando corresponda.
- Dirección IP cuando sea necesaria.
- Resultado de la operación.
- Error asociado cuando exista.
- Identificadores de correlación disponibles.

Los logs no deben convertirse en un mecanismo para almacenar contraseñas, tokens completos u otros secretos.

## Auditoría de seguridad

La tabla `auditoria_acciones` constituye una fuente de información para eventos auditables.

Entre las acciones relacionadas con seguridad se encuentran:

- `LOGIN`.
- `LOGOUT`.
- `LOGIN_FALLIDO`.
- `REFRESH_TOKEN`.
- `CAMBIO_PASSWORD`.
- `DELETE`.
- `ANULACION`.

La auditoría y el logging cumplen funciones diferentes. La auditoría registra eventos que requieren persistencia y consulta posterior, mientras que el logging proporciona información operativa y diagnóstica.

## Protección de información sensible

La observabilidad debe aplicar minimización de datos.

No se deben registrar innecesariamente:

- Contraseñas.
- Tokens completos.
- Cookies de sesión.
- Credenciales.
- Claves secretas.
- Contenido sensible de solicitudes.
- Información personal que no sea necesaria para el diagnóstico.

Cuando un dato sea necesario para correlación, debe utilizarse un identificador o representación que no permita reutilizarlo como credencial.

## Inyección de logs

La información proveniente de solicitudes externas puede contener caracteres o contenido que dificulte la interpretación de los logs.

Los mensajes de log deben construirse de forma segura y evitar que valores controlados por el usuario puedan modificar la estructura esperada de los registros.

Los hallazgos de Log Injection identificados durante el análisis estático deben revisarse según el flujo concreto antes de aplicar una modificación.

## Errores de seguridad

Los errores relacionados con autenticación, autorización, sesiones o validaciones deben conservar información suficiente para determinar:

- Qué operación falló.
- En qué componente ocurrió.
- Qué resultado produjo.
- Qué contexto estaba disponible.
- Si el evento debe generar una alerta.
- Si debe persistirse mediante auditoría.

El mensaje no debe revelar información interna innecesaria al cliente.

## Correlación con trazabilidad

Los eventos de seguridad deben poder relacionarse con la operación que los originó.

Los identificadores disponibles pueden incluir:

- `jti`.
- `token_id`.
- `empresa_id`.
- `usuario_id`.
- Identificadores de auditoría.
- Identificadores de solicitudes cuando estén disponibles.

No se debe asumir la existencia de un `correlation_id` universal mientras este mecanismo no se encuentre establecido de forma consistente.

## Correlación con métricas

Las métricas permiten detectar cambios cuantitativos que pueden complementar los eventos individuales.

Ejemplos:

- Incremento de inicios de sesión fallidos.
- Incremento de respuestas HTTP de error.
- Incremento de solicitudes rechazadas.
- Incremento de errores de autenticación.
- Incremento de fallos de Redis relacionados con sesiones.
- Incremento de operaciones rechazadas por validación.

Una métrica anómala debe poder conducir hacia logs o registros de auditoría que permitan investigar su causa.

## Alertas de seguridad

Las alertas deben utilizarse para eventos que requieran atención operativa.

Pueden considerarse como fuentes de alerta:

- Indisponibilidad del mecanismo de autenticación.
- Incremento anormal de autenticaciones fallidas.
- Fallos repetidos de autorización.
- Problemas con la blacklist de tokens.
- Errores repetidos de validación.
- Posibles problemas de aislamiento multiempresa.
- Comportamientos anómalos detectados por métricas.

Los umbrales deben definirse después de obtener una línea base suficiente para evitar ruido operativo.

## Seguridad de la observabilidad

Los propios mecanismos de observabilidad deben protegerse.

Se debe controlar:

- Quién puede consultar logs.
- Quién puede consultar auditorías.
- Quién puede consultar métricas.
- Quién puede modificar configuraciones de monitoreo.
- Quién puede acceder a información de diagnóstico.
- Cómo se almacenan los registros.
- Cómo se controla la retención.

La información de observabilidad puede contener datos sensibles y debe considerarse parte de la superficie de seguridad.

## Retención

La retención de logs, métricas y auditorías debe definirse según:

- Necesidades operativas.
- Necesidades de auditoría.
- Capacidad de almacenamiento.
- Requisitos legales aplicables.
- Sensibilidad de la información.
- Utilidad histórica para investigación.

No debe establecerse un período específico sin una decisión documentada y justificada.

## Incidentes de seguridad

Ante un posible incidente, la observabilidad debe proporcionar evidencia suficiente para reconstruir la secuencia de eventos.

La investigación debe correlacionar:

1. Logs.
2. Auditoría.
3. Trazabilidad.
4. Métricas.
5. Health checks.
6. Estado de infraestructura.
7. Estado de las dependencias.

Los registros originales deben conservarse de forma que la investigación no dependa únicamente de información reconstruida posteriormente.

## Estado actual

La plataforma dispone de mecanismos de logging mediante Winston, auditoría persistente mediante `auditoria_acciones`, gestión de sesiones, JWT, `jti`, `token_id`, Redis y mecanismos de aislamiento mediante `empresa_id`.

También existen mecanismos de validación y controles de seguridad integrados en la aplicación.

La observabilidad de seguridad se encuentra parcialmente distribuida entre estos componentes y requiere consolidar métricas, alertas y procedimientos operativos para disponer de una estrategia completa.

## Aspectos pendientes

Queda pendiente:

- Definir métricas específicas de seguridad.
- Establecer líneas base de eventos de autenticación.
- Definir umbrales de alertas de seguridad.
- Centralizar cuando corresponda las señales de seguridad.
- Establecer políticas formales de retención.
- Documentar procedimientos de respuesta ante incidentes.
- Validar de forma periódica la protección contra Log Injection.
- Revisar los hallazgos de seguridad del análisis estático según su contexto.
- Establecer controles formales de acceso a los sistemas de observabilidad.
- Incorporar pruebas de seguridad al flujo completo de observabilidad.

## Documentación relacionada

| Documento | Relación |
|---|---|
| [Observabilidad](../observability.md) | Índice general de observabilidad. |
| [Logging](../Logging/logging.md) | Registro operativo y de seguridad. |
| [Métricas](../Metricas/metricas.md) | Métricas utilizadas para detectar eventos anómalos. |
| [Health Checks](../Health%20Checks/health-checks.md) | Estado de servicios y dependencias. |
| [Monitoreo](../Monitoreo/monitoreo.md) | Supervisión general de la plataforma. |
| [Alertas](../Alertas/alertas.md) | Gestión de alertas y eventos anómalos. |
| [Trazabilidad](../Trazabilidad/trazabilidad.md) | Correlación de operaciones entre componentes. |
| [Auditoría](../Auditoria/auditoria.md) | Registro persistente de eventos auditables. |
| [Diagnóstico](../Diagnostico/diagnostico.md) | Investigación de problemas e incidentes. |
| [Autenticación y autorización](../../Arquitectura/architecture.md) | Contexto arquitectónico de seguridad. |
| [Integridad de datos](../../Base%20de%20Datos/Integridad/integridad.md) | Controles de integridad de la persistencia. |
| [Concurrencia](../../Base%20de%20Datos/Concurrencia/concurrencia.md) | Seguridad e integridad bajo operaciones concurrentes. |
| [Seguridad del despliegue](../../Despliegue/Seguridad/seguridad-despliegue.md) | Controles de seguridad del entorno desplegado. |
| [Variables de entorno](../../Despliegue/Configuracion/variables-entorno.md) | Gestión de configuración sensible. |
| [Secretos](../../Despliegue/Configuracion/secretos.md) | Protección de credenciales y secretos. |
