# Checklist de Seguridad

## Descripción

Este documento define una lista de verificación para revisar los controles de seguridad de la plataforma ERP/SaaS para negocios de carpintería de vidrio y aluminio.

El checklist está orientado a revisiones de desarrollo, integración, pruebas, despliegue y mantenimiento.

No sustituye una auditoría de seguridad, una prueba de penetración ni un análisis especializado. Su propósito es proporcionar controles técnicos verificables dentro del ciclo de desarrollo.

## Objetivo

Verificar de forma sistemática:

- autenticación;
- autorización;
- aislamiento multi-tenant;
- gestión de sesiones;
- protección CSRF;
- validación de entradas;
- protección HTTP;
- gestión de secretos;
- logging;
- auditoría;
- dependencias;
- integraciones externas;
- base de datos;
- CI/CD;
- despliegue;
- recuperación.

## Criterios de revisión

Cada elemento debe marcarse como:

- `[ ]` Pendiente
- `[x]` Verificado
- `[N/A]` No aplica

Cuando un control no pueda verificarse, debe registrarse la razón y, cuando corresponda, una acción pendiente.

## Autenticación

- [ ] Las credenciales se validan en el backend.
- [ ] Las contraseñas no se almacenan en texto plano.
- [ ] Los errores de autenticación no exponen información innecesaria.
- [ ] Las cuentas inactivas no pueden autenticarse cuando la política del sistema lo impide.
- [ ] Los tokens tienen una expiración definida.
- [ ] El access token no se almacena innecesariamente en almacenamiento persistente del navegador.
- [ ] El refresh token utiliza el mecanismo de cookie definido por la arquitectura.
- [ ] La renovación de sesión requiere una sesión válida.
- [ ] El logout invalida la sesión según el mecanismo definido.
- [ ] Los tokens revocados no pueden utilizarse posteriormente.
- [ ] Los identificadores de token utilizados para revocación son únicos.
- [ ] Los errores de sesión expirada tienen comportamiento controlado.
- [ ] La recuperación de contraseña utiliza tokens o códigos con expiración.
- [ ] Los tokens de recuperación no se registran en logs.

## Autorización

- [ ] La autorización se verifica en el backend.
- [ ] Los roles se validan antes de ejecutar operaciones protegidas.
- [ ] Las rutas administrativas están protegidas.
- [ ] Las operaciones sensibles tienen controles de autorización.
- [ ] Un usuario no puede elevar sus propios privilegios mediante parámetros de la solicitud.
- [ ] Los controles del frontend no se consideran el único mecanismo de autorización.
- [ ] Los accesos denegados devuelven respuestas HTTP apropiadas.
- [ ] Las pruebas cubren accesos permitidos y denegados.

## Multi-tenancy

- [ ] Las operaciones multi-tenant utilizan el `empresa_id` correspondiente.
- [ ] El contexto de empresa se obtiene de una fuente confiable.
- [ ] El cliente no puede seleccionar arbitrariamente el tenant de una operación protegida.
- [ ] Las consultas filtran correctamente por empresa.
- [ ] Las inserciones asignan la empresa correcta.
- [ ] Las actualizaciones verifican pertenencia al tenant.
- [ ] Las eliminaciones verifican pertenencia al tenant.
- [ ] Los repositorios mantienen el aislamiento.
- [ ] Los servicios no omiten el contexto de empresa.
- [ ] Las pruebas incluyen intentos de acceso cruzado entre empresas.
- [ ] Los identificadores secuenciales no permiten acceder a registros de otro tenant.
- [ ] Los errores no revelan datos de otra empresa.

## Gestión de sesiones

- [ ] Las sesiones tienen expiración.
- [ ] Las sesiones pueden revocarse.
- [ ] Las sesiones revocadas no pueden renovarse indebidamente.
- [ ] Los datos de sesión no contienen secretos innecesarios.
- [ ] Las sesiones se asocian al usuario correcto.
- [ ] Los datos de IP y user-agent se gestionan de acuerdo con las necesidades de auditoría.
- [ ] Las sesiones antiguas se gestionan según la política definida.
- [ ] Las pruebas cubren expiración, logout y revocación.

## CSRF

- [ ] Las operaciones mutables están protegidas contra CSRF cuando corresponde.
- [ ] El frontend obtiene el mecanismo de protección requerido.
- [ ] El token CSRF se envía mediante la cabecera definida.
- [ ] Las solicitudes sin token válido son rechazadas cuando corresponde.
- [ ] Las operaciones GET de solo lectura no se tratan como mutaciones.
- [ ] Los cambios en autenticación mediante cookies se revisan junto con CSRF.
- [ ] Las pruebas verifican solicitudes protegidas.

