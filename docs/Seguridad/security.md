# Seguridad

## Propósito

Este documento establece la estructura general de seguridad de la plataforma ERP/SaaS para negocios de carpintería de vidrio y aluminio.

La seguridad se aborda como una propiedad transversal de la arquitectura y comprende autenticación, autorización, aislamiento multi-tenant, validación de entradas, protección de sesiones, seguridad HTTP, gestión de secretos, auditoría, protección de infraestructura, dependencias y monitoreo.

Los controles descritos deben verificarse mediante pruebas, revisión de código, análisis estático, DAST y validaciones del entorno correspondiente.

## Principios

La arquitectura de seguridad se basa en los siguientes principios:

- mínimo privilegio;
- defensa en profundidad;
- validación en el servidor;
- separación de responsabilidades;
- aislamiento por empresa;
- protección de secretos;
- reducción de superficie de ataque;
- trazabilidad de operaciones sensibles;
- gestión explícita de sesiones;
- control de errores;
- seguridad desde el ciclo de desarrollo.

El frontend no se considera una frontera de confianza. Las decisiones de autenticación, autorización y aislamiento de datos deben mantenerse en el backend.

## Modelo de confianza

La aplicación puede dividirse conceptualmente en las siguientes zonas:

```text
Usuario
   |
   v
Frontend React
   |
   v
API / Backend Express
   |
   +------------------+
   |                  |
   v                  v
MySQL               Redis
   |
   v
Servicios externos
(IA / SRI u otros)
```

Cada límite representa una frontera que requiere validación.

El frontend recibe entradas del usuario y, por tanto, no debe considerarse confiable.

El backend constituye la principal capa de aplicación para autenticación, autorización, validación y aislamiento de datos.

MySQL contiene información persistente y debe protegerse mediante credenciales, permisos y controles de integridad.

Redis contiene información temporal utilizada por mecanismos de sesión, blacklist y otros componentes que requieren almacenamiento rápido.

Los servicios externos representan dependencias fuera del control directo de la aplicación y deben tratarse como sistemas no confiables desde el punto de vista de disponibilidad, respuesta y contenido recibido.

## Autenticación

La autenticación identifica al usuario que solicita acceso al sistema.

La arquitectura utiliza tokens para gestionar las sesiones. El access token se mantiene en memoria del cliente y el refresh token utiliza una cookie `httpOnly`.

El mecanismo debe garantizar:

- identificación del usuario;
- expiración de tokens;
- renovación controlada;
- revocación;
- protección frente al uso de tokens inválidos;
- asociación de la sesión con el usuario correspondiente.

Los tokens utilizados para revocación disponen de un identificador único y pueden registrarse en la blacklist correspondiente.

## Gestión de sesiones

Las sesiones persistentes se representan mediante registros asociados al usuario.

La tabla `usuarios_sesiones` permite mantener información relacionada con:

- usuario;
- hash del token;
- dirección IP;
- user-agent;
- expiración;
- fecha de creación;
- último uso.

El sistema no debe depender exclusivamente del almacenamiento del token en texto plano.

Los mecanismos de sesión deben contemplar:

1. creación;
2. uso;
3. renovación;
4. expiración;
5. logout;
6. revocación;
7. limpieza de sesiones inválidas.

## Revocación de tokens

La aplicación utiliza una blacklist para impedir el uso posterior de determinados identificadores de token.

La tabla `token_blacklist` almacena:

- `jti`;
- `expires_at`;
- `created_at`.

La expiración permite que los registros de blacklist puedan gestionarse de acuerdo con la vida útil del token correspondiente.

La revocación debe comprobarse antes de aceptar operaciones que dependan de la validez del token.

## Autorización

La autenticación no implica autorización.

Después de identificar al usuario, el backend debe comprobar que su rol permite realizar la operación solicitada.

Los roles definidos en el modelo de usuarios incluyen:

- `ADMIN`;
- `VENDEDOR`;
- `ALMACEN`;
- `CLIENTE`.

Los permisos deben comprobarse en el servidor incluso cuando el frontend oculte determinadas opciones de interfaz.

Las operaciones sensibles deben considerar tanto el rol como el contexto de empresa.

## Multi-tenancy

El aislamiento entre empresas constituye un control de seguridad fundamental.

Las entidades que pertenecen a una empresa utilizan `empresa_id` como parte de su contexto de aislamiento.

El backend debe establecer el contexto de empresa de forma confiable y utilizarlo en las operaciones correspondientes.

Una solicitud no debe poder modificar arbitrariamente el `empresa_id` utilizado para autorizar o consultar información.

El aislamiento debe mantenerse en:

- consultas;
- inserciones;
- actualizaciones;
- eliminaciones;
- repositorios;
- servicios;
- endpoints;
- operaciones administrativas;
- auditoría.

### Riesgo de acceso horizontal

Un identificador válido de un registro no debe ser suficiente para acceder a ese registro si pertenece a otra empresa.

Por ejemplo:

```text
GET /api/proformas/15
```

no debe permitir acceder al registro 15 únicamente porque el usuario conozca su identificador.

El backend debe comprobar que el registro pertenece al `empresa_id` autorizado.

Este principio también aplica a clientes, materiales, proveedores, trabajos, pedidos, facturas y demás recursos multi-tenant.

## Validación de entradas

Toda entrada proveniente del cliente debe considerarse no confiable.

La aplicación utiliza esquemas de validación, incluyendo Zod, para comprobar:

- tipos;
- formatos;
- campos obligatorios;
- longitudes;
- rangos;
- valores permitidos;
- estructuras anidadas.

La validación debe realizarse antes de utilizar los datos en operaciones de negocio, persistencia o integraciones externas.

Las restricciones de aplicación no sustituyen las restricciones de base de datos. Ambas capas deben complementarse.

## Protección contra inyección

Las consultas a MySQL deben utilizar mecanismos parametrizados.

No se deben construir consultas SQL concatenando directamente valores provenientes del usuario.

También deben revisarse otros vectores:

- inyección de comandos;
- manipulación de rutas;
- nombres de archivos;
- contenido HTML;
- datos utilizados en logs;
- parámetros enviados a proveedores externos.

## Seguridad HTTP

El backend utiliza mecanismos de protección HTTP mediante Helmet.

La configuración contempla políticas relacionadas con:

- Content Security Policy;
- HSTS;
- Trusted Types;
- otras cabeceras de seguridad proporcionadas por la configuración correspondiente.

Las políticas deben mantenerse coordinadas con las necesidades reales del frontend.

Una política de seguridad no debe relajarse de forma global para resolver un único problema de compatibilidad sin evaluar el impacto.

## CORS

CORS debe limitarse a los orígenes autorizados.

Cuando existen credenciales, no debe utilizarse una política abierta incompatible con el modelo de seguridad.

La configuración debe diferenciar adecuadamente entre entornos de desarrollo y producción.

## CSRF

Cuando la autenticación utiliza cookies, las operaciones que modifican información deben considerar protección contra Cross-Site Request Forgery.

El frontend utiliza un token CSRF para las solicitudes mutables.

El backend debe validar dicho mecanismo antes de procesar las operaciones protegidas.

Las solicitudes de lectura no deben recibir innecesariamente el mismo tratamiento que las mutaciones.

## Cookies

Las cookies que contienen información sensible deben configurarse de acuerdo con el nivel de protección requerido.

Para el refresh token se debe mantener el uso de:

- `httpOnly`;
- `Secure` cuando se utiliza HTTPS;
- `SameSite` de acuerdo con el flujo de autenticación;
- dominio y ruta restringidos cuando corresponda.

No deben almacenarse secretos innecesarios en cookies accesibles mediante JavaScript.

