# Trazabilidad

## Descripción

La trazabilidad permite relacionar una operación con los diferentes componentes que participan en su procesamiento.

En una plataforma ERP/SaaS, una misma operación puede atravesar el frontend, la API, los módulos del backend, MySQL, Redis y servicios externos. La trazabilidad proporciona el contexto necesario para reconstruir ese recorrido durante el diagnóstico de errores, incidentes y operaciones críticas.

Este documento define los principios de trazabilidad aplicables a la plataforma.

## Propósito

La trazabilidad debe permitir:

- Relacionar una operación con sus diferentes componentes.
- Facilitar el diagnóstico de errores.
- Identificar el origen y recorrido de una solicitud.
- Correlacionar eventos de logs.
- Relacionar operaciones con registros persistidos.
- Facilitar el análisis de incidentes.
- Diferenciar operaciones entre empresas.
- Proporcionar evidencia técnica sin exponer información sensible.

## Alcance

La trazabilidad contempla principalmente:

- Frontend.
- Solicitudes HTTP.
- Backend.
- Autenticación.
- Operaciones de negocio.
- MySQL.
- Redis.
- Procesos de IA.
- Auditoría.
- Procesos administrados mediante PM2.

No todas las operaciones requieren el mismo nivel de trazabilidad. Las operaciones críticas deben disponer de suficiente contexto para reconstruir su ejecución.

## Flujo de una operación

Una operación típica puede seguir un recorrido similar a:

```text
Frontend
   |
   v
Solicitud HTTP
   |
   v
Middleware
   |
   v
Controlador / Handler
   |
   v
Servicio
   |
   +------> MySQL
   |
   +------> Redis
   |
   +------> Servicio externo
   |
   v
Respuesta HTTP
```

La trazabilidad debe permitir relacionar los eventos producidos durante este recorrido.

## Contexto de una solicitud

Cuando resulte necesario, los eventos deben asociarse con información contextual como:

- Método HTTP.
- Ruta.
- Estado HTTP.
- Usuario autenticado.
- Empresa.
- Identificador de operación.
- Identificador de recurso.
- Duración.
- Resultado.
- Error producido.

La información utilizada debe limitarse a los datos necesarios para diagnóstico y auditoría.

## Identificadores de trazabilidad

Un identificador de trazabilidad permite relacionar múltiples eventos pertenecientes a una misma operación.

El identificador debe:

- Ser único dentro del contexto correspondiente.
- Acompañar los eventos relacionados.
- No contener información sensible.
- No utilizar credenciales como identificador.
- Poder localizar los registros relacionados.
- Mantener un formato consistente.

Actualmente no se documenta como implementado un identificador de correlación distribuida específico para todas las solicitudes de la plataforma.

Por ello, la incorporación de un mecanismo formal de `correlation_id` o equivalente queda como aspecto pendiente.

## JWT y trazabilidad

El sistema de autenticación utiliza JWT y contempla identificadores como `jti` y `token_id`.

El `jti` identifica un token JWT concreto y participa en mecanismos relacionados con la revocación y blacklist.

Estos identificadores pueden aportar contexto técnico para operaciones de autenticación, pero no deben considerarse automáticamente equivalentes a un identificador de trazabilidad de una solicitud.

Los tokens completos no deben registrarse en logs.

## Empresa y trazabilidad multiempresa

La plataforma utiliza `empresa_id` para separar la información de los tenants.

Cuando una operación esté asociada con una empresa, el contexto de trazabilidad debe conservar dicha relación de forma segura.

El contexto de empresa no debe utilizarse como único identificador de una operación, ya que una misma empresa puede ejecutar múltiples operaciones simultáneamente.

## Usuario y trazabilidad

Cuando corresponda, una operación puede relacionarse con el usuario autenticado.

El contexto puede incluir:

- `usuario_id`.
- Rol.
- Empresa.
- Operación realizada.

No deben registrarse contraseñas, tokens ni credenciales.

La información del usuario debe utilizarse respetando los controles de acceso y protección de datos de la aplicación.

## Trazabilidad de operaciones de negocio

Las operaciones críticas del ERP deben poder relacionarse con sus principales entidades.

Entre ellas:

- Proformas.
- Pedidos.
- Facturas.
- Materiales.
- Clientes.
- Proveedores.
- Solicitudes de materiales.
- Operaciones de inventario.
- Configuración.
- Procesos de IA.

