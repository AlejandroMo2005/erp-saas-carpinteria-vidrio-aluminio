# Seguridad de Despliegue

## Propósito

Este documento define los criterios de seguridad aplicables al despliegue de la plataforma, considerando frontend, backend, MySQL, Redis, servicios externos, configuración, secretos, redes, autenticación, autorización, observabilidad, CI/CD y recuperación ante incidentes.

La seguridad de despliegue debe preservar la confidencialidad, integridad y disponibilidad de la información, así como el aislamiento entre empresas y usuarios.

## Principios de seguridad

La configuración de despliegue debe seguir los siguientes principios:

- Mínimo privilegio.
- Separación de responsabilidades.
- Separación entre entornos.
- Protección de secretos.
- Validación de entradas.
- Defensa en profundidad.
- Aislamiento de servicios.
- Protección de comunicaciones.
- Trazabilidad de eventos relevantes.
- Recuperación ante fallos y compromisos.
- Reducción de superficie de ataque.
- No exposición innecesaria de servicios internos.

## Separación de entornos

Los entornos de desarrollo, testing, staging y producción deben mantenerse separados.

Cada entorno debe disponer de:

- Configuración independiente.
- Credenciales independientes.
- Secretos independientes.
- Bases de datos independientes.
- Instancias o espacios de Redis independientes.
- Variables de entorno correspondientes al entorno.
- Políticas de acceso acordes con su propósito.

Las credenciales utilizadas durante desarrollo o testing no deben reutilizarse en producción.

La promoción hacia producción debe utilizar artefactos y configuraciones controladas por CI/CD.

## Gestión de secretos

Los secretos no deben almacenarse directamente en el código fuente.

Entre los elementos que requieren protección se encuentran:

- Contraseñas de MySQL.
- Credenciales de Redis cuando correspondan.
- Secretos relacionados con autenticación.
- Credenciales de servicios externos.
- Credenciales de servicios de IA.
- Tokens utilizados por servicios externos.
- Cualquier otra credencial necesaria para operar la plataforma.

Las variables públicas del frontend no deben utilizarse para almacenar secretos.

Las credenciales deben inyectarse durante el despliegue mediante mecanismos de configuración seguros.

La gestión de secretos en producción mediante un gestor especializado permanece como una capacidad pendiente de la infraestructura definitiva.

## Variables de entorno

Las variables de entorno deben mantenerse separadas por ambiente.

Entre las variables conocidas de la arquitectura se encuentran:

- `VITE_API_URL`.
- `DB_HOST`.
- `DB_PORT`.
- `DB_USER`.
- `DB_PASSWORD`.
- `DB_NAME`.
- `REDIS_HOST`.
- `REDIS_PORT`.
- `REDIS_PASSWORD`.

No todas las variables representan secretos. Las variables destinadas al frontend deben considerarse información potencialmente pública.

Las variables sensibles deben mantenerse fuera del repositorio y de los artefactos públicos.

## HTTPS y TLS

Las comunicaciones de producción deben utilizar HTTPS.

TLS debe proteger:

- Navegación del frontend.
- Comunicación entre cliente y API.
- Endpoints de autenticación.
- Transmisión de información sensible.
- Servicios administrativos expuestos externamente.

HSTS forma parte de las medidas de seguridad configuradas mediante la capa HTTP.

La terminación TLS, certificados, renovación automática y configuración definitiva del dominio dependen de la infraestructura de producción y permanecen pendientes de definición.

El entorno local puede utilizar HTTP durante el desarrollo, pero esta condición no debe trasladarse a producción.

## Cabeceras de seguridad

El backend utiliza Helmet como parte de la protección HTTP.

La configuración contempla mecanismos relacionados con:

- Content Security Policy.
- HTTP Strict Transport Security.
- Trusted Types.
- Protección de contenido servido por HTTP.

La política CSP debe mantenerse suficientemente restrictiva para reducir la ejecución de contenido no autorizado.

Las excepciones necesarias para compatibilidad deben documentarse y revisarse antes de utilizar configuraciones menos restrictivas.

## Content Security Policy

La CSP constituye una capa de defensa frente a determinados ataques de inyección de contenido, especialmente XSS.

