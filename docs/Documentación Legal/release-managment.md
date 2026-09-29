# Gestión de releases

## Descripción

Este documento define las prácticas para preparar, verificar, documentar y publicar versiones del ERP/SaaS. Su objetivo es mantener trazabilidad sobre los cambios y reducir el riesgo de introducir regresiones durante la integración o el despliegue.

## Objetivo

Establecer un proceso controlado para:

- preparar releases;
- verificar cambios;
- identificar la versión;
- revisar dependencias;
- ejecutar pruebas;
- validar documentación;
- registrar cambios relevantes;
- gestionar incidencias posteriores a una release;
- conservar evidencia del proceso.

## Alcance

Aplica a releases que involucren:

- frontend;
- backend;
- base de datos;
- API;
- configuración;
- infraestructura;
- CI/CD;
- integraciones externas;
- servicios de IA;
- documentación asociada.

## Principios

La gestión de releases debe seguir estos principios:

- trazabilidad entre cambios, commits y versión;
- reproducibilidad del proceso;
- validación automatizada;
- cambios controlados;
- documentación actualizada;
- separación entre desarrollo y producción;
- capacidad de identificar y revertir cambios cuando sea técnicamente posible.

Una release no debe considerarse lista únicamente porque el código compile.

## Flujo general

El flujo recomendado es:

```text
Cambios integrados
        ↓
Revisión del estado del repositorio
        ↓
Validación de CI/CD
        ↓
Pruebas
        ↓
Revisión de seguridad y calidad
        ↓
Revisión de base de datos/API
        ↓
Actualización de documentación
        ↓
Preparación de release
        ↓
Identificación de versión
        ↓
Registro de cambios
        ↓
Despliegue
        ↓
Verificación posterior
        ↓
Registro de evidencia
```

## Criterios previos

Antes de preparar una release se debe comprobar:

- que los cambios previstos estén integrados;
- que no existan cambios locales no controlados que formen parte accidentalmente de la release;
- que CI/CD haya ejecutado las verificaciones requeridas;
- que las pruebas relevantes hayan pasado;
- que no existan bloqueos conocidos sin una decisión explícita;
- que la documentación afectada esté actualizada;
- que las variables de entorno requeridas estén identificadas;
- que los cambios de base de datos estén preparados;
- que los cambios de API sean compatibles con sus consumidores.

## Versionado

Las versiones deben utilizar una estrategia consistente y documentada.

Cuando el proyecto utilice Semantic Versioning, el formato será:

```text
MAJOR.MINOR.PATCH
```

De forma general:

- `MAJOR`: cambios incompatibles con versiones anteriores;
- `MINOR`: funcionalidades compatibles nuevas;
- `PATCH`: correcciones compatibles.

La clasificación debe considerar el impacto real del cambio sobre los consumidores y no únicamente el tamaño del commit.

## Cambios incompatibles

Antes de publicar un cambio incompatible se debe identificar:

- endpoints afectados;
- consumidores afectados;
- cambios de esquema;
- cambios de configuración;
- cambios de autenticación;
- cambios de comportamiento;
- estrategia de migración;
- necesidad de compatibilidad temporal.

Los cambios incompatibles deben documentarse explícitamente en las notas de release.

## Preparación de la release

La preparación debe incluir una revisión del conjunto de cambios desde la versión anterior.

Se deben identificar:

- nuevas funcionalidades;
- correcciones;
- refactorizaciones relevantes;
- cambios de seguridad;
- cambios de base de datos;
- cambios de API;
- cambios de configuración;
- cambios de dependencias;
- cambios de infraestructura;
- cambios documentales.

Los cambios que no tengan impacto funcional directo también deben registrarse cuando puedan afectar operación, seguridad o mantenimiento.

## Pruebas de release

Las pruebas deben corresponder al alcance del cambio.

Pueden incluir:

- pruebas unitarias;
- pruebas de integración;
- pruebas de API;
- pruebas E2E;
- pruebas de rendimiento;
- pruebas de concurrencia;
- pruebas de seguridad;
- validaciones de base de datos.