## Gestión de contraseñas

Las contraseñas deben almacenarse utilizando mecanismos de hashing apropiados.

El sistema no debe almacenar contraseñas en texto plano.

Las respuestas de autenticación no deben revelar si una cuenta existe mediante mensajes excesivamente específicos cuando esto incremente el riesgo de enumeración.

Los procesos de cambio y recuperación de contraseña deben invalidar o revisar las sesiones afectadas cuando la política de seguridad lo requiera.

## Recuperación de contraseña

Los mecanismos de recuperación utilizan información temporal asociada al usuario.

Los códigos y tokens de recuperación deben:

- tener expiración;
- utilizarse una sola vez cuando corresponda;
- invalidarse después de su consumo;
- no aparecer en logs;
- no exponerse innecesariamente en respuestas;
- mantenerse asociados al usuario correcto.

## Protección de archivos

Las cargas de archivos, especialmente imágenes utilizadas por funciones de IA, deben validarse.

Los controles deben considerar:

- tamaño máximo;
- tipo MIME;
- extensión;
- contenido;
- dimensiones cuando corresponda;
- nombre del archivo;
- ubicación de almacenamiento;
- eliminación de temporales.

No debe confiarse exclusivamente en la extensión proporcionada por el cliente.

## Seguridad de IA

Las funciones de IA representan un límite adicional de confianza porque procesan imágenes, prompts y respuestas de proveedores externos.

Las solicitudes deben estar:

- autenticadas;
- autorizadas;
- validadas;
- limitadas cuando corresponda;
- asociadas al usuario y empresa adecuados.

Los prompts deben evitar secretos y datos innecesarios.

Las respuestas externas no deben considerarse automáticamente confiables.

Los errores de proveedores deben gestionarse sin exponer credenciales, información interna o detalles innecesarios de infraestructura.

La disponibilidad de servicios externos puede variar. Un error como HTTP 402 de un proveedor puede representar un problema de cuota, créditos o configuración externa y no necesariamente un fallo del modelo de autorización de la aplicación.

## Integraciones externas

Las integraciones con servicios externos deben considerar:

- autenticación del proveedor;
- gestión de claves;
- timeout;
- reintentos;
- límites;
- validación de respuestas;
- manejo de errores;
- observabilidad;
- protección de datos.

Las credenciales de integración no deben formar parte del código fuente.

## Seguridad de base de datos

La base de datos debe mantenerse fuera de exposición pública innecesaria.

Las credenciales deben proceder de configuración segura del entorno.

La aplicación debe utilizar un usuario con privilegios suficientes para las operaciones necesarias, evitando permisos innecesarios.

Las restricciones de integridad existentes deben mantenerse activas.

Las operaciones que modifican varias entidades relacionadas deben considerar transacciones cuando la consistencia lo requiera.

## Redis

Redis debe considerarse infraestructura interna.

No debe exponerse públicamente sin una necesidad explícita y controles adecuados.

Los valores temporales deben disponer de expiración cuando corresponda.

La información utilizada para blacklist y sesiones debe protegerse contra accesos no autorizados.

## Auditoría

Las operaciones relevantes pueden registrarse mediante `auditoria_acciones`.

Entre las acciones contempladas se encuentran:

- `DELETE`;
- `ANULACION`;
- `LOGIN`;
- `LOGOUT`;
- `LOGIN_FALLIDO`;
- `REFRESH_TOKEN`;
- `CAMBIO_PASSWORD`.

La auditoría debe conservar suficiente contexto para investigar una operación sin almacenar secretos innecesarios.

La auditoría y el logging operativo tienen objetivos diferentes y no deben confundirse.

## Logging seguro

Los logs deben facilitar diagnóstico y observabilidad sin convertirse en una fuente de exposición de información sensible.

No deben registrarse:

- contraseñas;
- refresh tokens;
- access tokens;
- claves API;
- secretos;
- códigos de recuperación;
- información sensible innecesaria.