La configuración debe evitar permisos innecesarios para:

- Scripts.
- Recursos externos.
- Frames.
- Objetos.
- Fuentes.
- Conexiones.
- Imágenes.
- Otros tipos de contenido.

Las modificaciones de CSP deben validarse contra el frontend y sus dependencias antes de promoverse a producción.

## Autenticación

La autenticación utiliza una combinación de tokens de acceso y refresh tokens.

El access token se mantiene en memoria del cliente.

El refresh token utiliza una cookie `httpOnly`.

La arquitectura también incorpora:

- Identificadores `jti`.
- Identificación de sesiones.
- Lista de revocación.
- Redis.
- Persistencia relacionada con sesiones y tokens.
- Expiración de tokens.

Los tokens no deben registrarse en logs.

Los mecanismos de autenticación deben mantenerse aislados de información sensible y no deben exponer credenciales en respuestas de error.

## Revocación de tokens

La arquitectura utiliza una blacklist de tokens apoyada en Redis y persistencia en MySQL.

Las claves de blacklist utilizan el identificador correspondiente al token y permiten impedir el uso posterior de tokens revocados.

Redis utiliza TTL para limitar la permanencia de información asociada a tokens según su expiración.

La revocación debe contemplarse en:

- Logout.
- Compromiso de sesión.
- Cambio de credenciales cuando corresponda.
- Invalidación administrativa.
- Recuperación ante incidentes.

## Autorización

La autenticación no sustituye a la autorización.

Cada operación debe validar que el usuario autenticado dispone de los permisos correspondientes.

Las rutas protegidas deben aplicar controles de acceso antes de ejecutar operaciones sensibles.

Las operaciones administrativas, de facturación, inventario, usuarios y configuración requieren controles de autorización acordes con los roles definidos.

## Aislamiento multiempresa

La plataforma utiliza `empresa_id` como elemento de aislamiento de información entre empresas.

Las consultas y operaciones que trabajan con datos empresariales deben aplicar el contexto de empresa correspondiente.

El aislamiento debe mantenerse en:

- Clientes.
- Materiales.
- Colores.
- Proveedores.
- Trabajos.
- Proformas.
- Pedidos.
- Facturas.
- Solicitudes.
- Configuración.
- Auditoría.
- Información relacionada con IA.
- Usuarios.

No debe permitirse que un usuario consulte o modifique registros pertenecientes a otra empresa mediante la manipulación de identificadores.

El middleware de tenant establece el contexto de empresa utilizado por las capas correspondientes.

## Validación de entradas

El backend utiliza Zod para validar estructuras de entrada.

Las entradas provenientes del cliente deben validarse antes de ejecutar operaciones de negocio o persistencia.

La validación debe cubrir:

- Tipos.
- Campos requeridos.
- Rangos.
- Formatos.
- Identificadores.
- Parámetros.
- Cuerpos de solicitudes.
- Datos relacionados con operaciones sensibles.

La validación del cliente no sustituye la validación del backend.

## Protección contra abuso

La aplicación incorpora mecanismos de rate limiting.

Los límites deben aplicarse especialmente a operaciones sensibles o susceptibles de abuso, como:

- Autenticación.
- Recuperación de contraseñas.
- Endpoints de IA.
- Operaciones costosas.
- Endpoints públicos.

Los límites deben evitar que una única fuente consuma recursos de forma desproporcionada.

Los valores definitivos de producción deben ajustarse a la capacidad real de la infraestructura y al comportamiento esperado de la aplicación.

## CSRF

El frontend utiliza Axios con `withCredentials: true` y envía `X-CSRF-Token` en las solicitudes mutables.

El backend debe validar el mecanismo CSRF correspondiente antes de aceptar operaciones protegidas.

Las solicitudes que modifican información no deben depender únicamente de cookies de autenticación sin una protección adicional contra solicitudes forjadas.

## CORS

CORS debe configurarse de forma explícita para permitir únicamente los orígenes autorizados.

No debe utilizarse una política global que permita cualquier origen cuando existan credenciales involucradas.

La configuración debe variar por entorno cuando sea necesario.

