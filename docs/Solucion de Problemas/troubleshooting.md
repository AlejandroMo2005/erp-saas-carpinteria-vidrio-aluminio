# Solución de problemas

## Descripción

Este documento establece una guía para identificar, diagnosticar y resolver problemas frecuentes del ERP/SaaS durante desarrollo, pruebas, CI/CD, despliegue y operación.

El diagnóstico debe partir de evidencia observable y evitar cambios destructivos que dificulten determinar la causa original del problema.

## Objetivo

Establecer un procedimiento para:

- identificar síntomas;
- recopilar evidencia;
- localizar el componente afectado;
- comprobar dependencias;
- aplicar correcciones controladas;
- verificar la recuperación;
- documentar incidentes relevantes;
- evitar recurrencias.

## Principios de diagnóstico

El diagnóstico debe seguir estos principios:

- reproducir el problema cuando sea posible;
- revisar evidencia antes de modificar código;
- aislar el componente afectado;
- realizar un cambio controlado por vez cuando sea viable;
- ejecutar pruebas después de una corrección;
- conservar información útil del incidente;
- evitar eliminar evidencia antes de determinar la causa.

No se debe asumir que el primer error visible corresponde necesariamente a la causa raíz.

## Flujo general

```text
Detectar síntoma
      ↓
Reproducir
      ↓
Recopilar evidencia
      ↓
Identificar componente
      ↓
Revisar dependencias
      ↓
Determinar causa probable
      ↓
Aplicar corrección
      ↓
Ejecutar pruebas
      ↓
Verificar recuperación
      ↓
Documentar
```

## Clasificación inicial

Los problemas pueden clasificarse inicialmente como:

- frontend;
- backend;
- API;
- autenticación;
- base de datos;
- Redis;
- integración externa;
- IA;
- pruebas;
- linting;
- CI/CD;
- despliegue;
- rendimiento;
- seguridad.

La clasificación inicial puede cambiar cuando aparezca nueva evidencia.

## Recopilación de evidencia

Antes de realizar cambios importantes se debe recopilar, cuando corresponda:

- mensaje de error;
- stack trace;
- endpoint afectado;
- método HTTP;
- código de respuesta;
- fecha y hora;
- versión;
- commit;
- logs;
- estado de servicios;
- resultado de pruebas;
- configuración relevante sin secretos.

Nunca se deben copiar contraseñas, tokens o API keys dentro de reportes de incidentes.

## Problemas del frontend

### La aplicación no inicia

Comprobar:

```bash
node --version
npm --version
npm ci
npm run dev
```

Verificar que:

- las dependencias estén instaladas;
- la versión de Node.js sea compatible;
- las variables de entorno requeridas estén disponibles;
- no exista un error de compilación;
- el puerto esperado esté disponible.

### Error de compilación

Revisar:

- archivo indicado por el compilador;
- importaciones;
- nombres exportados;
- dependencias;
- alias de rutas;
- sintaxis;
- variables de entorno utilizadas durante la construcción.

No se debe ocultar un error de compilación modificando temporalmente la configuración sin identificar su causa.

### Error de conexión con la API

Comprobar:

- URL base;
- disponibilidad del backend;
- configuración de Vite;
- proxy `/api`;
- puerto del backend;
- credenciales de sesión;
- cookies;
- CSRF;
- código HTTP devuelto.

La configuración actual utiliza `VITE_API_URL` cuando está disponible y `/api` como valor alternativo.

### Error CORS

Revisar:

- origen del frontend;
- configuración del backend;
- credenciales;
- headers;
- métodos permitidos;
- configuración del entorno.

No se debe solucionar un problema de CORS habilitando indiscriminadamente cualquier origen en producción.

## Problemas del backend

### El backend no inicia

Comprobar:

- versión de Node.js;
- dependencias;
- variables de entorno;
- conexión a MySQL;
- conexión a Redis cuando corresponda;
- errores de importación;
- configuración de ejecución.

Si faltan variables obligatorias de base de datos, el backend puede finalizar durante el arranque.

### Error de conexión con MySQL

Comprobar:

```text
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
```

También revisar:

- disponibilidad del servidor MySQL;
- puerto;
- credenciales;
- permisos;
- existencia de la base de datos;
- conectividad desde el entorno de ejecución.

No se deben modificar credenciales de producción para resolver un problema que no haya sido diagnosticado.

### Error de Redis

Comprobar:

- disponibilidad del servicio;
- host;
- puerto;
- credenciales cuando correspondan;
- conectividad;
- expiración de claves;
- logs del backend.

Determinar si la funcionalidad afectada requiere Redis obligatoriamente o si puede manejar la indisponibilidad de manera controlada.

## Problemas de autenticación

### Inicio de sesión rechazado

Comprobar:

- existencia del usuario;
- estado activo;
- contraseña;
- empresa;
- rol;
- respuesta del backend;
- logs de autenticación;
- registros de auditoría cuando corresponda.

No se deben registrar contraseñas para diagnosticar problemas de autenticación.

### Sesión expirada

Comprobar:

- access token;
- refresh token;
- expiración;
- cookie;
- sesión almacenada;
- blacklist de tokens;
- `token_id`;
- Redis;
- hora del servidor.

El diagnóstico debe evitar exponer el contenido de los tokens.

### Logout no funciona correctamente

Comprobar:

- invalidación del token;
- blacklist;
- eliminación de sesión;
- cookie;
- auditoría;
- respuesta del backend.

Si el problema está relacionado con Redis, debe verificarse primero la disponibilidad de la dependencia.

## Problemas de autorización

Cuando un usuario recibe un `403`, comprobar:

- usuario autenticado;
- rol;
- permisos;
- empresa;
- middleware de autorización;
- endpoint solicitado.

No se debe solucionar un `403` eliminando controles de autorización sin determinar primero qué regla está rechazando la operación.

## Problemas de multi-tenancy

Cuando un usuario visualice información incorrecta o no pueda acceder a información de su empresa, comprobar:

- `empresa_id`;
- contexto de tenant;
- middleware correspondiente;
- filtros de consultas;
- repositorios;
- relaciones;
- datos utilizados por la operación.

Cuando exista sospecha de aislamiento incorrecto, el problema debe tratarse como incidente de seguridad hasta comprobar lo contrario.

## Problemas de API

### `400 Bad Request`

Comprobar:

- estructura del body;
- parámetros;
- tipos de datos;
- campos obligatorios;
- validadores;
- límites de entrada.

### `401 Unauthorized`

Comprobar:

- autenticación;
- token;
- sesión;
- expiración;
- cookie;
- middleware correspondiente.

### `403 Forbidden`

Comprobar:

- autorización;
- rol;
- permisos;
- tenant.

### `404 Not Found`

Comprobar:

- ruta;
- método HTTP;
- identificador;
- recurso;
- prefijo `/api`;
- configuración del router.

### `409 Conflict`

Comprobar:

- restricciones únicas;
- estado actual del recurso;
- concurrencia;
- operaciones duplicadas;
- reglas de negocio.

### `422 Unprocessable Entity`

Comprobar:

- validación semántica;
- datos incompatibles con la operación;
- reglas de negocio.

### `429 Too Many Requests`

Comprobar:

- rate limiting;
- frecuencia de solicitudes;
- configuración del límite;
- cliente que genera las solicitudes.

### `500 Internal Server Error`

Comprobar primero los logs del backend y el stack trace disponible.

Después revisar:

- servicio;
- repositorio;
- base de datos;
- dependencias externas;
- datos de entrada;
- cambios recientes.

No se debe interpretar un `500` únicamente por el mensaje mostrado al cliente.

## Problemas de base de datos

### Tabla inexistente

Comprobar:

- nombre de la tabla;
- base de datos seleccionada;
- migraciones;
- versión del esquema;
- conexión utilizada por la aplicación.

### Columna inexistente

Comprobar:

- versión del código;
- migración correspondiente;
- esquema real;
- nombre de columna;
- compatibilidad entre backend y base de datos.

### Violación de clave única

Comprobar:

- valores duplicados;
- tenant;
- índices;
- reglas de negocio;
- operaciones concurrentes.

