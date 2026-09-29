# Cumplimiento y Consideraciones Legales

## Descripción

Este documento establece las consideraciones de cumplimiento que deben tenerse en cuenta durante el diseño, desarrollo, operación y evolución de la plataforma ERP/SaaS.

El documento define criterios técnicos relacionados con protección de datos, seguridad de la información, trazabilidad, tratamiento de credenciales, conservación de registros y responsabilidades sobre la información gestionada por el sistema.

## Objetivo

Establecer una referencia para identificar y gestionar los requisitos legales y regulatorios que puedan afectar al sistema, evitando asumir cumplimiento normativo sin una validación jurídica específica.

## Alcance

Las consideraciones de cumplimiento abarcan:

- Protección de datos personales.
- Seguridad de la información.
- Gestión de usuarios y credenciales.
- Auditoría.
- Trazabilidad.
- Información empresarial.
- Información de clientes.
- Información de facturación.
- Servicios externos.
- Inteligencia artificial.
- Gestión de secretos.
- Conservación y eliminación de información.
- Responsabilidades de operación.
- Revisión de requisitos legales.

## Contexto Normativo

La plataforma está destinada a operar en Ecuador.

Los requisitos legales aplicables deben determinarse según:

- Tipo de información procesada.
- Actividades realizadas por la empresa usuaria.
- Naturaleza de los datos personales.
- Obligaciones tributarias aplicables.
- Servicios externos utilizados.
- Modalidad de operación del sistema.
- Requisitos contractuales establecidos con clientes y proveedores.

La existencia de controles técnicos no constituye por sí misma una certificación de cumplimiento legal.

Cuando una obligación requiera interpretación jurídica, deberá ser validada con la normativa vigente y, cuando corresponda, con asesoría profesional especializada.

## Protección de Datos Personales

La plataforma puede procesar información relacionada con usuarios, clientes, proveedores y otras personas asociadas a las operaciones empresariales.

Entre los datos que pueden formar parte del sistema se encuentran:

- Nombre.
- Teléfono.
- Correo electrónico.
- Dirección.
- Cédula o RUC.
- Información asociada a usuarios.
- Dirección IP.
- User agent.
- Información de sesiones.
- Registros de auditoría.

El tratamiento de estos datos debe limitarse a las finalidades necesarias para la operación del sistema y a las obligaciones que resulten aplicables.

## Principios de Tratamiento

El diseño del sistema debe considerar principios como:

- Finalidad.
- Minimización.
- Transparencia.
- Exactitud.
- Seguridad.
- Confidencialidad.
- Limitación de conservación.
- Responsabilidad.

La aplicación concreta de estos principios debe determinarse según el tratamiento realizado y la normativa aplicable.

## Seguridad de la Información

La arquitectura incorpora controles técnicos destinados a reducir riesgos sobre la información.

Entre ellos:

- Autenticación.
- Autorización.
- Aislamiento por empresa.
- Validación de entradas.
- Protección CSRF.
- Gestión segura de tokens.
- Revocación de sesiones.
- Gestión de secretos mediante variables de entorno.
- Content Security Policy.
- HSTS.
- Trusted Types.
- Rate limiting.
- Logging.
- Auditoría.

Estos controles deben mantenerse durante la evolución del sistema.

## Control de Acceso

El acceso a información debe estar limitado según la identidad y autorización del usuario.

El sistema utiliza roles para diferenciar responsabilidades dentro de la aplicación.

La autorización debe aplicarse en el backend y no depender exclusivamente de las restricciones existentes en la interfaz de usuario.

## Multi-tenancy

La información empresarial se encuentra aislada mediante `empresa_id`.

Este aislamiento es una medida técnica relevante para evitar que usuarios de una empresa accedan accidentalmente a información perteneciente a otra.

Las consultas y operaciones que manipulan información empresarial deben conservar el contexto de la empresa correspondiente.

## Credenciales y Secretos

Las contraseñas y credenciales no deben almacenarse ni exponerse de forma insegura.

Los secretos utilizados por la aplicación y por los servicios externos deben gestionarse mediante variables de entorno o mecanismos equivalentes de gestión segura.