Los cambios de dominio o frontend deben reflejarse en la configuración correspondiente antes del despliegue.

## Base de datos

MySQL no debe exponerse públicamente si la arquitectura de producción no lo requiere.

El acceso debe limitarse a los servicios autorizados.

La configuración debe considerar:

- Usuario específico de aplicación.
- Contraseña protegida.
- Red privada.
- Puerto restringido.
- Permisos mínimos.
- Conexiones cifradas cuando corresponda.
- Copias de seguridad.
- Restauración.
- Control de migraciones.

La aplicación utiliza un pool de conexiones con capacidad configurada para 10 conexiones.

## Redis

Redis debe permanecer dentro de la red de servicios y no exponerse directamente a Internet.

El acceso debe protegerse mediante credenciales cuando corresponda.

Redis almacena información relacionada con la blacklist de tokens y otros mecanismos temporales de la arquitectura.

La configuración debe considerar:

- Autenticación.
- Red privada.
- Puerto restringido.
- TTL.
- Memoria disponible.
- Persistencia cuando sea necesaria.
- Recuperación.
- Monitoreo.

La estrategia definitiva de alta disponibilidad y failover de Redis queda pendiente de la infraestructura de producción.

## Red y puertos

Los servicios internos deben exponerse únicamente cuando sea necesario.

Los puertos utilizados actualmente por la aplicación incluyen:

- Frontend: `3000`.
- Backend: `5000`.
- MySQL: `3306`.
- Redis: `6379`.

En producción, los servicios internos no deben quedar directamente accesibles desde Internet.

La exposición externa debe concentrarse en los puntos de entrada necesarios, mientras que MySQL y Redis deben mantenerse dentro de una red protegida.

## Docker

La estrategia Docker debe aplicar controles de seguridad a las imágenes y contenedores.

Cuando se adopte Docker para producción, se deben considerar:

- Imágenes base confiables.
- Versiones controladas.
- Imágenes mínimas.
- Ejecución con usuario no root.
- Eliminación de herramientas innecesarias.
- Gestión segura de secretos.
- Health checks.
- Límites de recursos.
- Redes aisladas.
- Volúmenes únicamente donde sean necesarios.
- Escaneo de vulnerabilidades.
- Etiquetado y versionado de imágenes.

La infraestructura Docker definitiva permanece pendiente de adopción.

## Dependencias y cadena de suministro

Las dependencias deben mantenerse controladas mediante los archivos de bloqueo correspondientes.

CI/CD debe validar:

- Instalación reproducible.
- Dependencias declaradas.
- Lint.
- Pruebas.
- Vulnerabilidades cuando el flujo correspondiente esté habilitado.
- Integridad de acciones y herramientas utilizadas en CI/CD.

Las actualizaciones de dependencias deben evaluarse antes de incorporarse a producción.

Las dependencias abandonadas o vulnerables deben formar parte de la gestión de deuda técnica.

## CI/CD

El pipeline debe actuar como barrera de seguridad antes de promover cambios.

Las validaciones deben incluir, según la etapa:

- Instalación reproducible.
- Lint.
- Pruebas unitarias.
- Pruebas de integración.
- Pruebas E2E.
- Cobertura.
- Análisis estático.
- Análisis de seguridad.
- Construcción de artefactos.
- Validación de imágenes cuando Docker esté habilitado.

Los secretos utilizados por CI/CD deben mantenerse fuera del código fuente.

Los permisos de las acciones deben limitarse al mínimo necesario.

## SonarCloud

SonarCloud forma parte de la estrategia de análisis estático y gestión de deuda técnica.

El análisis debe utilizarse para identificar:

- Vulnerabilidades.
- Problemas de confiabilidad.
- Problemas de mantenibilidad.
- Duplicación.
- Hotspots de seguridad.

Los resultados deben interpretarse considerando la arquitectura actual y la migración desde componentes legacy.

No deben realizarse cambios de arquitectura únicamente para reducir métricas sin verificar el comportamiento de la aplicación.

## DAST

Las pruebas DAST forman parte del flujo de seguridad planificado.

ZAP se contempla para evaluar la aplicación desplegada desde una perspectiva externa.

Las pruebas deben considerar:

- Autenticación.
- Autorización.
- Cabeceras.
- Configuración HTTP.
- Endpoints.
- Exposición de información.
- Validación de entradas.
- Sesiones.
- Configuración de seguridad.

La ejecución DAST debe realizarse contra un entorno controlado y no contra producción sin autorización explícita.

## Logs y seguridad

Los logs deben permitir investigar eventos de seguridad sin almacenar información sensible innecesaria.

Winston forma parte de la infraestructura de logging del backend.

Deben registrarse de forma controlada eventos como:

- Fallos de autenticación.
- Inicio de sesión.
- Cierre de sesión.
- Cambios de credenciales.
- Accesos denegados.
- Errores relevantes.
- Operaciones administrativas.
- Eventos relacionados con seguridad.

No deben registrarse:

- Contraseñas.
- Tokens completos.
- Secretos.
- Cookies sensibles.
- Credenciales de servicios externos.
- Información sensible innecesaria.

## Log Injection

Los datos provenientes del usuario no deben incorporarse a logs de forma que permitan alterar su estructura o dificultar el análisis.

Los valores externos deben tratarse como datos no confiables.

Los logs de seguridad deben conservar suficiente contexto para investigar incidentes sin incluir información sensible.

## Auditoría

La tabla `auditoria_acciones` permite registrar determinadas acciones relacionadas con usuarios y operaciones administrativas.

Entre las acciones contempladas se encuentran:

- DELETE.
- ANULACION.
- LOGIN.
- LOGOUT.
- LOGIN_FALLIDO.
- REFRESH_TOKEN.
- CAMBIO_PASSWORD.

La auditoría debe mantener el contexto de empresa y usuario correspondiente cuando esté disponible.

Los registros de auditoría deben protegerse contra modificaciones no autorizadas.

## Errores y exposición de información

Las respuestas de error no deben revelar:

- Contraseñas.
- Tokens.
- Variables de entorno.
- Credenciales.
- Consultas SQL internas.
- Rutas internas innecesarias.
- Stack traces en producción.
- Configuración sensible.

Los detalles técnicos deben permanecer en los logs cuando sean necesarios para diagnóstico.

El cliente debe recibir respuestas controladas y apropiadas para cada tipo de error.

## Servicios externos e IA

Las credenciales de servicios externos de IA deben mantenerse como secretos del backend.

El frontend no debe recibir directamente claves privadas de proveedores externos.

Las solicitudes hacia servicios externos deben aplicar:

- Validación de entradas.
- Límites de tamaño.
- Timeouts.
- Manejo de errores.
- Rate limiting cuando corresponda.
- Protección de credenciales.
- Registro controlado de resultados y errores.

Los fallos de proveedores externos no deben comprometer la disponibilidad completa de la plataforma.

## Imágenes y archivos

Los archivos e imágenes procesados por funcionalidades de IA deben considerarse contenido no confiable.

Las entradas deben validarse antes de ser procesadas.

Debe controlarse:

- Tamaño.
- Tipo.
- Formato.
- Origen.
- Almacenamiento.
- Tiempo de permanencia.
- Errores de procesamiento.

No deben aceptarse archivos arbitrarios cuando el endpoint requiera formatos específicos.

## Health checks

Los health checks deben permitir comprobar el estado de la aplicación y sus dependencias sin exponer información sensible.

El endpoint `/health` forma parte de la arquitectura actual y verifica componentes relevantes de la aplicación.

Los health checks utilizados por infraestructura o CI/CD deben diferenciar, cuando corresponda, entre:

- Aplicación disponible.
- Dependencias disponibles.
- Servicio listo para recibir tráfico.

No deben incluir secretos ni credenciales en sus respuestas.

## PM2 y procesos

PM2 forma parte de la ejecución del backend.

La configuración debe controlar:

- Reinicios.
- Consumo de memoria.
- Número de procesos.
- Logs.
- Disponibilidad.

El límite configurado de `max_memory_restart` es de 400 MB.

Los reinicios inesperados deben ser observables y formar parte del diagnóstico operativo.

## Backups

Las copias de seguridad deben protegerse con controles de acceso apropiados.