Los datos proporcionados por el usuario deben revisarse antes de incorporarse a mensajes de log para reducir riesgos de log injection.

## Rate limiting

Los endpoints sensibles deben contar con límites adecuados al riesgo y al coste de la operación.

Se deben considerar especialmente:

- autenticación;
- recuperación de contraseña;
- generación de tokens;
- IA;
- cargas de archivos;
- operaciones costosas.

Los límites deben configurarse de forma que reduzcan abuso sin impedir el uso normal del sistema.

## Dependencias

Las dependencias externas forman parte de la superficie de ataque.

La revisión debe considerar:

- vulnerabilidades conocidas;
- versiones;
- dependencias transitivas;
- paquetes abandonados;
- cambios mayores;
- necesidad real del paquete.

El lockfile debe mantenerse sincronizado con `package.json`.

La instalación reproducible mediante `npm ci` debe utilizarse en CI cuando corresponda.

## Seguridad del frontend

El frontend no debe contener secretos de infraestructura.

Las variables expuestas mediante Vite deben considerarse públicas para el cliente.

El frontend debe:

- manejar errores de API de forma controlada;
- evitar exponer información sensible;
- respetar las políticas CSP;
- validar entradas antes de enviarlas;
- controlar cargas de archivos;
- mantener rutas protegidas;
- evitar asumir que ocultar una interfaz equivale a autorización.

## Seguridad del backend

El backend constituye la principal frontera de confianza de la aplicación.

Las rutas deben aplicar, según corresponda:

```text
Solicitud
   |
   v
Autenticación
   |
   v
Autorización
   |
   v
Contexto de empresa
   |
   v
Validación
   |
   v
Lógica de negocio
   |
   v
Persistencia / integración
```

El orden exacto puede variar según el endpoint, pero ninguna capa debe asumir que una capa anterior hace innecesario su propio control cuando la responsabilidad le corresponde.

## Seguridad en CI/CD

El pipeline debe evitar la exposición de secretos.

Los secretos deben proporcionarse mediante mecanismos de configuración segura de la plataforma de CI/CD.

Los logs del pipeline deben revisarse para impedir que variables sensibles aparezcan accidentalmente.

Los controles de calidad y seguridad deben ejecutarse automáticamente cuando formen parte del pipeline definido.

La automatización debe detectar problemas, pero no debe realizar cambios destructivos de arquitectura sin revisión.

## Análisis estático

SonarCloud forma parte del proceso de evaluación de calidad y seguridad.

Los resultados deben interpretarse considerando la arquitectura actual.

En particular, las duplicaciones producidas por coexistencia de arquitectura legacy y arquitectura modular deben analizarse antes de aplicar correcciones individuales.

El inventario de deuda técnica debe utilizarse para priorizar migraciones y eliminación de código obsoleto.

## DAST

Las pruebas dinámicas deben ejecutarse sobre un entorno de prueba controlado.

ZAP y herramientas similares pueden identificar problemas relacionados con:

- cabeceras;
- autenticación;
- exposición de endpoints;
- configuración HTTP;
- validación;
- comportamiento de la aplicación.

Los hallazgos deben clasificarse y verificarse antes de considerarse vulnerabilidades confirmadas.

## Seguridad del despliegue

El entorno de despliegue debe proteger:

- aplicación;
- base de datos;
- Redis;
- variables de entorno;
- archivos;
- logs;
- mecanismos de administración.

La configuración de desarrollo no debe trasladarse automáticamente a producción.

La aplicación debe utilizar HTTPS en entornos donde se transmitan credenciales o información sensible.

## Gestión de errores

Los errores internos deben registrarse para diagnóstico sin exponer detalles innecesarios al usuario.

Una respuesta pública no debe incluir:

- stack traces;
- rutas internas;
- credenciales;
- consultas SQL;
- variables de entorno;
- información de infraestructura;
- datos de otros usuarios.

