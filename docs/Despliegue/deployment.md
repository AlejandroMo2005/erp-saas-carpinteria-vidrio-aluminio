# Despliegue

## Descripción

Este documento define las consideraciones y el flujo para preparar, configurar, ejecutar y verificar el despliegue del ERP/SaaS.

El procedimiento debe mantenerse alineado con la arquitectura, el pipeline de CI/CD, la configuración de los servicios, la base de datos y los mecanismos de seguridad vigentes.

## Objetivo

Establecer un proceso reproducible para:

- preparar un entorno de despliegue;
- configurar variables de entorno;
- instalar dependencias;
- preparar la base de datos;
- ejecutar la aplicación;
- verificar los servicios;
- comprobar el estado posterior al despliegue;
- gestionar errores y recuperación.

## Alcance

Aplica a los componentes que forman parte del sistema:

- frontend React;
- backend Node.js/Express;
- MySQL;
- Redis;
- procesos administrados mediante PM2;
- servicios externos;
- configuración de seguridad;
- CI/CD;
- migraciones de base de datos.

## Arquitectura de despliegue

La aplicación está compuesta por un frontend y un backend independientes, con persistencia en MySQL y uso de Redis para funcionalidades que requieren almacenamiento temporal o coordinación.

La comunicación principal sigue el flujo:

```text
Cliente
   │
   ▼
Frontend React
   │
   │ HTTP/HTTPS
   ▼
Backend Node.js / Express
   │
   ├──────────────► MySQL
   │
   ├──────────────► Redis
   │
   └──────────────► Servicios externos
```

La configuración concreta de infraestructura puede variar según el entorno utilizado.

## Entornos

Los entornos deben mantenerse separados según su finalidad.

### Desarrollo

Se utiliza para:

- desarrollo local;
- pruebas durante la implementación;
- depuración;
- validación de cambios.

### Pruebas / CI

Se utiliza para:

- ejecución automatizada de pruebas;
- linting;
- cobertura;
- validaciones de calidad;
- comprobaciones de integración.

### Producción

Se utiliza para la operación real de la aplicación.

Las credenciales, servicios y datos de producción no deben reutilizarse en desarrollo o pruebas.

## Requisitos generales

El entorno de despliegue debe disponer de los componentes requeridos por la versión publicada.

Actualmente el proyecto utiliza Node.js `20.19.4` como versión de referencia.

Las versiones de Node.js, npm y demás herramientas deben mantenerse alineadas con las configuraciones del repositorio y del pipeline de CI/CD.

## Código fuente

La versión desplegada debe corresponder a una referencia identificable del repositorio.

Antes del despliegue se debe verificar:

- commit;
- branch o tag correspondiente;
- versión de release;
- cambios incluidos;
- estado de CI/CD.

No se debe desplegar una copia local cuyo contenido no pueda relacionarse con una referencia controlada del repositorio.

## Instalación de dependencias

La instalación debe utilizar el mecanismo reproducible definido por el proyecto.

Cuando exista `package-lock.json`, se debe utilizar:

```bash
npm ci
```

La instalación debe realizarse tanto para frontend como para backend según la estructura vigente del repositorio.

No se deben modificar automáticamente las versiones de dependencias durante un despliegue mediante comandos que actualicen el lockfile.

## Variables de entorno

Las variables de entorno deben configurarse fuera del código fuente.

El despliegue debe verificar como mínimo las variables requeridas para:

- conexión a MySQL;
- conexión a Redis;
- autenticación;
- cookies y sesiones;
- configuración del frontend;
- servicios externos;
- IA;
- facturación o servicios relacionados;
- configuración de ejecución.

Los valores reales de secretos no deben almacenarse en el repositorio.

## Secretos

Los secretos deben gestionarse mediante el mecanismo de secretos disponible en el entorno de despliegue.

No se deben incluir en:

- código fuente;
- commits;
- documentación pública;
- imágenes Docker;
- archivos de configuración versionados;
- logs.

Cuando un secreto deba rotarse, se debe evitar registrar su valor anterior o nuevo en archivos de trazabilidad.

## Base de datos

Antes de desplegar cambios que modifiquen el esquema se debe comprobar:

- migración correspondiente;
- compatibilidad con la versión anterior;
- dependencias entre tablas;
- índices;
- restricciones;
- triggers;
- procedimientos;
- cambios de datos;
- estrategia de recuperación.

El esquema actual utiliza MySQL.

La base de datos de producción debe mantenerse separada de las bases utilizadas para desarrollo y pruebas.

## Migraciones

Las migraciones deben ejecutarse de forma controlada y en el orden definido por el proyecto.

Una migración debe identificar claramente:

- versión o referencia;
- cambios realizados;
- dependencias;
- impacto;
- posibilidad de reversión;
- pasos especiales, cuando correspondan.

