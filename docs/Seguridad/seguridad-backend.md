# Seguridad del Backend

## 1. Propósito

Este documento establece los controles de seguridad aplicables al backend de la plataforma ERP/SaaS.

El backend constituye la principal frontera de confianza para autenticación, autorización, aislamiento multi-tenant, validación de entradas, reglas de negocio, acceso a datos e integración con servicios externos.

---

## 2. Alcance

Aplica a:

- Node.js.
- Express.
- Middleware.
- Controladores.
- Servicios.
- Repositorios.
- Validadores.
- Autenticación.
- Autorización.
- Multi-tenancy.
- MySQL.
- Redis.
- Sesiones.
- Tokens.
- Archivos.
- IA.
- Facturación.
- Inventario.
- Logs.
- Auditoría.
- Configuración.
- Dependencias.
- CI/CD.

---

## 3. Principios

El backend debe aplicar:

1. Denegación por defecto.
2. Mínimo privilegio.
3. Validación en servidor.
4. Autorización explícita.
5. Aislamiento por empresa.
6. Separación de responsabilidades.
7. Manejo controlado de errores.
8. Protección de secretos.
9. Trazabilidad.
10. Pruebas automatizadas.
11. Defensa en profundidad.
12. Fail-safe cuando corresponda.

---

## 4. Arquitectura de seguridad

El flujo general de una solicitud protegida debe seguir una estructura equivalente a:

```text
Request
  ↓
HTTP / Security Middleware
  ↓
Authentication
  ↓
Authorization
  ↓
Tenant Context
  ↓
Validation
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
MySQL / Redis
```

Las responsabilidades concretas pueden variar según el módulo, pero los controles críticos no deben depender exclusivamente del frontend.

---

## 5. Configuración segura

La configuración sensible debe mantenerse fuera del código fuente.

Entre los valores que deben gestionarse externamente se encuentran:

- Credenciales MySQL.
- Credenciales Redis.
- Secretos JWT.
- Claves de proveedores.
- Credenciales de servicios externos.
- Configuración sensible de despliegue.

El archivo `.env.example` debe contener únicamente nombres y ejemplos no sensibles.

---

## 6. Variables obligatorias

El backend debe validar la existencia y consistencia de las variables necesarias para iniciar correctamente.

Una configuración incompleta no debe provocar que el servidor opere silenciosamente con valores inseguros.

Cuando una variable crítica no esté disponible, el comportamiento esperado debe ser un fallo controlado durante el arranque.

---

## 7. Autenticación

El backend debe verificar:

- Identidad.
- Credenciales.
- Token.
- Expiración.
- Revocación.
- Estado de usuario.
- Empresa asociada.

Los endpoints privados no deben depender de información proporcionada únicamente por el cliente para determinar la identidad.

---

## 8. JWT y sesiones

La arquitectura utiliza identificadores de token y mecanismos de revocación.

El backend debe considerar:

- `jti`.
- Expiración.
- Blacklist.
- Refresh token.
- Sesiones.
- Logout.
- Rotación.
- Invalidación.

Los tokens no deben registrarse completos en logs.

---

## 9. Revocación

La revocación debe impedir el uso posterior de credenciales o tokens identificados como inválidos.

La arquitectura utiliza Redis y persistencia MySQL para mecanismos relacionados con blacklist.

La revocación debe verificarse mediante pruebas que contemplen:

- Token válido.
- Token expirado.
- Token revocado.
- Sesión eliminada.
- Logout.
- Reutilización posterior.

---

## 10. Autorización

El backend debe verificar permisos antes de ejecutar operaciones protegidas.

La autorización debe considerar:

```text
Usuario
  +
Rol
  +
Empresa
  +
Recurso
  +
Acción
```

Un usuario autenticado no debe recibir acceso automático a todos los recursos del sistema.

---

## 11. Multi-tenancy

El backend utiliza un contexto de empresa asociado a la solicitud, incluyendo `req.empresaId`.

Este contexto debe utilizarse para limitar las operaciones empresariales.

Las consultas deben evitar depender de un `empresa_id` arbitrario enviado por el cliente cuando esto pueda permitir acceso cruzado.

Debe verificarse el tenant en:

- Controladores.
- Servicios.
- Repositorios.
- Consultas.
- Relaciones entre recursos.

---

## 12. Aislamiento a nivel de datos

Una consulta debe considerar el tenant cuando el recurso sea empresarial.

Conceptualmente:

```sql
SELECT *
FROM recurso
WHERE id = ?
  AND empresa_id = ?;
```