Los secretos no deben almacenarse en:

- Código fuente.
- Commits.
- Issues.
- Logs.
- Reportes.
- Artefactos públicos.
- Respuestas de API.

## Auditoría

La base de datos contiene la entidad `auditoria_acciones`, destinada a registrar determinadas acciones relevantes del sistema.

Los registros pueden incluir información como:

- Usuario.
- Empresa.
- Acción.
- Tabla afectada.
- Registro afectado.
- Detalle.
- Dirección IP.
- User agent.
- Fecha de creación.

La auditoría debe utilizarse para facilitar la trazabilidad de operaciones relevantes.

La información registrada debe limitarse a los datos necesarios para la finalidad de auditoría y no debe utilizarse como mecanismo para almacenar secretos.

## Retención de Información

Los períodos de conservación deben definirse de acuerdo con:

- Requisitos legales aplicables.
- Necesidades operativas.
- Obligaciones tributarias.
- Requisitos contractuales.
- Políticas internas de la empresa.

No se debe establecer un período legal de conservación sin verificar previamente la obligación correspondiente.

Los mecanismos técnicos de eliminación lógica, eliminación física y conservación deben alinearse con la política definida para cada tipo de información.

## Eliminación Lógica

Algunas entidades del sistema utilizan mecanismos de eliminación lógica mediante campos como `deleted_at`.

Este mecanismo permite conservar determinados registros sin mantenerlos necesariamente visibles en las operaciones normales.

La eliminación lógica no debe interpretarse automáticamente como cumplimiento de una solicitud legal de eliminación. La respuesta dependerá del tipo de dato, finalidad, obligación de conservación y normativa aplicable.

## Información de Facturación

La plataforma gestiona información relacionada con facturación y procesos asociados al SRI.

La información tributaria debe tratarse conforme a los requisitos aplicables al negocio que utilice la plataforma.

La implementación técnica del sistema no sustituye las obligaciones tributarias de la empresa usuaria.

Los procesos relacionados con comprobantes electrónicos deben mantenerse alineados con los requisitos vigentes del SRI cuando se utilicen en producción.

## Datos de Clientes y Proveedores

La información de clientes y proveedores debe utilizarse únicamente para las finalidades relacionadas con la operación empresarial correspondiente.

El acceso debe limitarse a los usuarios autorizados.

La información no debe compartirse con terceros sin una base legal, contractual u operativa válida según corresponda.

## Servicios Externos

La plataforma utiliza servicios externos, incluyendo servicios relacionados con inteligencia artificial.

Antes de utilizar un proveedor externo en producción se deben revisar:

- Condiciones del servicio.
- Política de privacidad.
- Tratamiento de datos.
- Ubicación y transferencia de información.
- Retención de datos.
- Subprocesadores.
- Medidas de seguridad.
- Uso de información para entrenamiento cuando corresponda.
- Mecanismos de eliminación.
- Responsabilidades contractuales.

La revisión debe realizarse antes de enviar información sensible a un proveedor externo.

## Inteligencia Artificial

Las funcionalidades de IA pueden procesar imágenes, prompts y otros datos asociados a solicitudes de generación o análisis.

La integración debe evitar enviar información personal o confidencial que no sea necesaria para obtener el resultado requerido.

La documentación técnica de IA se encuentra en:

[`docs/IA/ai.md`](../IA/ai.md)

Las condiciones legales y de privacidad de cada proveedor deben revisarse de manera independiente antes de utilizar el servicio en producción.

## Incidentes de Seguridad

Los incidentes que puedan comprometer información deben registrarse y analizarse mediante el procedimiento operativo correspondiente.

El análisis debe permitir determinar:

- Qué ocurrió.
- Cuándo ocurrió.
- Qué información pudo verse afectada.
- Qué sistemas estuvieron involucrados.
- Qué usuarios o empresas pudieron verse afectados.
- Qué medidas fueron aplicadas.
- Qué acciones preventivas deben adoptarse.

Las obligaciones de notificación deben determinarse conforme a la normativa aplicable y a las circunstancias concretas del incidente.