La relación puede realizarse mediante identificadores de registros, siempre que su utilización sea necesaria para diagnóstico o auditoría.

## Trazabilidad de base de datos

Las operaciones que interactúan con MySQL deben poder relacionarse con el contexto de la solicitud que las originó.

Los elementos relevantes pueden incluir:

- Operación ejecutada.
- Entidad afectada.
- Identificador del registro.
- Duración.
- Resultado.
- Error.

No se debe registrar indiscriminadamente el contenido completo de consultas si contiene información sensible.

## Trazabilidad de Redis

Las operaciones que utilizan Redis deben poder relacionarse con el contexto de la operación que las originó.

Esto es especialmente relevante para:

- Sesiones.
- Tokens.
- Blacklist.
- Datos temporales.
- Mecanismos de autenticación.

Las claves o valores sensibles no deben exponerse directamente en los logs.

## Trazabilidad de IA

Las solicitudes de IA disponen de información persistida en `ia_requests`.

Entre los datos registrados se encuentran:

- Empresa.
- Usuario.
- Tipo de trabajo.
- Prompt.
- Hash de imagen de entrada.
- Modelo.
- Duración.
- Estado.
- Fecha de creación.

Estos datos permiten relacionar una solicitud de IA con su resultado y comportamiento temporal.

El hash de la imagen puede utilizarse como referencia técnica sin registrar necesariamente el contenido de la imagen.

## Estados de solicitudes de IA

Las solicitudes de IA pueden presentar los siguientes estados:

- `OK`
- `ERROR`
- `TIMEOUT`

Estos estados permiten distinguir entre operaciones completadas y operaciones que requieren investigación.

La duración registrada en `duracion_ms` permite analizar posteriormente el rendimiento de estas operaciones.

## Trazabilidad de autenticación

Los eventos de autenticación deben poder relacionarse con:

- Usuario.
- Empresa.
- Tipo de operación.
- Momento.
- Resultado.
- Identificadores técnicos cuando corresponda.

La tabla `auditoria_acciones` contempla acciones relacionadas con:

- `LOGIN`
- `LOGOUT`
- `LOGIN_FALLIDO`
- `REFRESH_TOKEN`
- `CAMBIO_PASSWORD`

La auditoría complementa la trazabilidad, pero ambas tienen objetivos diferentes.

## Trazabilidad y auditoría

La trazabilidad responde principalmente a:

> ¿Qué recorrido siguió una operación?

La auditoría responde principalmente a:

> ¿Qué acción relevante quedó registrada, quién la realizó y sobre qué registro?

Ambos mecanismos pueden utilizar información relacionada, pero no deben considerarse equivalentes.

La documentación específica de auditoría se encuentra en:

[Auditoría](../Auditoria/auditoria.md)

## Trazabilidad y logging

Los logs contienen los eventos generados durante la ejecución.

La trazabilidad proporciona el contexto necesario para relacionar esos eventos.

Por ejemplo:

```text
correlation_id
      |
      +----> solicitud HTTP
      |
      +----> validación
      |
      +----> operación de negocio
      |
      +----> consulta MySQL
      |
      +----> operación Redis
      |
      +----> servicio externo
      |
      +----> respuesta HTTP
```

La existencia de un identificador común permite reconstruir la secuencia sin depender únicamente del orden temporal de los mensajes.

## Duración de operaciones

La duración debe registrarse cuando sea relevante para evaluar rendimiento.

Puede aplicarse a:

- Solicitudes HTTP.
- Consultas.
- Operaciones de negocio.
- Solicitudes de IA.
- Operaciones externas.

Las mediciones de duración permiten identificar operaciones que presentan degradaciones respecto al comportamiento esperado.

## Errores y trazabilidad

Cuando una operación produce un error, el contexto debe permitir determinar:

- Operación ejecutada.
- Componente afectado.
- Usuario y empresa cuando corresponda.
- Identificador de recurso.
- Error producido.
- Momento.
- Duración.
- Dependencia involucrada.

Los errores deben registrarse sin incluir secretos o información sensible innecesaria.

## Trazabilidad de operaciones críticas

Las operaciones que afectan datos relevantes deben disponer de mayor contexto de diagnóstico.

Entre ellas:

- Creación y modificación de proformas.
- Procesamiento de pedidos.
- Generación y modificación de facturas.
- Cambios de inventario.
- Operaciones de autenticación.
- Cambios de configuración.
- Operaciones de IA.
- Acciones administrativas.