El filtro correspondiente debe aplicarse de acuerdo con el modelo de cada entidad.

No todos los recursos necesariamente tienen una columna directa `empresa_id`; en esos casos debe comprobarse la relación empresarial mediante las entidades relacionadas.

---

## 13. Validación

El backend debe validar todos los datos externos.

La validación debe cubrir:

- Tipos.
- Rangos.
- Longitudes.
- Enumeraciones.
- Identificadores.
- Objetos.
- Arrays.
- Archivos.
- Medidas.
- Cantidades.
- Precios.
- Fechas.
- Estados.

El proyecto utiliza Zod para validaciones en los puntos donde se ha incorporado este mecanismo.

---

## 14. Controladores

Los controladores deben concentrarse en:

- Recibir solicitudes.
- Obtener contexto.
- Ejecutar validaciones.
- Invocar servicios.
- Construir respuestas.

La lógica de negocio crítica no debería duplicarse innecesariamente entre múltiples controladores.

La eliminación progresiva de arquitectura legacy debe reducir duplicaciones que puedan provocar comportamientos de seguridad inconsistentes.

---

## 15. Servicios

Los servicios deben centralizar reglas de negocio cuando estas deban ser compartidas por diferentes entradas.

Deben considerar:

- Autorización necesaria.
- Tenant.
- Integridad.
- Transacciones.
- Errores.
- Dependencias externas.

Una operación crítica no debe quedar protegida únicamente por una ruta concreta si puede ser invocada desde otros puntos.

---

## 16. Repositorios

Los repositorios deben proporcionar acceso controlado a los datos.

Deben evitar:

- Consultas concatenadas inseguras.
- Acceso sin filtro de tenant cuando corresponda.
- Exposición innecesaria de columnas.
- Operaciones ambiguas.

La capa de persistencia debe respetar las restricciones de integridad establecidas por la base de datos.

---

## 17. SQL Injection

El backend debe utilizar consultas parametrizadas o mecanismos equivalentes.

Los valores del usuario nunca deben convertirse directamente en fragmentos de SQL ejecutable.

Las pruebas deben incluir entradas diseñadas para detectar:

- SQL Injection.
- Manipulación de filtros.
- Alteración de ordenamiento.
- Manipulación de identificadores.
- Inyección mediante campos de búsqueda.

---

## 18. Manejo de errores

Los errores internos deben separarse de los mensajes mostrados al cliente.

El backend debe evitar exponer:

- Stack traces.
- Consultas SQL.
- Rutas internas.
- Variables de entorno.
- Credenciales.
- Configuración sensible.

Los detalles técnicos deben registrarse de forma controlada mediante el sistema de logging.

---

## 19. Logging

El backend utiliza Winston como mecanismo de logging.

Los logs deben permitir investigar:

- Errores.
- Autenticación.
- Actividad relevante.
- Fallos.
- Operaciones importantes.

No deben incluir:

- Contraseñas.
- Tokens completos.
- Secretos.
- Claves API.
- Información sensible innecesaria.

Los valores provenientes del usuario deben tratarse para reducir riesgos de Log Injection.

---

## 20. Auditoría

La auditoría permite registrar acciones relevantes del sistema.

Entre las acciones contempladas se encuentran:

- `DELETE`.
- `ANULACION`.
- `LOGIN`.
- `LOGOUT`.
- `LOGIN_FALLIDO`.
- `REFRESH_TOKEN`.
- `CAMBIO_PASSWORD`.

Los registros deben mantener suficiente contexto para investigación sin almacenar información sensible innecesaria.

---

## 21. Contraseñas

Las contraseñas deben:

- Recibirse únicamente mediante canales protegidos.
- Validarse.
- Almacenarse utilizando mecanismos criptográficos apropiados.
- No aparecer en logs.
- No almacenarse en texto plano.

Los procesos de cambio y recuperación deben invalidar o actualizar las credenciales y sesiones según las reglas de seguridad definidas.

---

## 22. Recuperación de contraseña

El proceso debe proteger:

- Códigos.
- Tokens.
- Expiración.
- Uso único.
- Identidad del usuario.

La respuesta del endpoint no debe facilitar innecesariamente la enumeración de usuarios.

Los mecanismos de recuperación deben disponer de límites contra abuso.

---

## 23. Protección HTTP

El backend utiliza mecanismos de seguridad HTTP mediante Helmet y configuración asociada.

Los controles incluyen aspectos relacionados con:

- CSP.
- HSTS.
- Trusted Types.
- MIME sniffing.
- Clickjacking.
- Política de recursos.

