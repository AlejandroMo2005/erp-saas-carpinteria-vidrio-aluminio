# Cumplimiento y consideraciones legales

## Propósito

Este documento establece las consideraciones de cumplimiento que deben contemplarse durante el diseño, desarrollo, despliegue y operación de la plataforma.

## Alcance

El cumplimiento debe considerar:

- Protección de datos personales.
- Seguridad de la información.
- Gestión de usuarios.
- Auditoría.
- Facturación.
- Conservación de información.
- Control de acceso.
- Gestión de secretos.
- Dependencias externas.
- Infraestructura.
- Registros técnicos.

## Protección de datos

La plataforma procesa información relacionada con:

- Clientes.
- Usuarios.
- Proveedores.
- Contactos.
- Información de empresas.
- Registros de operaciones.
- Información de autenticación.
- Registros de auditoría.

El tratamiento de estos datos debe limitarse a las finalidades necesarias para las funciones de la plataforma.

## Minimización de datos

La aplicación debe evitar recopilar información que no sea necesaria para las funcionalidades disponibles.

Los datos almacenados deben corresponder con las necesidades funcionales y operativas del sistema.

## Control de acceso

El acceso debe estar restringido de acuerdo con:

- Identidad del usuario.
- Rol.
- Empresa.
- Permisos correspondientes.

Los roles definidos actualmente incluyen:

- `ADMIN`
- `VENDEDOR`
- `ALMACEN`
- `CLIENTE`

## Aislamiento por empresa

La información empresarial debe mantenerse aislada mediante `empresa_id`.

Las operaciones sobre:

- Clientes.
- Materiales.
- Proformas.
- Pedidos.
- Facturas.
- Proveedores.
- Trabajos.
- Configuración.

deben respetar el contexto de la empresa correspondiente.

## Autenticación

La autenticación utiliza mecanismos basados en tokens y sesiones.

La arquitectura contempla:

- Access token en memoria.
- Refresh token mediante cookie `httpOnly`.
- Identificadores `jti`.
- Blacklist de tokens.
- Redis.
- Persistencia de sesiones.

La implementación debe proteger las credenciales y evitar su exposición mediante logs, respuestas HTTP o archivos públicos.

## Seguridad de comunicaciones

La comunicación de producción debe utilizar HTTPS.

La configuración de seguridad contempla:

- TLS.
- HSTS.
- CORS.
- CSRF.
- CSP.
- Helmet.
- Cookies seguras.

Los servicios internos como MySQL y Redis no deben exponerse públicamente sin una necesidad justificada.

## Protección contra exposición de información

Los mensajes de error no deben exponer:

- Contraseñas.
- Tokens.
- Claves API.
- Credenciales.
- Configuración interna.
- Información sensible de usuarios.

Los logs deben evitar registrar secretos y datos personales innecesarios.

## Auditoría

La plataforma dispone de la entidad `auditoria_acciones` para registrar determinadas acciones.

Entre las acciones contempladas se encuentran:

- `DELETE`
- `ANULACION`
- `LOGIN`
- `LOGOUT`
- `LOGIN_FALLIDO`
- `REFRESH_TOKEN`
- `CAMBIO_PASSWORD`

Los registros de auditoría deben conservar información suficiente para identificar la operación y su contexto.

## Facturación

La plataforma contempla funcionalidades relacionadas con comprobantes y estados de facturación.

Los documentos asociados a facturación deben mantener:

- Numeración.
- Estado.
- Totales.
- Detalles.
- Relación con la empresa.
- Registros necesarios para auditoría.

La integración definitiva con servicios externos de facturación debe cumplir los requisitos correspondientes al entorno donde se utilice.

## SRI

La base de datos contempla información relacionada con autorización de comprobantes y estados SRI.

La operación productiva de facturación electrónica debe considerar los requisitos técnicos y normativos vigentes aplicables al servicio.

La documentación de cumplimiento no debe asumir que una funcionalidad técnica equivale por sí sola al cumplimiento legal.

## Conservación de información

La conservación debe definirse según:

- Necesidad operativa.
- Requisitos legales aplicables.
- Políticas internas.
- Seguridad.
- Capacidad de almacenamiento.

No debe conservarse información indefinidamente sin una justificación.

## Eliminación

La eliminación de información debe considerar:

- Dependencias entre entidades.
- Requisitos de auditoría.
- Integridad referencial.
- Obligaciones de conservación.
- Necesidades operativas.

Las entidades que utilizan `deleted_at` deben diferenciar eliminación lógica de eliminación física.

## Contraseñas

Las contraseñas no deben almacenarse en texto plano.

Los procesos relacionados con recuperación y cambio de contraseña deben utilizar mecanismos seguros y limitar la exposición de códigos y tokens temporales.