Deben considerarse:

- Base de datos.
- Configuración necesaria para recuperación.
- Metadatos necesarios.
- Integridad de las copias.
- Retención.
- Restauración.
- Protección de los respaldos.

Los backups no deben almacenarse con las mismas credenciales o permisos utilizados por la aplicación.

Las pruebas periódicas de restauración deben formar parte del procedimiento operativo.

## Migraciones

Las migraciones de base de datos deben ejecutarse de forma controlada.

Antes de aplicar cambios en producción deben validarse:

- Compatibilidad.
- Integridad.
- Impacto en datos.
- Tiempo de ejecución.
- Posibilidad de rollback.
- Dependencias entre versiones.

Las migraciones destructivas requieren especial precaución y respaldo previo.

## Hardening de producción

Antes de exponer producción se debe comprobar:

- HTTPS habilitado.
- Certificados válidos.
- HSTS configurado.
- CORS restringido.
- CSRF habilitado.
- Secretos fuera del repositorio.
- MySQL no expuesto públicamente.
- Redis no expuesto públicamente.
- Puertos innecesarios cerrados.
- Logs sin secretos.
- Errores sin información interna.
- Rate limiting activo.
- Autenticación operativa.
- Autorización validada.
- Aislamiento multiempresa validado.
- Health checks disponibles.
- Backups configurados.
- Monitoreo habilitado.
- Acceso administrativo restringido.

## Respuesta ante incidentes

Ante una posible exposición o compromiso deben considerarse acciones como:

1. Identificar el alcance.
2. Contener el componente afectado.
3. Revocar credenciales comprometidas.
4. Invalidar sesiones cuando corresponda.
5. Rotar secretos.
6. Revisar logs y auditoría.
7. Determinar los datos afectados.
8. Restaurar servicios desde una versión confiable cuando sea necesario.
9. Aplicar correcciones.
10. Validar la recuperación.
11. Documentar el incidente.

Las acciones específicas dependerán del tipo y alcance del incidente.

## Rollback

El rollback debe utilizar una versión previamente validada.

Antes de revertir debe evaluarse el impacto sobre:

- Código.
- Base de datos.
- Migraciones.
- Redis.
- Sesiones.
- Integraciones externas.

Una reversión del código no necesariamente revierte cambios de esquema de base de datos.

Los procedimientos de rollback deben probarse antes de depender de ellos durante un incidente.

## Estado actual

Actualmente la plataforma cuenta con varias medidas de seguridad a nivel de aplicación, incluyendo:

- Helmet.
- CSP.
- HSTS.
- Trusted Types.
- Zod.
- Rate limiting.
- CSRF.
- CORS.
- Access tokens en memoria.
- Refresh tokens mediante cookie `httpOnly`.
- Blacklist de tokens con Redis y MySQL.
- Auditoría de acciones.
- Winston.
- PM2.
- Aislamiento mediante `empresa_id`.

La infraestructura definitiva de producción todavía requiere completar elementos como:

- HTTPS y certificados de producción.
- Gestión especializada de secretos.
- Dockerfiles y Compose.
- Hardening definitivo de infraestructura.
- DAST automatizado.
- Estrategia definitiva de backups.
- Alta disponibilidad.
- Monitoreo de infraestructura.
- Políticas definitivas de red.
- Procedimientos operativos de recuperación.

## Criterios de aceptación

Un despliegue debe considerarse preparado desde el punto de vista de seguridad cuando:

- Los secretos están protegidos.
- Los entornos están separados.
- Las comunicaciones externas utilizan HTTPS.
- Los servicios internos no están expuestos innecesariamente.
- La autenticación y autorización funcionan correctamente.
- El aislamiento multiempresa está validado.
- CSRF y CORS están correctamente configurados.
- Las entradas están validadas.
- Los límites de abuso están activos.
- Los logs no contienen secretos.
- Los errores no exponen información interna.
- MySQL y Redis están protegidos.
- Los backups y procedimientos de recuperación están disponibles.
- CI/CD ejecuta las validaciones definidas.
- Las pruebas de seguridad correspondientes han sido ejecutadas.
- Existe un procedimiento documentado para rollback e incidentes.