### Violación de clave foránea

Comprobar:

- existencia del registro relacionado;
- orden de operaciones;
- eliminación previa;
- restricciones definidas;
- integridad de los datos.

### Problemas de transacciones

Comprobar:

- inicio de transacción;
- commit;
- rollback;
- errores intermedios;
- operaciones concurrentes;
- conexiones utilizadas.

Las operaciones que requieran atomicidad no deben dejar cambios parciales después de un error.

## Problemas de inventario

Cuando una operación de inventario produzca cantidades inesperadas, comprobar:

- material;
- stock actual;
- cantidad solicitada;
- variante;
- empresa;
- transacción;
- concurrencia;
- operaciones anteriores;
- reglas de actualización de stock.

Los cambios de stock deben analizarse especialmente cuando varias operaciones pueden ejecutarse simultáneamente.

## Problemas de proformas

Comprobar:

- cliente;
- materiales;
- cantidades;
- precios;
- medidas;
- variantes;
- subtotal;
- total;
- empresa;
- estado del registro.

Cuando el problema corresponda a cálculos, deben revisarse primero las funciones responsables del cálculo y sus pruebas.

## Problemas de facturación

Comprobar:

- estado de factura;
- secuencia;
- empresa;
- detalles;
- totales;
- IVA;
- claves de acceso;
- estado SRI cuando corresponda;
- transacciones;
- restricciones de base de datos.

Los cambios de estado deben respetar las transiciones definidas por la lógica de negocio.

## Problemas con IA

Comprobar:

- proveedor;
- modelo;
- credenciales;
- disponibilidad;
- límite de entrada;
- formato de imagen;
- prompt;
- referencias;
- timeout;
- respuesta del proveedor;
- estado registrado en `ia_requests`.

### Error `402`

Un `402` de un proveedor puede indicar una condición relacionada con pago, crédito o cuota.

Comprobar el estado de la cuenta del proveedor y diferenciarlo de errores propios de la aplicación.

No se debe tratar automáticamente como un fallo de autenticación.

### Timeout de IA

Comprobar:

- duración de la solicitud;
- proveedor;
- modelo;
- tamaño de entrada;
- timeout configurado;
- reintentos;
- disponibilidad externa.

No se deben aumentar indefinidamente los timeouts para ocultar problemas de rendimiento.

## Problemas de pruebas

### Tests fallan localmente

Comprobar:

- versión de Node.js;
- dependencias;
- variables de entorno de prueba;
- base de datos de prueba;
- Redis de prueba;
- archivos de configuración;
- mocks;
- estado residual.

Los tests deben ejecutarse en un entorno aislado de los datos de producción.

### Tests pasan localmente pero fallan en CI

Comparar:

- versión de Node.js;
- sistema operativo;
- variables de entorno;
- dependencias;
- servicios disponibles;
- configuración;
- tiempos de ejecución;
- condiciones de concurrencia.

No se debe modificar una prueba únicamente para hacer que CI pase sin entender la diferencia entre ambos entornos.

## Problemas de cobertura

Una reducción de cobertura debe analizarse según el cambio realizado.

Comprobar:

- archivos incluidos;
- exclusiones;
- nuevas ramas;
- nuevas funciones;
- pruebas eliminadas;
- configuración de Vitest.

La cobertura debe utilizarse como indicador de riesgo, no como único criterio de calidad.

## Problemas de ESLint

Cuando aparezca un error:

1. identificar archivo y línea;
2. determinar la regla;
3. revisar si existe un patrón equivalente en el proyecto;
4. corregir la causa;
5. ejecutar nuevamente ESLint.

Las reglas no deben desactivarse únicamente para eliminar un resultado.

## Problemas de CI/CD

Comprobar:

- workflow;
- versión de Node.js;
- instalación con `npm ci`;
- dependencias;
- secretos;
- variables;
- comandos;
- artifacts;
- servicios externos;
- permisos de GitHub Actions.

Si un workflow falla antes de ejecutar las pruebas, primero se debe corregir la etapa que impide llegar a las verificaciones posteriores.

## Problemas de SonarCloud

