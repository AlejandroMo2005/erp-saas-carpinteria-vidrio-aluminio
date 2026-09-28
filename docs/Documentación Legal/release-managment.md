# Gestión de Versiones y Releases

## 1. Propósito

Este documento define los criterios y procedimientos para gestionar versiones, releases y cambios publicables de la plataforma ERP/SaaS para negocios de carpintería de vidrio y aluminio.

La gestión de releases debe permitir identificar qué versión se publica, qué cambios contiene, qué validaciones fueron ejecutadas y qué componentes pueden verse afectados.

El proceso debe mantener trazabilidad entre cambios de código, pruebas, artefactos, documentación y despliegues.

## 2. Alcance

La gestión de releases contempla:

- código fuente del frontend;
- código fuente del backend;
- estructura y cambios de base de datos;
- configuración;
- dependencias;
- documentación técnica;
- pruebas automatizadas;
- artefactos de construcción;
- imágenes Docker cuando se adopte el despliegue mediante contenedores;
- workflows de CI/CD;
- cambios de seguridad;
- correcciones de errores;
- cambios funcionales;
- procedimientos de rollback.

## 3. Identificación de versiones

Cada release debe poder asociarse de forma inequívoca con una versión concreta del código fuente.

La identificación debe considerar como mínimo:

- commit asociado;
- rama de origen;
- versión publicada;
- fecha de release;
- cambios incluidos;
- resultado de las validaciones;
- artefactos generados;
- entorno de destino.

El versionado definitivo debe establecerse de manera consistente antes de automatizar las publicaciones en producción.

## 4. Relación entre Git y releases

Git constituye la fuente de trazabilidad del código.

Cada release debe poder relacionarse con:

1. commits incluidos;
2. pull requests correspondientes;
3. validaciones ejecutadas;
4. artefactos generados;
5. configuración utilizada;
6. despliegue realizado.

No se debe considerar un release únicamente como una modificación manual del servidor.

La versión desplegada debe poder determinarse posteriormente para facilitar diagnóstico, auditoría y rollback.

## 5. Convenciones de commits

Los cambios del proyecto utilizan mensajes de commit orientados a identificar la naturaleza del cambio.

Entre las categorías utilizadas se encuentran:

- `feat`: nueva funcionalidad;
- `fix`: corrección;
- `refactor`: modificación estructural sin cambio funcional intencional;
- `test`: incorporación o modificación de pruebas;
- `docs`: documentación;
- `ci`: cambios relacionados con integración o automatización;
- `chore`: tareas de mantenimiento.

Los commits relacionados con releases deben conservar una descripción suficientemente precisa para identificar el alcance del cambio.

## 6. Pull Requests

Los cambios que formen parte de un release deben pasar por el flujo de integración definido para el repositorio.

Antes de incorporar cambios se deben revisar, según corresponda:

- pruebas unitarias;
- pruebas de integración;
- pruebas E2E;
- lint;
- cobertura;
- análisis de seguridad;
- análisis estático;
- construcción del proyecto;
- compatibilidad con cambios de base de datos.

Las validaciones definitivas dependerán del estado de implementación del pipeline CI/CD.

## 7. Criterios previos a un release

Antes de publicar una versión se debe comprobar que:

- los cambios esperados están incorporados;
- no existen cambios locales no controlados que afecten al release;
- las pruebas correspondientes finalizan correctamente;
- el frontend puede construirse;
- el backend puede ejecutarse con su configuración correspondiente;
- las migraciones requeridas están identificadas;
- las variables de entorno necesarias están documentadas;
- los secretos no forman parte del repositorio;
- las modificaciones de seguridad fueron revisadas;
- la documentación afectada está actualizada;
- existe una estrategia de rollback cuando el cambio lo requiera.

No debe asumirse que una versión está lista únicamente porque las pruebas unitarias sean exitosas.

## 8. Release notes

Cada release debe registrar de forma resumida los cambios relevantes.

Las notas deben permitir identificar:

- nuevas funcionalidades;
- correcciones;
- cambios de comportamiento;
- modificaciones de seguridad;
- cambios de base de datos;
- cambios de configuración;
- cambios de dependencias;
- cambios incompatibles;
- limitaciones conocidas;
- acciones requeridas durante el despliegue.

Los cambios deben describirse de manera técnica y verificable, evitando afirmar funcionalidades que no hayan sido implementadas.

## 9. Cambios de base de datos

Los cambios de esquema requieren un tratamiento independiente del código de aplicación.

Un release que modifique MySQL debe identificar:

- tablas afectadas;
- columnas modificadas;
- índices;
- restricciones;
- triggers;
- procedimientos;
- migraciones;
- posibles incompatibilidades;
- impacto sobre datos existentes;
- estrategia de reversión.

Las migraciones potencialmente destructivas deben evaluarse antes de ser ejecutadas en producción.

Cuando una modificación no sea reversible directamente, el procedimiento de recuperación debe depender de un respaldo válido y de un plan de restauración previamente definido.

## 10. Compatibilidad entre frontend y backend

Las versiones del frontend y backend deben mantenerse compatibles.

Cuando exista un cambio de contrato de API se debe identificar:

- endpoint afectado;
- método HTTP;
- estructura de solicitud;
- estructura de respuesta;
- autenticación requerida;
- códigos de error;
- consumidores afectados;
- versión compatible.

Los cambios incompatibles no deben publicarse sin considerar el orden de despliegue necesario.

## 11. Dependencias

Los cambios de dependencias deben formar parte del control del release.

Antes de actualizar una dependencia relevante se debe comprobar:

- compatibilidad con Node.js;
- compatibilidad con el proyecto;
- impacto en pruebas;
- impacto en seguridad;
- cambios de API;
- cambios de configuración;
- tamaño o rendimiento cuando resulte relevante.

Las dependencias deben quedar registradas mediante los archivos de bloqueo correspondientes.

No se deben introducir actualizaciones automáticas destructivas como parte de un release sin revisión.

## 12. Seguridad del release

Los releases deben conservar los controles de seguridad existentes.

Entre ellos:

- gestión separada de secretos;
- variables de entorno por ambiente;
- autenticación;
- autorización;
- aislamiento por `empresa_id`;
- protección CSRF;
- CORS;
- cabeceras de seguridad;
- rate limiting;
- validación de entradas;
- protección de sesiones y tokens;
- blacklist de tokens mediante Redis;
- registro de eventos de seguridad.

Las credenciales, tokens, claves privadas y otros secretos no deben incluirse en commits, artefactos públicos ni logs.

## 13. Artefactos

Los artefactos de release deben poder relacionarse con la versión que los produjo.

Dependiendo del mecanismo de despliegue, pueden incluir:

- build del frontend;
- paquete del backend;
- reportes de pruebas;
- reportes de cobertura;
- resultados de análisis estático;
- imágenes Docker;
- documentación generada;
- archivos de configuración no sensibles.

La generación y conservación de artefactos debe integrarse progresivamente al pipeline CI/CD.

## 14. Ambientes

El release debe avanzar por ambientes controlados.

La estrategia documentada contempla:

- desarrollo;
- testing;
- staging;
- producción.

Los valores de configuración y secretos deben permanecer separados entre ambientes.

Un artefacto validado debe poder identificarse antes de promoverse al siguiente ambiente.

## 15. Despliegue

El proceso de release debe separar:

1. preparación;
2. validación;
3. construcción;
4. publicación del artefacto;
5. despliegue;
6. validación post-despliegue;
7. confirmación;
8. rollback cuando corresponda.

Los health checks deben utilizarse para verificar el estado de los servicios después del despliegue.

La documentación específica del despliegue se encuentra en `docs/Despliegue/`.

## 16. Rollback

Todo release que pueda afectar la disponibilidad o integridad de la plataforma debe tener una estrategia de reversión adecuada.

El rollback puede involucrar:

- frontend;
- backend;
- configuración;
- imagen Docker;
- dependencias;
- base de datos;
- Redis;
- infraestructura.

Los cambios de base de datos requieren especial atención porque no todos son reversibles.

El procedimiento detallado se encuentra en:

`docs/Despliegue/Recuperacion/rollback.md`

## 17. Releases con cambios críticos

Los cambios que afecten directamente a:

- autenticación;
- autorización;
- aislamiento multiempresa;
- inventario;
- proformas;
- pedidos;
- facturación;
- secuencias de comprobantes;
- integridad de datos;
- seguridad;
- persistencia;

deben recibir una validación adicional antes de producción.

El criterio de validación debe considerar el impacto funcional y técnico del cambio, no únicamente la existencia de pruebas automatizadas.

## 18. Trazabilidad

Para cada release debe ser posible reconstruir al menos la siguiente relación:

```text
Release
   ↓
Versión / commit
   ↓
Cambios incorporados
   ↓
Pruebas y análisis
   ↓
Artefacto
   ↓
Ambiente
   ↓
Despliegue
   ↓
Validación post-despliegue