## Derechos de los Titulares

Cuando el sistema procese datos personales, deben considerarse los derechos reconocidos por la normativa aplicable.

La implementación técnica de mecanismos para atender solicitudes de titulares debe definirse según los requisitos jurídicos concretos y la naturaleza de los datos procesados.

Las funcionalidades de consulta, actualización, corrección, eliminación, oposición u otras solicitudes no deben implementarse como obligaciones legales genéricas sin verificar previamente su fundamento y alcance.

## Responsabilidad de la Empresa Usuaria

La empresa que utilice la plataforma mantiene responsabilidades relacionadas con:

- Información que incorpora al sistema.
- Usuarios que autoriza.
- Finalidades del tratamiento.
- Gestión de permisos.
- Exactitud de los datos.
- Cumplimiento de obligaciones tributarias.
- Cumplimiento de obligaciones contractuales.
- Uso de servicios externos.

La plataforma proporciona mecanismos técnicos, pero estos no sustituyen las responsabilidades legales y administrativas de la empresa usuaria.

## Responsabilidad del Sistema

Desde el punto de vista técnico, el sistema debe proporcionar mecanismos razonables para:

- Controlar acceso.
- Aislar información.
- Registrar acciones relevantes.
- Proteger credenciales.
- Validar entradas.
- Detectar errores.
- Mantener trazabilidad.
- Gestionar sesiones.
- Reducir exposición de información sensible.

Estos mecanismos deben mantenerse durante el ciclo de vida del sistema.

## Gestión de Cambios Normativos

Los cambios en la normativa aplicable deben evaluarse antes de modificar componentes que puedan estar relacionados con:

- Protección de datos.
- Facturación.
- Comprobantes electrónicos.
- Conservación de información.
- Seguridad.
- Servicios externos.
- Derechos de titulares.

Cuando un cambio normativo implique una modificación arquitectónica relevante, deberá registrarse también como decisión técnica.

## Evidencia de Cumplimiento

La evidencia técnica puede incluir:

- Configuración de seguridad.
- Registros de auditoría.
- Logs.
- Pruebas automatizadas.
- Resultados de análisis de seguridad.
- Configuración de acceso.
- Documentación de proveedores.
- Historial de cambios.
- Registros de incidentes.

La evidencia técnica demuestra la existencia de determinados controles, pero no equivale por sí sola a una certificación legal.

## Revisión Legal

Este documento debe revisarse cuando:

- Se incorporen nuevos tipos de datos.
- Se incorporen nuevos proveedores externos.
- Se modifiquen procesos de facturación.
- Se introduzcan nuevas funcionalidades de IA.
- Cambien las condiciones de tratamiento de información.
- Se produzcan cambios normativos relevantes.
- Se prepare el sistema para producción.

Las obligaciones legales deben verificarse con fuentes oficiales y, cuando sea necesario, mediante asesoría jurídica.

## Documentación Relacionada

- [`Arquitectura`](../Arquitectura/architecture.md)
- [`Contratos de API`](../API/api-contracts.md)
- [`Base de Datos`](../Base%20de%20Datos/database.md)
- [`Seguridad de Observabilidad`](../Observabilidad/Seguridad/seguridad.md)
- [`Auditoría`](../Observabilidad/Auditoria/auditoria.md)
- [`Trazabilidad`](../Observabilidad/Trazabilidad/trazabilidad.md)
- [`Despliegue`](../Despliegue/deployment.md)
- [`Inteligencia Artificial`](../IA/ai.md)
- [`Decisiones Técnicas`](../Decisiones%20Técnicas/decisions.md)
- [`Gestión de Versiones`](./release-management.md)
- [`Contribución`](./contributing.md)

## Mantenimiento del Documento

Este documento debe mantenerse actualizado cuando cambien los procesos de tratamiento de datos, los servicios externos, los mecanismos de seguridad o las obligaciones legales aplicables al sistema.

Las afirmaciones sobre requisitos legales deben verificarse con la normativa vigente antes de utilizar este documento como referencia para una decisión jurídica o de cumplimiento.