## Validación de entradas

- [ ] Los datos externos se validan antes de procesarse.
- [ ] Los esquemas Zod corresponden al contrato esperado.
- [ ] Se validan tipos.
- [ ] Se validan campos obligatorios.
- [ ] Se validan rangos.
- [ ] Se validan longitudes.
- [ ] Se validan estructuras anidadas.
- [ ] Se rechazan valores no permitidos.
- [ ] Los límites de archivos están definidos cuando corresponde.
- [ ] Las dimensiones de imágenes se validan cuando corresponde.
- [ ] Los parámetros de IA se validan.
- [ ] La validación de aplicación se complementa con restricciones de base de datos.

## Protección contra inyección

- [ ] Las consultas SQL utilizan mecanismos parametrizados.
- [ ] Los datos del usuario no se incorporan directamente a consultas SQL.
- [ ] Las entradas utilizadas en comandos externos se validan.
- [ ] Los nombres de archivos se controlan.
- [ ] Las rutas de archivos no pueden manipularse arbitrariamente.
- [ ] Las entradas utilizadas en logs se revisan contra log injection.
- [ ] Las respuestas de servicios externos se validan antes de utilizarlas.

## Cabeceras HTTP

- [ ] Helmet está configurado.
- [ ] Content Security Policy está configurada según el entorno.
- [ ] HSTS se utiliza cuando corresponde al entorno HTTPS.
- [ ] Trusted Types se configura cuando corresponde.
- [ ] Las cabeceras no exponen información innecesaria del servidor.
- [ ] Las políticas de seguridad se prueban con el frontend.
- [ ] No se introducen excepciones amplias sin justificación.

## CORS

- [ ] Los orígenes permitidos están definidos explícitamente.
- [ ] No se permite cualquier origen cuando existen credenciales.
- [ ] Los métodos permitidos corresponden a las necesidades de la API.
- [ ] Las cabeceras permitidas están controladas.
- [ ] Las configuraciones de desarrollo no se reutilizan automáticamente en producción.

## Cookies

- [ ] Las cookies sensibles utilizan `httpOnly` cuando corresponde.
- [ ] Las cookies utilizan `Secure` en HTTPS cuando corresponde.
- [ ] `SameSite` se configura de acuerdo con el flujo de autenticación.
- [ ] No se almacenan secretos innecesarios en cookies accesibles por JavaScript.
- [ ] Los dominios y rutas de cookies están restringidos cuando corresponde.

## Gestión de secretos

- [ ] No existen contraseñas reales en el repositorio.
- [ ] No existen tokens de proveedores externos en el código.
- [ ] No existen claves API en archivos versionados.
- [ ] Los secretos se gestionan mediante variables de entorno o mecanismos equivalentes.
- [ ] Los archivos `.env` sensibles no se versionan.
- [ ] `.env.example` no contiene secretos reales.
- [ ] Los workflows de CI/CD utilizan secretos administrados por la plataforma.
- [ ] Los logs no muestran valores secretos.
- [ ] Las credenciales de prueba están separadas de producción.

## Base de datos

- [ ] Las credenciales de base de datos no están codificadas en el código.
- [ ] Las conexiones utilizan la configuración correspondiente al entorno.
- [ ] Las consultas están parametrizadas.
- [ ] Las restricciones de integridad están activas.
- [ ] Las claves foráneas se mantienen correctamente.
- [ ] Los cambios de esquema utilizan mecanismos reproducibles.
- [ ] Las operaciones sensibles utilizan transacciones cuando corresponde.
- [ ] Los usuarios de base de datos tienen únicamente los privilegios necesarios.
- [ ] Los backups no contienen información innecesaria cuando existen alternativas.
- [ ] Los respaldos están protegidos.

## Redis

- [ ] Redis no se expone innecesariamente a Internet.
- [ ] Las credenciales o mecanismos de acceso están protegidos cuando corresponda.
- [ ] Los datos sensibles no se almacenan sin necesidad.
- [ ] Los valores de blacklist tienen expiración adecuada.
- [ ] La pérdida de Redis tiene un comportamiento definido.
- [ ] Las pruebas cubren los mecanismos dependientes de Redis.

## Logging

- [ ] Los logs no contienen contraseñas.
- [ ] Los logs no contienen access tokens.
- [ ] Los logs no contienen refresh tokens.
- [ ] Los logs no contienen claves API.
- [ ] Los datos personales se registran únicamente cuando existe una necesidad técnica.
- [ ] Los mensajes de error no exponen secretos.
- [ ] Los datos provenientes del usuario se controlan antes de registrarse.
- [ ] Los niveles de log son adecuados para cada entorno.
- [ ] Los logs pueden utilizarse para diagnóstico sin revelar información sensible.