No se debe modificar manualmente una base de datos de producción sin registrar el cambio cuando dicho cambio forme parte del estado esperado del sistema.

## Backup

Antes de operaciones de alto impacto sobre la base de datos debe existir un mecanismo de respaldo adecuado al entorno.

El procedimiento de respaldo debe considerar:

- frecuencia;
- ubicación;
- retención;
- protección;
- recuperación;
- verificación de disponibilidad.

Un respaldo no debe considerarse válido únicamente porque el proceso de generación terminó correctamente. Cuando sea necesario, debe verificarse que pueda utilizarse para recuperación.

## Backend

El backend se ejecuta sobre Node.js y Express.

La aplicación debe iniciar con las variables de entorno y dependencias requeridas.

El backend debe exponer mecanismos de verificación de salud para comprobar el estado de la aplicación y sus dependencias críticas.

El endpoint de health check debe utilizarse como parte de la validación posterior al despliegue cuando esté disponible.

## Frontend

El frontend utiliza React y Vite.

Las variables de configuración del frontend deben definirse antes del proceso de construcción.

La URL base de la API debe corresponder al entorno desplegado.

La configuración actual utiliza:

```text
VITE_API_URL
```

Cuando esta variable no está definida, la aplicación utiliza `/api` como referencia para las llamadas al backend.

## Comunicación frontend-backend

El frontend y backend deben comunicarse mediante el contrato de API documentado.

En producción se debe utilizar HTTPS para proteger la comunicación entre el cliente y los servicios cuando la infraestructura lo permita y requiera.

Las cookies de sesión deben mantener las propiedades de seguridad correspondientes al entorno.

## Redis

Redis se utiliza como componente de infraestructura para funcionalidades que requieren almacenamiento temporal y coordinación.

Antes del despliegue se debe verificar:

- disponibilidad;
- conectividad;
- credenciales, cuando correspondan;
- configuración de expiración;
- compatibilidad con la versión utilizada.

Una indisponibilidad de Redis debe manejarse según el impacto que tenga sobre cada funcionalidad.

## PM2

El backend puede ejecutarse mediante PM2 para administración del proceso.

La configuración debe contemplar los parámetros definidos para el entorno, incluyendo cuando corresponda:

- modo de ejecución;
- número de procesos;
- reinicio automático;
- límites de memoria;
- variables de entorno;
- logs.

La configuración de PM2 no debe utilizarse para ocultar errores de aplicación que requieran corrección.

## Seguridad del despliegue

El entorno debe revisar como mínimo:

- HTTPS;
- headers de seguridad;
- CSP;
- HSTS;
- cookies seguras;
- protección CSRF;
- gestión de tokens;
- secretos;
- permisos;
- exposición de puertos;
- logs;
- acceso a servicios internos.

Las configuraciones de desarrollo no deben trasladarse automáticamente a producción.

## Logs

Los logs deben permitir diagnosticar problemas sin exponer información sensible.

No se deben registrar:

- contraseñas;
- tokens;
- secretos;
- credenciales;
- información sensible innecesaria.

Los logs de producción deben mantenerse bajo una política de retención adecuada al entorno y a los requisitos operativos.

## Servicios externos

Antes de desplegar una versión que dependa de servicios externos se debe comprobar:

- credenciales;
- conectividad;
- endpoints;
- límites;
- timeouts;
- comportamiento ante errores;
- configuración específica del entorno.

Las integraciones de IA deben disponer de las variables de entorno y credenciales necesarias sin exponerlas en el código.

## Proceso de despliegue

El flujo general es:

```text
Preparar release
      ↓
Verificar CI/CD
      ↓
Seleccionar versión
      ↓
Preparar variables de entorno
      ↓
Preparar dependencias
      ↓
Preparar base de datos
      ↓
Ejecutar migraciones
      ↓
Construir frontend
      ↓
Iniciar backend
      ↓
Verificar servicios
      ↓
Ejecutar smoke tests
      ↓
Verificar logs
      ↓
Confirmar disponibilidad
```

El orden exacto puede adaptarse al entorno y a las dependencias de cada release.

## Verificaciones previas

Antes del despliegue:

```text
[ ] La versión fue identificada.
[ ] CI/CD finalizó correctamente.
[ ] Las pruebas requeridas pasan.
[ ] Las variables de entorno están preparadas.
[ ] Los secretos están disponibles mediante el mecanismo correspondiente.
[ ] Las migraciones fueron revisadas.
[ ] Existe respaldo cuando el cambio lo requiere.
[ ] Las dependencias externas están disponibles.
[ ] La documentación fue actualizada.
[ ] La estrategia de recuperación fue revisada.
```

## Verificaciones posteriores

Después del despliegue:

```text
[ ] Frontend disponible.
[ ] Backend disponible.
[ ] Health check correcto.
[ ] Conexión con MySQL verificada.
[ ] Conexión con Redis verificada cuando aplica.
[ ] Autenticación verificada.
[ ] Endpoints críticos verificados.
[ ] Operaciones principales verificadas.
[ ] Logs revisados.
[ ] No existen errores críticos inesperados.
```

## Smoke tests

Los smoke tests deben comprobar que las funciones esenciales continúan disponibles después del despliegue.

El conjunto exacto depende del alcance de la release, pero puede incluir:

- acceso a la aplicación;
- autenticación;
- consulta de información;
- creación o consulta de proformas;
- operaciones relacionadas con inventario;
- acceso a endpoints críticos;
- conexión con servicios requeridos.

Los smoke tests no sustituyen las pruebas automatizadas ejecutadas antes del despliegue.

## Rollback

Cuando una release presente un problema crítico, se debe aplicar la estrategia de recuperación definida para esa versión.

Dependiendo del cambio, puede incluir:

- volver a la versión anterior;
- restaurar configuración;
- reiniciar servicios;
- desactivar temporalmente una funcionalidad;
- restaurar la base de datos;
- aplicar una corrección urgente.

Los cambios de base de datos deben evaluarse especialmente antes de ejecutar un rollback, debido a que una reversión del código puede no ser compatible con un esquema ya modificado.

## Fallos durante el despliegue

Si el despliegue falla, se debe registrar:

- versión;
- componente afectado;
- etapa en la que ocurrió;
- mensaje de error;
- logs relevantes;
- acción aplicada;
- resultado.

No se deben eliminar evidencias necesarias para determinar la causa del fallo.

## Recuperación

La recuperación debe priorizar:

1. proteger la integridad de los datos;
2. restablecer la disponibilidad;
3. identificar el componente afectado;
4. evitar que el mismo cambio vuelva a introducir el problema;
5. documentar la causa y la solución.

Cuando un incidente requiera una nueva release, esta debe seguir el proceso de gestión de releases.

## Docker

El proyecto contempla Docker como parte de la estrategia de reproducibilidad e infraestructura, pero los archivos de Docker deben considerarse parte del estado real del repositorio únicamente cuando hayan sido incorporados.

Cuando se introduzcan Dockerfiles o Docker Compose, deberán documentarse:

- imágenes utilizadas;
- versiones;
- variables de entorno;
- puertos;
- volúmenes;
- redes;
- dependencias;
- health checks;
- estrategia de persistencia;
- procedimiento de actualización.

No se debe documentar como disponible una infraestructura que todavía no forme parte del repositorio.

## CI/CD y despliegue

El pipeline de CI/CD debe encargarse de validar la versión antes de su despliegue.

Las verificaciones documentadas en:

`docs/CI-CD/ci-cd.md`

deben mantenerse alineadas con las verificaciones reales del pipeline.

La automatización no debe sustituir las decisiones necesarias sobre migraciones, configuración, recuperación o impacto operativo.

## Monitoreo posterior

Después de una release se deben observar:

- disponibilidad;
- errores HTTP;
- errores de aplicación;
- uso de memoria;
- reinicios de procesos;
- conectividad con dependencias;
- comportamiento de operaciones críticas.

Los detalles de observabilidad se encuentran en:

`docs/Observabilidad/observability.md`

## Cumplimiento y seguridad

El despliegue debe considerar los requisitos de seguridad y tratamiento de información definidos en:

`docs/Documentación Legal/compliance.md`

La documentación de despliegue no constituye por sí misma una certificación legal o de cumplimiento.

Los requisitos regulatorios específicos deben verificarse según el entorno y normativa aplicable.

## Evidencia de despliegue

Cuando sea posible, se debe conservar:

- versión desplegada;
- commit;
- fecha y hora;
- resultado de CI/CD;
- migraciones ejecutadas;
- resultado de health checks;
- smoke tests;
- incidencias;
- acciones de recuperación.

La evidencia debe permitir relacionar el entorno desplegado con la versión validada.

## Mantenimiento

Este documento debe actualizarse cuando cambien:

- la infraestructura;
- el proceso de CI/CD;
- el procedimiento de despliegue;
- la arquitectura;
- las variables de entorno;
- la estrategia de base de datos;
- Redis;
- PM2;
- Docker;
- los servicios externos;
- los mecanismos de seguridad.

La documentación debe representar el proceso realmente utilizado.

## Documentación relacionada

- `docs/Arquitectura/architecture.md`
- `docs/API/api-contracts.md`
- `docs/Base de Datos/database.md`
- `docs/Base de Datos/Migraciones/migraciones.md`
- `docs/CI-CD/ci-cd.md`
- `docs/Documentación Legal/compliance.md`
- `docs/Documentación Legal/release-management.md`
- `docs/Observabilidad/observability.md`
- `docs/Solucion de Problemas/troubleshooting.md`
- `docs/Decisiones Técnicas/decisions.md`
