# Auditoría

## Descripción

La auditoría permite registrar acciones relevantes realizadas dentro de la plataforma, proporcionando evidencia sobre operaciones que requieren seguimiento administrativo, de seguridad o de control.

La auditoría se diferencia del logging general porque está orientada al registro estructurado de acciones específicas sobre usuarios, autenticación, registros y operaciones críticas.

## Propósito

La auditoría debe permitir:

- Registrar acciones relevantes realizadas en la plataforma.
- Identificar al usuario asociado con una acción.
- Identificar la empresa relacionada.
- Registrar el registro afectado.
- Conservar información contextual de la operación.
- Facilitar investigaciones de seguridad.
- Apoyar el análisis de incidentes.
- Proporcionar evidencia sobre operaciones administrativas.
- Mantener trazabilidad sobre cambios relevantes.

## Alcance

La auditoría contempla principalmente:

- Autenticación.
- Cierre de sesión.
- Intentos de autenticación fallidos.
- Renovación de tokens.
- Cambios de contraseña.
- Eliminación de registros.
- Anulación de operaciones.
- Otras acciones críticas que requieran evidencia.

El alcance concreto depende de las acciones registradas por la aplicación.

## Tabla `auditoria_acciones`

La base de datos contiene la tabla `auditoria_acciones`, destinada al almacenamiento de acciones auditables.

Sus principales campos son:

| Campo | Descripción |
|---|---|
| `id` | Identificador de la acción auditada |
| `empresa_id` | Empresa asociada a la acción |
| `usuario_id` | Usuario relacionado con la acción |
| `usuario_nombre` | Nombre asociado al usuario |
| `accion` | Tipo de acción auditada |
| `tabla_afectada` | Tabla relacionada con la operación |
| `registro_id` | Identificador del registro afectado |
| `detalle` | Información adicional en formato JSON |
| `ip_address` | Dirección IP asociada |
| `user_agent` | Agente utilizado por el cliente |
| `created_at` | Fecha y hora del registro |

## Tipos de acciones

El campo `accion` utiliza un conjunto controlado de valores.

Actualmente se contemplan:

- `DELETE`
- `ANULACION`
- `LOGIN`
- `LOGOUT`
- `LOGIN_FALLIDO`
- `REFRESH_TOKEN`
- `CAMBIO_PASSWORD`

Estos valores permiten clasificar las acciones sin depender de texto libre.

## Autenticación

Las operaciones de autenticación constituyen una fuente importante de información de auditoría.

Se contemplan acciones relacionadas con:

- Inicio de sesión.
- Cierre de sesión.
- Intentos fallidos.
- Renovación de tokens.
- Cambios de contraseña.

Estos registros permiten analizar eventos de autenticación y relacionarlos con usuarios y empresas.

## Intentos de autenticación fallidos

Los intentos de inicio de sesión fallidos deben conservar suficiente información para identificar patrones anómalos.

El registro puede utilizar información como:

- Usuario relacionado, cuando pueda determinarse.
- Empresa, cuando corresponda.
- Dirección IP.
- User agent.
- Fecha y hora.
- Tipo de acción.

No deben almacenarse contraseñas ni credenciales proporcionadas durante el intento.

## Renovación de tokens

La acción `REFRESH_TOKEN` permite registrar operaciones relacionadas con la renovación de sesiones.

Este registro debe conservar información suficiente para auditoría sin almacenar el token completo.

Los tokens y secretos no deben incluirse en registros de auditoría.

## Cambios de contraseña

La acción `CAMBIO_PASSWORD` permite registrar que se produjo un cambio de contraseña.

El registro de auditoría no debe almacenar:

- Contraseña anterior.
- Contraseña nueva.
- Hash de contraseña.
- Token de recuperación.
- Código de recuperación.

La auditoría debe registrar el evento y su contexto, no el secreto utilizado.

## Eliminación de registros

La acción `DELETE` permite identificar operaciones de eliminación que requieren seguimiento.

Cuando corresponda, el registro puede indicar:

- Usuario.
- Empresa.
- Tabla afectada.
- Registro afectado.
- Momento.
- Información adicional.

La información almacenada debe ser suficiente para determinar qué entidad fue afectada.