Las pruebas ejecutadas y su resultado deben quedar disponibles como evidencia del proceso.

## Calidad y seguridad

Antes de una release se deben revisar las verificaciones de calidad disponibles en CI/CD.

Cuando corresponda, deben considerarse:

- ESLint;
- cobertura;
- análisis estático;
- análisis de dependencias;
- DAST;
- pruebas de seguridad;
- resultados de SonarCloud;
- vulnerabilidades conocidas;
- configuración de seguridad.

Un resultado no bloqueante no debe interpretarse automáticamente como ausencia de riesgo. Las decisiones sobre aceptación de riesgos deben quedar registradas cuando sean relevantes.

## Cambios de base de datos

Las releases que incluyan modificaciones de base de datos deben identificar:

- tablas afectadas;
- columnas afectadas;
- índices;
- restricciones;
- triggers;
- procedimientos;
- migraciones;
- compatibilidad con la versión anterior;
- necesidad de datos de transición.

Las migraciones deben ejecutarse mediante un procedimiento controlado.

Cuando un cambio no sea reversible automáticamente, la estrategia de recuperación debe definirse antes del despliegue.

## Cambios de API

Una release que modifique la API debe verificar:

- endpoints nuevos;
- endpoints modificados;
- endpoints eliminados;
- parámetros;
- esquemas de entrada;
- respuestas;
- códigos de error;
- autenticación;
- autorización;
- compatibilidad con frontend y otros consumidores.

Los cambios relevantes deben reflejarse en `docs/API/api-contracts.md`.

## Variables de entorno

Antes de publicar una release se debe verificar si se agregaron, eliminaron o modificaron variables de entorno.

La documentación debe identificar:

- nombre de la variable;
- finalidad;
- si es obligatoria;
- entorno en el que se utiliza;
- dependencia externa relacionada.

Nunca se deben incluir valores reales de secretos en la documentación, commits o artefactos públicos.

## Dependencias

Las actualizaciones de dependencias deben revisarse antes de una release.

La revisión debe considerar:

- cambios incompatibles;
- vulnerabilidades;
- licencias;
- impacto en el tamaño de la aplicación;
- compatibilidad con Node.js;
- impacto sobre frontend y backend;
- resultados de las pruebas.

No se debe actualizar una dependencia crítica automáticamente durante una release sin revisar sus posibles efectos.

## Notas de release

Cada release debe disponer de un registro de cambios suficientemente claro para identificar qué se modificó.

Una estructura posible es:

```markdown
# Release X.Y.Z

## Nuevas funcionalidades

- ...

## Correcciones

- ...

## Seguridad

- ...

## Base de datos

- ...

## API

- ...

## Infraestructura

- ...

## Documentación

- ...

## Cambios incompatibles

- ...

## Migraciones requeridas

- ...

## Verificaciones

- ...

## Observaciones

- ...
```

Las notas deben describir cambios reales. No se deben registrar funcionalidades que no hayan sido incorporadas.

## Evidencia

Cuando sea posible, una release debe conservar evidencia de:

- commit o referencia de versión;
- ejecución de CI/CD;
- pruebas;
- análisis de calidad;
- análisis de seguridad;
- migraciones;
- artefactos generados;
- notas de release;
- resultado de la verificación posterior al despliegue.

La evidencia debe permitir reconstruir qué versión fue evaluada y publicada.

## Despliegue

El despliegue debe seguir el procedimiento definido en:

`docs/Despliegue/deployment.md`

Antes del despliegue se debe confirmar que la versión preparada corresponde a la versión que será desplegada.

Cuando existan migraciones de base de datos, estas deben ejecutarse en el orden definido por el procedimiento de despliegue.

## Verificación posterior

Después del despliegue se debe verificar como mínimo:

- disponibilidad de la aplicación;
- estado del backend;
- conectividad con dependencias críticas;
- autenticación;
- endpoints críticos;
- acceso a base de datos;
- operaciones principales;
- logs relevantes;
- errores inesperados.

Cuando el sistema disponga de health checks, estos deben utilizarse como parte de la verificación.

## Rollback

Debe existir una estrategia de recuperación para releases que presenten problemas críticos.