Cuando aparezcan issues nuevos, primero se debe determinar:

- archivo afectado;
- regla;
- tipo de issue;
- severidad;
- código involucrado;
- relación con arquitectura legacy;
- si existe una implementación equivalente.

No se deben realizar correcciones aisladas sin analizar si el problema forma parte de una duplicación o migración arquitectónica más amplia.

## Problemas de despliegue

Comprobar:

- versión desplegada;
- commit;
- variables de entorno;
- dependencias;
- base de datos;
- migraciones;
- Redis;
- PM2;
- health check;
- logs;
- disponibilidad del frontend.

Cuando una release falle, debe compararse con la versión anterior para determinar qué cambió.

## Problemas de PM2

Comprobar:

- estado del proceso;
- reinicios;
- memoria;
- logs;
- configuración;
- variables de entorno;
- código desplegado.

Un reinicio repetitivo debe investigarse como síntoma de un problema, no tratarse únicamente aumentando el límite de memoria.

## Problemas de rendimiento

Comprobar primero:

- tiempo de respuesta;
- consultas de base de datos;
- uso de CPU;
- memoria;
- Redis;
- tamaño de respuestas;
- llamadas externas;
- frontend;
- cantidad de solicitudes.

El diagnóstico debe basarse en mediciones y no únicamente en percepción.

## Problemas de seguridad

Cuando exista sospecha de un problema de seguridad:

1. conservar evidencia;
2. determinar el alcance;
3. evitar divulgar secretos;
4. comprobar si existe exposición activa;
5. aplicar medidas de contención;
6. corregir;
7. ejecutar pruebas;
8. documentar el incidente.

Los problemas relacionados con aislamiento multi-tenant, credenciales, tokens o exposición de datos deben tratarse con prioridad.

## Reproducción de errores

Cuando sea posible, se debe registrar un caso mínimo reproducible que incluya:

- precondiciones;
- pasos;
- entrada;
- resultado esperado;
- resultado obtenido;
- entorno;
- versión.

Un caso reproducible facilita tanto la corrección como la creación de una prueba de regresión.

## Correcciones

Después de corregir un problema se debe ejecutar la prueba específica que demuestra la corrección.

Cuando el problema represente una regresión, se recomienda agregar una prueba automatizada que impida su reaparición.

Las correcciones que afecten varias capas deben probarse en todas las capas relevantes.

## Regresión

Una corrección no debe validarse únicamente contra el caso que falló.

Debe comprobarse también que:

- las pruebas relacionadas continúan pasando;
- no se rompieron contratos;
- no se alteró el aislamiento de tenant;
- no se modificó involuntariamente otra funcionalidad;
- CI/CD continúa funcionando.

## Registro de incidentes

Los incidentes relevantes deben registrar:

```text
Fecha:
Versión:
Componente:
Descripción:
Impacto:
Pasos para reproducir:
Evidencia:
Causa:
Corrección:
Pruebas:
Resultado:
Acciones preventivas:
```

No se deben almacenar secretos dentro del registro.

## Documentación de soluciones

Cuando un problema sea recurrente o tenga una solución no evidente, debe incorporarse a este documento o a la documentación técnica correspondiente.

La solución documentada debe explicar el procedimiento real y no una solución hipotética.

## Mantenimiento

Este documento debe actualizarse cuando se identifiquen:

- nuevos problemas recurrentes;
- nuevas dependencias;
- cambios de arquitectura;
- nuevos comandos;
- nuevos mecanismos de diagnóstico;
- cambios en CI/CD;
- cambios de despliegue;
- nuevas integraciones.

La documentación debe mantenerse alineada con el sistema real.

## Documentación relacionada

- `docs/Arquitectura/architecture.md`
- `docs/API/api-contracts.md`
- `docs/Base de Datos/database.md`
- `docs/CI-CD/ci-cd.md`
- `docs/Despliegue/deployment.md`
- `docs/IA/ai.md`
- `docs/Observabilidad/observability.md`
- `docs/Documentación Legal/compliance.md`
- `docs/Documentación Legal/release-management.md`
- `docs/Decisiones Técnicas/technical-debt.md`