El sistema debe diferenciar entre información útil para el cliente e información destinada exclusivamente a observabilidad.

## Seguridad de facturación

Las operaciones relacionadas con facturación requieren controles adicionales debido a su impacto sobre información comercial y documentos tributarios.

Deben controlarse:

- permisos;
- estados;
- numeración;
- empresa;
- usuario;
- datos del cliente;
- integración externa;
- trazabilidad;
- concurrencia.

Los cambios de estado no deben depender exclusivamente de valores enviados por el cliente.

## Seguridad de inventario

Las operaciones de inventario deben validar:

- material;
- empresa;
- cantidades;
- precios;
- disponibilidad;
- permisos.

Las actualizaciones concurrentes deben considerar la consistencia del stock.

Los identificadores enviados por el cliente deben validarse contra el contexto de empresa antes de modificar existencias.

## Seguridad de proformas y pedidos

Las proformas y pedidos contienen información comercial y deben mantenerse aislados por empresa.

Las operaciones deben comprobar:

- autenticación;
- autorización;
- empresa;
- cliente;
- materiales;
- cantidades;
- precios;
- estado de la operación.

La generación de documentos no debe permitir alterar información de otra empresa mediante identificadores manipulados.

## Vulnerabilidades y deuda técnica

Los hallazgos de seguridad deben registrarse y relacionarse con:

- componente;
- riesgo;
- causa;
- evidencia;
- acción;
- estado;
- prueba de verificación.

No todos los resultados de herramientas automáticas representan vulnerabilidades explotables. Cada hallazgo debe validarse en contexto.

La corrección debe priorizar riesgos reales y evitar cambios aislados que aumenten la complejidad arquitectónica.

## Verificación

La seguridad debe verificarse mediante diferentes niveles:

```text
Lint
  |
  v
Pruebas unitarias
  |
  v
Pruebas de integración
  |
  v
Pruebas E2E
  |
  v
Análisis estático
  |
  v
DAST
  |
  v
Revisión de despliegue
```

Ningún mecanismo individual proporciona cobertura completa.

## Evidencia

Las evidencias de seguridad pueden incluir:

- resultados de pruebas;
- cobertura;
- reportes de ESLint;
- análisis de SonarCloud;
- resultados DAST;
- logs de CI/CD;
- pruebas de autenticación;
- pruebas de autorización;
- pruebas de multi-tenancy;
- verificaciones de configuración;
- registros de auditoría;
- documentación de incidentes.

## Revisión periódica

La revisión de seguridad debe repetirse cuando:

- cambie la autenticación;
- cambien los roles;
- se agregue un nuevo módulo;
- se modifique el aislamiento multi-tenant;
- se incorpore una integración externa;
- se modifique la base de datos;
- se introduzca una dependencia relevante;
- se modifique el despliegue;
- se detecte un incidente;
- aparezcan nuevos hallazgos de seguridad.

## Relación con otros documentos

Este documento debe consultarse junto con:

- `docs/Calidad/Checklist de Seguridad.md`;
- `docs/Calidad/Estrategia de Pruebas.md`;
- `docs/Calidad/Matriz de Riesgos Técnicos.md`;
- `docs/Arquitectura/architecture.md`;
- `docs/Base de Datos/database.md`;
- `docs/CI-CD/ci-cd.md`;
- `docs/Observabilidad/observability.md`;
- `docs/Despliegue/deployment.md`;
- `docs/Decisiones Técnicas/technical-debt.md`.

## Criterio de mantenimiento

La documentación de seguridad debe mantenerse alineada con la arquitectura real.

No debe documentarse un control como existente únicamente porque esté previsto. Los controles deben distinguir entre:

- diseñado;
- configurado;
- probado;
- verificado;
- pendiente.

Esta distinción permite mantener la documentación como evidencia técnica y no únicamente como especificación.