## Auditoría

- [ ] Las acciones sensibles generan auditoría cuando corresponde.
- [ ] Los eventos contienen contexto suficiente para investigación.
- [ ] La empresa asociada al evento es identificable.
- [ ] El usuario asociado es identificable cuando corresponde.
- [ ] Los detalles de auditoría no contienen secretos.
- [ ] Los eventos de autenticación relevante se registran según la política.
- [ ] La auditoría no sustituye los logs operativos.

## Facturación

- [ ] Las operaciones de facturación requieren autorización apropiada.
- [ ] Los estados de factura se validan.
- [ ] Los cambios de estado no pueden realizarse arbitrariamente.
- [ ] La numeración se gestiona de forma controlada.
- [ ] Las operaciones concurrentes sobre secuencias son consideradas.
- [ ] Los datos de clientes se protegen.
- [ ] Las integraciones externas relacionadas con facturación se validan.
- [ ] Los errores del proveedor no exponen información interna.
- [ ] Las operaciones relevantes tienen trazabilidad.

## IA

- [ ] Las solicitudes de IA están autenticadas.
- [ ] Las operaciones están autorizadas.
- [ ] Las imágenes se validan antes del procesamiento.
- [ ] Los tamaños de entrada están limitados.
- [ ] Los formatos permitidos están definidos.
- [ ] Los prompts no contienen secretos.
- [ ] Los datos personales se minimizan.
- [ ] Las respuestas de proveedores externos se validan.
- [ ] Los errores externos se manejan de forma controlada.
- [ ] Los timeouts están definidos.
- [ ] Los reintentos no generan operaciones duplicadas cuando tengan efectos persistentes.
- [ ] Los resultados se asocian al contexto de empresa y usuario correspondiente.
- [ ] Los proveedores externos no reciben información innecesaria.

## Dependencias

- [ ] Las dependencias se mantienen versionadas.
- [ ] El lockfile se conserva.
- [ ] La instalación CI utiliza `npm ci`.
- [ ] Las vulnerabilidades de dependencias se revisan.
- [ ] Las actualizaciones importantes se prueban.
- [ ] No se utilizan paquetes innecesarios.
- [ ] Las dependencias abandonadas se identifican.
- [ ] Los cambios mayores de versión se revisan antes de integrarse.

## Frontend

- [ ] El frontend no contiene secretos de backend.
- [ ] Las variables `VITE_*` contienen únicamente información apropiada para el cliente.
- [ ] Las rutas protegidas requieren autenticación.
- [ ] Los permisos se verifican también en backend.
- [ ] Los datos recibidos de la API se manejan de forma segura.
- [ ] Los errores no muestran información sensible.
- [ ] Los archivos subidos se validan.
- [ ] Las URLs externas se controlan cuando corresponda.
- [ ] No se utiliza HTML dinámico sin sanitización adecuada.
- [ ] Las políticas CSP se mantienen compatibles con la aplicación.

## Backend

- [ ] Las rutas sensibles requieren autenticación.
- [ ] Las rutas sensibles requieren autorización.
- [ ] Los datos de entrada se validan.
- [ ] Los errores están controlados.
- [ ] Los logs no exponen secretos.
- [ ] Los servicios externos tienen timeouts.
- [ ] Las operaciones críticas consideran idempotencia.
- [ ] Las operaciones multi-tenant preservan el contexto de empresa.
- [ ] Las conexiones a infraestructura utilizan configuración segura.
- [ ] Los endpoints sensibles tienen límites apropiados.

## Rate limiting y abuso

- [ ] Las operaciones sensibles tienen límites apropiados.
- [ ] Los endpoints de autenticación tienen protección contra abuso.
- [ ] Las operaciones costosas consideran límites.
- [ ] Los endpoints de IA consideran límites de consumo.
- [ ] Los límites son coherentes con las necesidades funcionales.
- [ ] Los errores de rate limiting no revelan información innecesaria.

## CI/CD

- [ ] El workflow utiliza una versión de Node.js definida.
- [ ] La instalación utiliza `npm ci`.
- [ ] Se ejecuta lint.
- [ ] Se ejecutan pruebas.
- [ ] Se genera cobertura cuando corresponde.
- [ ] Los secretos utilizan mecanismos seguros de CI/CD.
- [ ] Los logs del workflow no muestran secretos.
- [ ] Las dependencias se instalan desde fuentes confiables.
- [ ] Los artefactos generados no contienen secretos.
- [ ] Las ramas protegidas utilizan los controles configurados.
- [ ] Los cambios de seguridad importantes requieren revisión.

## Análisis estático