## Sesiones

Las sesiones deben controlarse mediante:

- Expiración.
- Revocación.
- Identificación.
- Registro de actividad cuando corresponda.
- Protección de cookies.
- Blacklist de tokens.

Los mecanismos de sesión deben permitir responder ante pérdida o compromiso de credenciales.

## Proveedores externos

Los servicios externos, incluidos proveedores de IA, deben evaluarse considerando:

- Datos enviados.
- Credenciales utilizadas.
- Finalidad.
- Seguridad.
- Disponibilidad.
- Condiciones de uso.
- Requisitos aplicables.

No deben enviarse datos personales a servicios externos sin una justificación y configuración adecuadas.

## IA

Las solicitudes relacionadas con IA pueden contener imágenes, prompts y metadatos asociados.

La plataforma debe controlar:

- Tipo de información enviada.
- Tamaño de archivos.
- Credenciales del proveedor.
- Logs.
- Resultados almacenados.
- Tiempo de conservación.

La utilización de servicios externos debe revisarse de acuerdo con los requisitos de privacidad aplicables.

## Dependencias de software

Las dependencias deben mantenerse identificables mediante los archivos de gestión del proyecto.

La gestión debe considerar:

- Vulnerabilidades conocidas.
- Licencias.
- Versiones.
- Actualizaciones.
- Procedencia.
- Integridad de paquetes.

Las dependencias críticas deben revisarse antes de incorporarse a producción.

## Código fuente

El código fuente debe mantenerse bajo control de versiones.

No deben almacenarse en el repositorio:

- Contraseñas.
- Tokens.
- Claves privadas.
- Credenciales de producción.
- Secretos de proveedores.

Los archivos de configuración sensibles deben mantenerse fuera del control de versiones cuando contengan secretos.

## Variables de entorno

Las variables de entorno permiten separar configuración y secretos del código.

Entre las variables conocidas se encuentran:

- `VITE_API_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`

Las variables expuestas al frontend mediante el prefijo `VITE_` no deben contener secretos.

## Backups

Los backups deben protegerse contra:

- Acceso no autorizado.
- Modificación.
- Eliminación accidental.
- Exposición de información.
- Pérdida simultánea del entorno principal.

La estrategia definitiva de backups para producción permanece pendiente de consolidación.

## Logs

Los logs deben gestionarse considerando:

- Seguridad.
- Privacidad.
- Retención.
- Acceso.
- Rotación.
- Integridad.

Los logs no deben utilizarse como almacenamiento permanente de información personal innecesaria.

## Incidentes

Ante una exposición de información o credenciales se debe:

1. Identificar el alcance.
2. Contener el incidente.
3. Revocar credenciales comprometidas.
4. Rotar secretos cuando corresponda.
5. Revisar logs.
6. Aplicar correcciones.
7. Documentar el incidente.
8. Evaluar las obligaciones de notificación aplicables.

## Cumplimiento en despliegue

Los entornos deben mantenerse separados.

La configuración de desarrollo, testing, staging y producción debe evitar compartir credenciales y secretos innecesariamente.

La infraestructura productiva debe aplicar controles de acceso restringido.

## Responsabilidades

La definición de responsabilidades debe establecer quién puede:

- Administrar usuarios.
- Acceder a datos.
- Modificar configuración.
- Gestionar infraestructura.
- Acceder a backups.
- Gestionar secretos.
- Ejecutar despliegues.
- Ejecutar procedimientos de recuperación.

## Estado actual

Actualmente la plataforma dispone de:

- Autenticación.
- Autorización por roles.
- Aislamiento mediante `empresa_id`.
- Auditoría de acciones.
- Protección mediante Helmet.
- CSP.
- HSTS.
- CSRF.
- CORS.
- Gestión de sesiones.
- Blacklist de tokens.
- Variables de entorno.
- Logs mediante Winston.
- Control de versiones mediante Git.

Permanecen pendientes de consolidación:

- Revisión legal específica para producción.
- Política formal de privacidad.
- Política de retención de datos.
- Procedimiento formal de respuesta ante incidentes.
- Estrategia definitiva de backups.
- Infraestructura productiva.
- Revisión formal de licencias de dependencias.
- Validación de requisitos regulatorios aplicables a facturación electrónica.

## Criterios de aceptación

La documentación de cumplimiento se considera preparada cuando:

- Los datos tratados están identificados.
- Los controles de acceso están documentados.
- Los mecanismos de seguridad están definidos.
- Los secretos están protegidos.
- Las acciones auditables están identificadas.
- Los backups contemplan protección de datos.
- Los servicios externos están identificados.
- Las responsabilidades están establecidas.
- Las políticas necesarias para producción están definidas.
- Los requisitos legales aplicables han sido revisados antes del despliegue productivo.