La configuración debe revisarse cuando cambien frontend, dominios o infraestructura.

---

## 24. CORS

CORS debe restringir los orígenes autorizados.

Debe mantenerse coherente con:

- Frontend.
- Cookies.
- CSRF.
- Credenciales.
- Entornos.

Una configuración demasiado permisiva debe evitarse en producción.

---

## 25. CSRF

Las solicitudes autenticadas mediante cookies deben estar protegidas contra CSRF.

El backend debe:

- Validar el token correspondiente.
- Aplicar la protección a operaciones mutables.
- Rechazar tokens inválidos.
- Mantener compatibilidad con la configuración del frontend.

Los cambios deben probarse antes de desplegarse.

---

## 26. Rate limiting

Los endpoints susceptibles de abuso deben tener límites apropiados.

Especialmente:

- Login.
- Recuperación de contraseña.
- Validación de códigos.
- IA.
- Archivos.
- Operaciones costosas.
- Recursos administrativos.

Los límites deben considerar el impacto sobre usuarios legítimos.

---

## 27. Archivos

Los archivos recibidos deben considerarse no confiables.

El backend debe validar:

- Tamaño.
- MIME.
- Extensión.
- Nombre.
- Contenido.
- Ubicación.
- Acceso posterior.

Los archivos no deben poder ejecutarse como código del servidor.

---

## 28. Inteligencia artificial

Las integraciones de IA deben ejecutarse mediante el backend cuando requieran credenciales privadas.

El backend debe proteger:

- API keys.
- Prompts.
- Imágenes.
- Resultados.
- URLs.
- Límites.
- Timeouts.

Los errores de proveedores deben manejarse sin exponer secretos.

La arquitectura contempla integraciones con servicios de IA y debe considerar fallos como agotamiento de cuota o respuestas de error del proveedor.

---

## 29. Facturación

La facturación requiere controles adicionales sobre:

- Tenant.
- Usuario.
- Rol.
- Estado.
- Transiciones.
- Totales.
- Detalles.
- Secuencias.
- Integración SRI.

Las operaciones irreversibles o sensibles deben contar con autorización y trazabilidad apropiadas.

---

## 30. Inventario

El backend debe proteger:

- Materiales.
- Stock.
- Variantes.
- Colores.
- Proveedores.
- Movimientos relacionados.

Las operaciones concurrentes deben mantener la integridad del inventario.

Las restricciones de base de datos, transacciones y lógica de negocio deben actuar conjuntamente.

---

## 31. Proformas y pedidos

El backend debe validar:

- Cliente.
- Material.
- Cantidad.
- Precio.
- Medidas.
- Estado.
- Empresa.
- Usuario.

Las operaciones deben respetar las relaciones existentes entre proformas, pedidos, detalles y materiales.

---

## 32. Concurrencia

Las operaciones que puedan ejecutarse simultáneamente deben analizar:

- Lecturas concurrentes.
- Actualizaciones.
- Stock.
- Secuencias.
- Estados.
- Totales.
- Facturación.

La protección debe apoyarse en:

- Transacciones.
- Restricciones.
- Índices.
- Claves únicas.
- Estrategias de bloqueo cuando sean necesarias.

---

## 33. Idempotencia

Las operaciones que puedan repetirse debido a reintentos deben evaluarse para evitar efectos duplicados.

Especialmente:

- Facturación.
- Integraciones externas.
- Creación de registros.
- Procesos de IA.
- Operaciones asíncronas.

La implementación de idempotencia debe responder a las reglas de negocio de cada flujo.

---

## 34. Redis

Redis participa en mecanismos relacionados con:

- Blacklist.
- Sesiones.
- Tokens.
- Datos temporales.

El backend debe controlar:

- Acceso.
- Expiración.
- Formato de claves.
- Información almacenada.
- Manejo de errores.
- Disponibilidad.

La pérdida de Redis no debe provocar automáticamente una relajación de los controles de seguridad.

---

## 35. Base de datos

El acceso a MySQL debe proteger:

- Credenciales.
- Conexiones.
- Consultas.
- Transacciones.
- Integridad.
- Relaciones.
- Datos empresariales.

La aplicación debe respetar las restricciones y claves definidas en el esquema.

---

## 36. Dependencias

Las dependencias backend deben revisarse periódicamente.

El análisis debe incluir:

- Vulnerabilidades conocidas.
- Dependencias transitivas.
- Versiones.
- Compatibilidad.
- Cambios mayores.
- Riesgo de regresión.

Las actualizaciones deben verificarse mediante pruebas.