La estrategia puede incluir:

- restauración de la versión anterior;
- reversión de código;
- restauración de configuración;
- procedimiento específico para base de datos;
- desactivación temporal de una funcionalidad;
- corrección urgente mediante una nueva release.

No se debe asumir que una migración de base de datos puede revertirse automáticamente.

Los cambios irreversibles deben identificarse antes del despliegue.

## Hotfix

Un hotfix debe utilizarse para corregir problemas que requieran una liberación independiente del ciclo normal.

El proceso debe mantener:

- alcance reducido;
- pruebas específicas;
- revisión;
- trazabilidad;
- registro de la causa;
- integración posterior con la línea principal cuando corresponda.

El hotfix no debe utilizarse como mecanismo habitual para evitar las verificaciones normales.

## Incidentes posteriores a una release

Cuando una release provoque un incidente, se debe registrar:

- versión afectada;
- fecha y hora;
- componente afectado;
- síntoma;
- impacto;
- causa identificada, cuando sea conocida;
- acción aplicada;
- resultado;
- seguimiento requerido.

Los incidentes relevantes deben alimentar las decisiones de mantenimiento y deuda técnica.

## Release y documentación

Una release debe mantener alineados:

- código;
- configuración;
- API;
- base de datos;
- arquitectura;
- seguridad;
- CI/CD;
- despliegue;
- notas de release.

Si una release modifica una de estas áreas, la documentación correspondiente debe revisarse.

## Release y cumplimiento

Las releases que afecten datos personales, facturación, auditoría, autenticación o seguridad deben considerar los requisitos documentados en:

`docs/Documentación Legal/compliance.md`

La existencia de un proceso de release no constituye por sí misma una certificación de cumplimiento legal.

Los requisitos regulatorios específicos deben validarse conforme al contexto y normativa aplicable.

## Responsabilidades

La preparación de una release debe tener responsables identificables para:

- revisión técnica;
- validación de pruebas;
- revisión de seguridad cuando corresponda;
- cambios de base de datos;
- despliegue;
- verificación posterior;
- documentación.

Las responsabilidades concretas pueden variar según el tamaño del equipo y el entorno de despliegue.

## Checklist de release

```text
[ ] Los cambios incluidos fueron identificados.
[ ] El repositorio se encuentra en el estado esperado.
[ ] CI/CD pasó las verificaciones requeridas.
[ ] Las pruebas relevantes pasan.
[ ] Se revisaron cambios de seguridad.
[ ] Se revisaron dependencias.
[ ] Se revisaron cambios de API.
[ ] Se revisaron cambios de base de datos.
[ ] Las migraciones requeridas están preparadas.
[ ] Las variables de entorno fueron verificadas.
[ ] La documentación afectada está actualizada.
[ ] La versión fue identificada.
[ ] Las notas de release fueron preparadas.
[ ] La estrategia de rollback fue revisada cuando aplica.
[ ] Se realizó el despliegue siguiendo el procedimiento correspondiente.
[ ] Se ejecutaron verificaciones posteriores.
[ ] Se conservó la evidencia disponible.
```

## Mantenimiento del proceso

Este documento debe actualizarse cuando cambien:

- la estrategia de versionado;
- el pipeline de CI/CD;
- el procedimiento de despliegue;
- la estrategia de migraciones;
- las herramientas de calidad;
- las herramientas de seguridad;
- la arquitectura;
- la estrategia de recuperación.

Los cambios deben reflejar el procedimiento realmente utilizado por el proyecto.

## Documentación relacionada

- `docs/Arquitectura/architecture.md`
- `docs/API/api-contracts.md`
- `docs/Base de Datos/database.md`
- `docs/CI-CD/ci-cd.md`
- `docs/Documentación Legal/compliance.md`
- `docs/Documentación Legal/contributing.md`
- `docs/Despliegue/deployment.md`
- `docs/Observabilidad/observability.md`
- `docs/Solucion de Problemas/troubleshooting.md`
- `docs/Decisiones Técnicas/decisions.md`
- `docs/Decisiones Técnicas/technical-debt.md`