## Anulación de operaciones

La acción `ANULACION` permite registrar operaciones de anulación que tengan relevancia para el control del sistema.

Este mecanismo es especialmente relevante para operaciones que no deben desaparecer del historial operativo aunque cambien de estado.

La información concreta debe permitir identificar la entidad y registro afectados.

## Empresa y aislamiento multiempresa

La tabla de auditoría contiene `empresa_id`.

Este campo permite asociar cada evento con la empresa correspondiente y mantener el contexto multiempresa.

Las consultas de auditoría deben respetar las mismas restricciones de aislamiento utilizadas por el resto de la aplicación.

Un usuario no debe poder consultar registros de auditoría pertenecientes a otra empresa sin autorización explícita.

## Usuario asociado

La auditoría contempla:

- `usuario_id`.
- `usuario_nombre`.

Estos campos permiten identificar al usuario relacionado con una acción.

El almacenamiento del nombre proporciona contexto histórico incluso cuando los datos actuales del usuario puedan cambiar posteriormente.

## Registro afectado

Los campos `tabla_afectada` y `registro_id` permiten identificar el objeto sobre el que ocurrió la acción.

Esta información resulta especialmente útil para:

- Eliminaciones.
- Anulaciones.
- Cambios administrativos.
- Investigaciones de incidentes.

No todas las acciones requieren necesariamente un registro de negocio asociado.

## Información adicional

El campo `detalle` utiliza formato JSON.

Este campo permite conservar información adicional específica de cada tipo de evento sin modificar la estructura principal de la tabla.

El contenido debe limitarse a información necesaria para auditoría.

No debe utilizarse para almacenar indiscriminadamente payloads completos de solicitudes.

## Información de red

La tabla conserva:

- `ip_address`.
- `user_agent`.

Estos datos permiten aportar contexto sobre el origen técnico de una acción.

Su utilización debe respetar las políticas de privacidad y protección de datos aplicables al sistema.

## Fecha y hora

El campo `created_at` permite determinar cuándo se registró la acción.

La información temporal es necesaria para:

- Ordenar eventos.
- Correlacionar acciones.
- Investigar incidentes.
- Comparar eventos con logs.
- Relacionar acciones con despliegues o cambios.

## Auditoría y logging

La auditoría y el logging tienen objetivos relacionados, pero diferentes.

Los logs están orientados principalmente al diagnóstico técnico y seguimiento de ejecución.

La auditoría está orientada al registro estructurado de acciones relevantes.

Por ejemplo:

```text
Logging
   |
   +---- Error de consulta
   +---- Latencia
   +---- Excepción
   +---- Evento técnico

Auditoría
   |
   +---- LOGIN
   +---- LOGOUT
   +---- DELETE
   +---- ANULACION
   +---- CAMBIO_PASSWORD
```

Una misma operación puede generar tanto logs como un registro de auditoría.

## Auditoría y trazabilidad

La trazabilidad permite reconstruir el recorrido de una operación entre componentes.

La auditoría registra acciones específicas que deben conservar evidencia.

Por ejemplo, una operación de cambio de contraseña puede generar:

1. Solicitud HTTP.
2. Validación.
3. Procesamiento del servicio.
4. Actualización en MySQL.
5. Log técnico.
6. Registro de auditoría `CAMBIO_PASSWORD`.

La trazabilidad relaciona el flujo; la auditoría conserva el evento relevante.

## Integridad de los registros

Los registros de auditoría deben conservarse de manera consistente.

Las operaciones de escritura deben evitar generar registros incompletos o inconsistentes.

Cuando una acción auditada forma parte de una operación transaccional, debe analizarse la relación entre el resultado de la operación y el registro de auditoría.

## Acceso a la auditoría

El acceso a los registros de auditoría debe estar restringido a usuarios y procesos autorizados.

Las consultas deben considerar:

- Rol.
- Empresa.
- Tipo de acción.
- Registro afectado.
- Período.
- Permisos administrativos.

La auditoría no debe convertirse en una fuente de exposición de información sensible.

## Consulta de auditoría

Las consultas deben permitir localizar eventos utilizando criterios como:

- Empresa.
- Usuario.
- Acción.
- Tabla afectada.
- Registro.
- Fecha.
- Intervalo temporal.

La implementación de filtros y vistas concretas depende de las interfaces disponibles en la aplicación.

## Auditoría de seguridad

Los eventos de autenticación pueden utilizarse para detectar:

- Incrementos de intentos fallidos.
- Actividad inusual.
- Cambios frecuentes de credenciales.
- Actividad asociada con sesiones.
- Patrones que requieran investigación.

La auditoría proporciona evidencia, mientras que el sistema de alertas puede utilizarla como una de sus fuentes.

## Retención

Los registros de auditoría deben conservarse durante un período definido según:

- Necesidades operativas.
- Requisitos legales aplicables.
- Requisitos de seguridad.
- Capacidad de almacenamiento.
- Necesidades de investigación.

Actualmente no se establece en este documento un período concreto de retención.

## Protección de información sensible

Los registros de auditoría no deben contener:

- Contraseñas.
- Tokens completos.
- Secretos.
- Claves privadas.
- Credenciales.
- Códigos de recuperación.
- Información sensible innecesaria.

El campo `detalle` debe validarse para evitar que información sensible sea introducida accidentalmente.

## Auditoría y protección multiempresa

Los registros deben mantener la separación entre tenants.

El `empresa_id` debe conservarse correctamente al generar eventos.

Las operaciones de consulta, exportación y análisis de auditoría deben aplicar controles de autorización que impidan el acceso cruzado entre empresas.

## Auditoría durante incidentes

Durante una investigación, los registros de auditoría pueden utilizarse para determinar:

- Qué usuario realizó una acción.
- Qué empresa estaba asociada.
- Qué tipo de acción ocurrió.
- Qué registro fue afectado.
- Cuándo ocurrió.
- Desde qué contexto de red se produjo.

La auditoría debe analizarse junto con logs, métricas y trazabilidad.

## Estado actual

Actualmente la estructura de base de datos contempla la tabla `auditoria_acciones` con:

- Identificación de empresa.
- Identificación de usuario.
- Nombre del usuario.
- Tipo controlado de acción.
- Tabla afectada.
- Registro afectado.
- Detalle JSON.
- Dirección IP.
- User agent.
- Fecha de creación.

También se encuentran definidos los tipos de acciones:

- `DELETE`.
- `ANULACION`.
- `LOGIN`.
- `LOGOUT`.
- `LOGIN_FALLIDO`.
- `REFRESH_TOKEN`.
- `CAMBIO_PASSWORD`.

## Aspectos pendientes

Queda por definir o reforzar según la evolución del sistema:

- Cobertura completa de acciones críticas.
- Política formal de retención.
- Mecanismos de consulta administrativa.
- Protección frente a modificación o eliminación no autorizada.
- Integración con alertas.
- Correlación con identificadores de trazabilidad.
- Exportación controlada de registros.
- Monitoreo de integridad de la auditoría.
- Procedimientos de revisión periódica.

## Documentación relacionada

| Documento | Descripción |
|---|---|
| [Observabilidad](../observability.md) | Índice general de observabilidad |
| [Logging](../Logging/logging.md) | Registro técnico de eventos |
| [Métricas](../Metricas/metricas.md) | Indicadores de observabilidad |
| [Health Checks](../Health%20Checks/health-checks.md) | Comprobaciones de disponibilidad |
| [Monitoreo](../Monitoreo/monitoreo.md) | Supervisión operacional |
| [Alertas](../Alertas/alertas.md) | Gestión de condiciones relevantes |
| [Trazabilidad](../Trazabilidad/trazabilidad.md) | Correlación de operaciones |
| [Rendimiento](../Rendimiento/rendimiento.md) | Observabilidad del rendimiento |
| [Seguridad](../Seguridad/seguridad.md) | Observabilidad relacionada con seguridad |
| [Diagnóstico](../Diagnostico/diagnostico.md) | Análisis de incidentes |
| [Entidades de base de datos](../../Base%20de%20Datos/Entidades/auditoria-acciones.md) | Estructura de `auditoria_acciones` |
| [Base de datos](../../Base%20de%20Datos/database.md) | Documentación general de la base de datos |