El nivel de detalle debe equilibrar capacidad de diagnóstico, rendimiento y protección de datos.

## Correlación temporal

Los eventos deben utilizar una referencia temporal consistente.

La fecha y hora deben permitir ordenar:

1. Inicio de la operación.
2. Procesamiento.
3. Acceso a dependencias.
4. Error o resultado.
5. Finalización.

La correlación temporal es especialmente importante cuando participan varios componentes.

## Seguridad de los identificadores

Los identificadores de trazabilidad no deben:

- Contener contraseñas.
- Contener tokens.
- Contener secretos.
- Exponer credenciales.
- Incluir datos personales innecesarios.
- Permitir modificar una operación mediante manipulación del identificador.

Cuando un identificador sea proporcionado desde el cliente, el backend debe validarlo antes de utilizarlo como contexto confiable.

## Integridad de la trazabilidad

Los mecanismos de trazabilidad deben evitar modificaciones o pérdidas de contexto durante el procesamiento.

Los identificadores deben propagarse de manera consistente entre las capas que participen en una operación.

Si una operación genera una nueva operación independiente, debe determinarse si conserva el identificador original o genera uno nuevo.

## Rendimiento

La trazabilidad introduce cierto costo de procesamiento y almacenamiento.

Por ello:

- Los identificadores deben ser ligeros.
- No se debe registrar información innecesaria.
- Los payloads completos no deben almacenarse indiscriminadamente.
- Las operaciones de alta frecuencia deben evaluarse cuidadosamente.
- El nivel de detalle debe adaptarse al entorno.

La trazabilidad debe proporcionar valor suficiente sin convertirse en una fuente significativa de sobrecarga.

## Diagnóstico mediante trazabilidad

Ante un incidente, la trazabilidad puede utilizarse para reconstruir el flujo:

1. Identificar el síntoma.
2. Localizar el evento inicial.
3. Obtener el identificador de operación.
4. Buscar eventos relacionados.
5. Identificar componentes involucrados.
6. Revisar dependencias.
7. Determinar el punto de fallo.
8. Correlacionar con cambios recientes.
9. Aplicar la corrección.
10. Verificar el comportamiento posterior.

Este procedimiento se complementa con los mecanismos definidos en:

[Diagnóstico](../Diagnostico/diagnostico.md)

## Estado actual

Actualmente existen mecanismos que proporcionan información útil para la trazabilidad:

- `jti` en JWT.
- `token_id` relacionado con autenticación.
- `empresa_id` para contexto multiempresa.
- `usuario_id` para operaciones asociadas a usuarios.
- `ia_requests` para solicitudes de IA.
- `auditoria_acciones` para acciones auditables.
- Logs mediante Winston.
- Información temporal de eventos.

Estos mecanismos no equivalen a una solución completa de trazabilidad distribuida.

## Aspectos pendientes

Queda por definir o implementar:

- Identificador de correlación para solicitudes.
- Propagación del identificador entre capas.
- Correlación frontend-backend.
- Correlación backend-MySQL.
- Correlación backend-Redis.
- Correlación con servicios externos.
- Estructura estandarizada del contexto de trazabilidad.
- Integración con una plataforma centralizada de observabilidad, si se requiere.
- Retención y consulta de identificadores.
- Reglas específicas de protección de datos.

## Documentación relacionada

| Documento | Descripción |
|---|---|
| [Observabilidad](../observability.md) | Índice general de observabilidad |
| [Logging](../Logging/logging.md) | Registro de eventos y errores |
| [Métricas](../Metricas/metricas.md) | Indicadores cuantitativos |
| [Health Checks](../Health%20Checks/health-checks.md) | Estado de los servicios |
| [Monitoreo](../Monitoreo/monitoreo.md) | Supervisión operacional |
| [Alertas](../Alertas/alertas.md) | Detección de condiciones relevantes |
| [Auditoría](../Auditoria/auditoria.md) | Registro de acciones auditables |
| [Rendimiento](../Rendimiento/rendimiento.md) | Observabilidad del rendimiento |
| [Seguridad](../Seguridad/seguridad.md) | Observabilidad de eventos de seguridad |
| [Diagnóstico](../Diagnostico/diagnostico.md) | Procedimiento de análisis de incidentes |
| [Arquitectura](../../Arquitectura/architecture.md) | Arquitectura general de la plataforma |
| [Base de datos](../../Base%20de%20Datos/database.md) | Estructura y operación de la base de datos |