- [ ] ESLint se ejecuta correctamente.
- [ ] SonarCloud analiza el código correspondiente.
- [ ] Los issues de seguridad se revisan.
- [ ] Los problemas de confiabilidad se revisan.
- [ ] Las duplicaciones se interpretan en contexto.
- [ ] El código legacy se identifica antes de corregir alertas duplicadas.
- [ ] Las correcciones no introducen regresiones.

## DAST

- [ ] La aplicación se ejecuta en un entorno de prueba.
- [ ] ZAP u otra herramienta DAST puede acceder a los endpoints previstos.
- [ ] Los hallazgos se clasifican.
- [ ] Los falsos positivos se documentan.
- [ ] Los hallazgos reales generan acciones de tratamiento.
- [ ] Las pruebas DAST no utilizan datos reales.
- [ ] Los resultados se conservan como evidencia cuando corresponda.

## Despliegue

- [ ] Las variables de producción están configuradas.
- [ ] Los secretos no están incluidos en el repositorio.
- [ ] La base de datos corresponde al entorno correcto.
- [ ] Las migraciones han sido verificadas.
- [ ] Redis corresponde al entorno correcto.
- [ ] El backend ejecuta la configuración de producción.
- [ ] El frontend utiliza la API correcta.
- [ ] HTTPS está configurado cuando corresponde.
- [ ] Los health checks funcionan.
- [ ] Los logs operativos están disponibles.
- [ ] El procedimiento de rollback está definido.

## Backup y recuperación

- [ ] Existe una estrategia de backup.
- [ ] Los respaldos están protegidos.
- [ ] Se conoce la ubicación de los respaldos.
- [ ] Se conoce el procedimiento de restauración.
- [ ] La restauración se ha probado cuando corresponde.
- [ ] Los respaldos no se consideran válidos únicamente por existir.
- [ ] Se conoce el impacto de perder Redis.
- [ ] Se conoce el impacto de perder la base de datos.

## Pruebas de seguridad

- [ ] Existen pruebas de autenticación.
- [ ] Existen pruebas de autorización.
- [ ] Existen pruebas de multi-tenancy.
- [ ] Existen pruebas de validación.
- [ ] Existen pruebas de sesión.
- [ ] Existen pruebas de CSRF.
- [ ] Existen pruebas de endpoints críticos.
- [ ] Se ejecutan pruebas después de cambios de seguridad.

## Gestión de incidentes

- [ ] Existe un procedimiento para registrar incidentes.
- [ ] Se conserva evidencia relevante.
- [ ] Se identifica el componente afectado.
- [ ] Se evalúa el alcance.
- [ ] Se corrige la causa cuando sea posible.
- [ ] Se realizan pruebas de regresión.
- [ ] Se actualiza la documentación cuando corresponde.
- [ ] Se revisa si el incidente revela nueva deuda técnica.

## Revisión previa a Pull Request

- [ ] El cambio tiene una justificación clara.
- [ ] Se revisaron consumidores afectados.
- [ ] Se revisaron permisos.
- [ ] Se revisó multi-tenancy.
- [ ] Se agregaron o actualizaron pruebas.
- [ ] Se ejecutó lint.
- [ ] Se revisaron errores de seguridad.
- [ ] No se añadieron secretos.
- [ ] Se actualizó documentación cuando corresponde.
- [ ] Se revisó código legacy afectado.
- [ ] Se evaluó el impacto sobre CI/CD.

## Revisión previa a release

- [ ] Las pruebas relevantes pasan.
- [ ] El lint pasa.
- [ ] Los análisis de calidad fueron revisados.
- [ ] Los cambios de base de datos fueron verificados.
- [ ] Las variables de entorno fueron revisadas.
- [ ] Los cambios de seguridad fueron revisados.
- [ ] Las integraciones externas fueron verificadas.
- [ ] El rollback está preparado.
- [ ] Los health checks fueron verificados.
- [ ] La evidencia necesaria está disponible.

## Evidencia

La revisión puede respaldarse mediante:

- resultados de Vitest;
- cobertura;
- Playwright;
- ESLint;
- SonarCloud;
- DAST;
- resultados de CI;
- logs;
- pruebas de integración;
- pruebas de rendimiento;
- verificaciones de despliegue.

## Mantenimiento

Este checklist debe actualizarse cuando:

- se introduzca un nuevo mecanismo de autenticación;
- cambie la arquitectura;
- se agregue una integración externa;
- se modifique el modelo de datos;
- se incorpore una nueva herramienta de seguridad;
- aparezca un incidente relevante;
- cambien los requisitos de despliegue.

La existencia de un checklist no constituye evidencia de que todos los controles hayan sido ejecutados. Cada revisión debe conservar su resultado cuando sea necesario.