---

## 37. Procesos y recursos

El backend debe limitar recursos cuando exista riesgo de consumo excesivo.

Debe considerarse:

- Tamaño de solicitudes.
- Archivos.
- Consultas costosas.
- IA.
- Timeouts.
- Conexiones.
- Memoria.
- Procesamiento.

PM2 utiliza un límite `max_memory_restart` de 400 MB como mecanismo operativo de protección frente a crecimiento excesivo de memoria.

Este mecanismo no sustituye la investigación de fugas de memoria ni el análisis de rendimiento.

---

## 38. Gestión de procesos

La ejecución mediante PM2 debe mantenerse con configuraciones consistentes entre entornos.

Deben controlarse:

- Reinicios.
- Variables de entorno.
- Logs.
- Número de procesos.
- Recursos.
- Señales de terminación.
- Estado de la aplicación.

Los reinicios automáticos no deben ocultar errores persistentes.

---

## 39. CI/CD

La seguridad backend debe verificarse mediante el pipeline.

El proceso actual incluye:

- Instalación reproducible mediante `npm ci`.
- ESLint.
- Pruebas.
- Cobertura.
- Generación de artefactos de evidencia.

La incorporación progresiva de:

- Análisis de dependencias.
- SonarCloud.
- Integración.
- E2E.
- DAST.

debe aumentar la cobertura de seguridad del ciclo.

---

## 40. Pruebas de seguridad

Los casos deben cubrir:

```text
Sin autenticación
       ↓
Rechazo

Autenticación válida
       ↓
Autorización

Rol incorrecto
       ↓
Rechazo

Tenant incorrecto
       ↓
Rechazo

Token expirado/revocado
       ↓
Rechazo

Entrada inválida
       ↓
Rechazo controlado
```

También deben evaluarse:

- SQL Injection.
- CSRF.
- XSS.
- Log Injection.
- Enumeración.
- Abuso de recursos.
- Acceso cruzado entre tenants.
- Archivos maliciosos.
- Errores de proveedores externos.

---

## 41. Arquitectura legacy

La coexistencia entre arquitectura actual y componentes legacy representa un riesgo de mantenibilidad y seguridad.

La migración debe realizarse de forma controlada:

```text
Identificar consumidores
        ↓
Migrar referencias
        ↓
Ejecutar pruebas
        ↓
Eliminar componente legacy
        ↓
Ejecutar pruebas nuevamente
        ↓
Reanalizar calidad y seguridad
```

No debe eliminarse un componente únicamente porque parezca duplicado sin verificar sus consumidores.

---

## 42. Estado actual

El backend cuenta con:

- Arquitectura modular bajo `src/modules` y `src/shared`.
- Middleware de autenticación.
- Contexto `req.empresaId`.
- JWT con `jti`.
- Blacklist mediante Redis.
- Persistencia relacionada en MySQL.
- Validación mediante Zod en los módulos correspondientes.
- Helmet.
- Winston.
- PM2.
- Pruebas automatizadas.
- CI.
- ESLint sin errores ni advertencias en backend.

La cobertura de seguridad continúa ampliándose mediante pruebas de integración, E2E, análisis estático, DAST y revisión de arquitectura legacy.

---

## 43. Criterios de aceptación

La seguridad del backend se considera adecuadamente cubierta cuando:

- Los endpoints privados requieren autenticación.
- Las operaciones aplican autorización.
- El tenant se verifica.
- Las entradas son validadas.
- Las consultas son seguras.
- Los tokens pueden revocarse.
- Las sesiones pueden invalidarse.
- Los secretos no se registran.
- Los errores no exponen información interna.
- Los recursos costosos tienen límites.
- Las operaciones críticas cuentan con pruebas.
- Las dependencias se revisan.
- El CI ejecuta las verificaciones establecidas.
- La arquitectura legacy se reduce progresivamente.
- Los hallazgos de seguridad tienen seguimiento.

---

## 44. Mantenimiento

Este documento debe revisarse cuando:

- Cambie Express.
- Cambie la arquitectura modular.
- Cambie autenticación.
- Cambie autorización.
- Cambie multi-tenancy.
- Se incorporen nuevos módulos.
- Se modifique MySQL.
- Se modifique Redis.
- Se agreguen proveedores externos.
- Se agreguen servicios de IA.
- Cambie PM2.
- Cambien los controles CI/CD.
- Se detecten nuevas vulnerabilidades.

Los cambios de backend deben evaluarse considerando su impacto sobre autenticación, autorización, aislamiento, datos y disponibilidad.
