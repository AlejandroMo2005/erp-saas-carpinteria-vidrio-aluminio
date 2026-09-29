# Guía de contribución

## Descripción

Este documento establece las reglas y prácticas para contribuir al desarrollo del ERP/SaaS de gestión para negocios de carpintería de vidrio y aluminio. Su objetivo es mantener consistencia en el código, facilitar la revisión de cambios, reducir regresiones y conservar la trazabilidad del proyecto.

## Objetivo

Definir un flujo de contribución que contemple:

- organización del trabajo;
- estructura y convenciones del repositorio;
- desarrollo de funcionalidades y correcciones;
- pruebas;
- linting y calidad de código;
- seguridad;
- documentación;
- revisión de cambios;
- commits;
- Pull Requests;
- integración con CI/CD.

## Alcance

Aplica a los cambios realizados en:

- frontend;
- backend;
- base de datos;
- pruebas automatizadas;
- configuración;
- workflows de CI/CD;
- documentación;
- infraestructura y despliegue;
- integraciones externas;
- componentes relacionados con IA.

## Requisitos previos

Antes de contribuir se debe conocer, como mínimo:

- la arquitectura general del sistema;
- la separación entre frontend y backend;
- la estructura modular del backend;
- el flujo de autenticación y sesiones;
- el modelo de multi-tenancy;
- las reglas de validación;
- las convenciones de pruebas;
- el flujo de CI/CD.

Las referencias principales se encuentran en:

- `docs/Arquitectura/architecture.md`
- `docs/API/api-contracts.md`
- `docs/Base de Datos/database.md`
- `docs/CI-CD/ci-cd.md`
- `docs/Documentación Legal/compliance.md`

## Organización del repositorio

Los cambios deben respetar la estructura existente del proyecto.

El frontend mantiene su código dentro de la estructura correspondiente a la aplicación React.

El backend utiliza una arquitectura modular basada principalmente en:

```text
backend/
└── src/
    ├── modules/
    └── shared/
```

Los cambios nuevos deben utilizar las ubicaciones arquitectónicas vigentes en lugar de introducir nuevamente archivos en estructuras legacy.

Cuando un cambio requiera modificar código legacy, primero se debe verificar si existe una implementación equivalente en la arquitectura actual y si el componente legacy todavía tiene consumidores.

## Flujo de contribución

El flujo general es:

```text
Identificar necesidad
        ↓
Revisar arquitectura existente
        ↓
Determinar impacto
        ↓
Modificar código
        ↓
Agregar o actualizar pruebas
        ↓
Ejecutar lint
        ↓
Ejecutar pruebas
        ↓
Revisar cambios
        ↓
Documentar cuando corresponda
        ↓
Commit
        ↓
Pull Request
        ↓
CI/CD
        ↓
Revisión
        ↓
Integración
```

No se debe considerar terminado un cambio únicamente porque la aplicación compile o una prueba específica sea exitosa.

## Desarrollo de funcionalidades

Antes de agregar una funcionalidad se debe revisar si ya existe:

- un módulo equivalente;
- un servicio reutilizable;
- un validador;
- un middleware;
- un componente;
- una utilidad;
- un contrato de API;
- una prueba relacionada.

La reutilización debe priorizarse sobre la duplicación de lógica.

Los cambios deben mantener la separación de responsabilidades entre presentación, lógica de aplicación, acceso a datos e infraestructura.

## Backend

Los nuevos módulos backend deben seguir la arquitectura modular vigente.

Cuando corresponda, las responsabilidades deben separarse entre:

- controladores o handlers;
- servicios;
- repositorios;
- validadores;
- middleware;
- utilidades compartidas.

Las operaciones que acceden a datos de una empresa deben respetar el aislamiento mediante `empresa_id` y el contexto de tenant correspondiente.

No se debe introducir una consulta que permita acceder a registros de otra empresa por omitir el filtro de tenant cuando dicho aislamiento sea requerido.

Las entradas externas deben validarse antes de utilizarse en la lógica de negocio o persistencia.

## Frontend

Los cambios del frontend deben respetar la separación existente entre:

- componentes de presentación;
- hooks;
- servicios de API;
- estado;
- utilidades;
- rutas;
- configuración.

Los componentes nuevos deben reutilizar componentes y utilidades existentes cuando sean adecuados.

Las llamadas al backend deben respetar los contratos documentados en `docs/API/api-contracts.md`.

Los cambios que modifiquen contratos de API deben considerar simultáneamente el frontend, backend y las pruebas afectadas.

## Base de datos

Los cambios relacionados con la base de datos deben analizar:

- tablas;
- columnas;
- claves primarias;
- claves foráneas;
- restricciones;
- índices;
- triggers;
- procedimientos;
- relaciones;
- multi-tenancy;
- concurrencia;
- migraciones.

No se debe modificar directamente el esquema de producción sin un mecanismo de cambio controlado y documentado.

Las modificaciones estructurales deben reflejarse en la documentación correspondiente cuando alteren el modelo actual.

## Pruebas

Todo cambio que modifique comportamiento debe considerar las pruebas automatizadas correspondientes.

Dependiendo del alcance, pueden ser necesarias:

- pruebas unitarias;
- pruebas de integración;
- pruebas de API;
- pruebas de concurrencia;
- pruebas E2E;
- pruebas de rendimiento;
- pruebas de seguridad.

Las pruebas deben verificar comportamiento observable y casos relevantes, no únicamente incrementar métricas de cobertura.

Los cambios de lógica de negocio deben incluir casos normales y casos de error cuando corresponda.

## Linting y calidad

Antes de crear un Pull Request se debe ejecutar el linting disponible para el área modificada.

Actualmente el proyecto utiliza ESLint para revisar problemas de calidad y consistencia del código.

Los warnings o errores no deben ocultarse mediante desactivaciones indiscriminadas.

Si una regla necesita desactivarse de manera excepcional, la decisión debe estar justificada y limitarse al alcance necesario.

## Seguridad

Toda contribución debe considerar el impacto sobre:

- autenticación;
- autorización;
- sesiones;
- tokens;
- cookies;
- CSRF;
- validación de entradas;
- multi-tenancy;
- exposición de información;
- logs;
- secretos;
- dependencias;
- servicios externos.

No se deben incluir en el repositorio:

- contraseñas;
- tokens reales;
- claves privadas;
- credenciales;
- API keys reales;
- archivos `.env` con secretos.

Las credenciales de prueba deben mantenerse separadas de las credenciales utilizadas fuera del entorno de desarrollo.

## Integraciones externas

Los cambios que incorporen o modifiquen integraciones externas deben documentar, cuando corresponda:

- servicio utilizado;
- finalidad;
- configuración requerida;
- variables de entorno;
- manejo de errores;
- timeouts;
- límites;
- comportamiento ante indisponibilidad;
- impacto sobre la aplicación.

Las dependencias externas no deben considerarse disponibles permanentemente. El código debe contemplar los errores que puedan producirse cuando un servicio externo no responda correctamente.

## Inteligencia artificial

Los cambios relacionados con los servicios de IA deben considerar:

- proveedor;
- modelo;
- entrada enviada;
- salida esperada;
- manejo de errores;
- timeouts;
- límites de contenido;
- almacenamiento de resultados;
- trazabilidad;
- costos asociados cuando corresponda.

No se deben introducir credenciales de proveedores de IA directamente en el código.

## Commits

Los commits deben describir de forma clara el propósito principal del cambio.

Se recomienda utilizar una convención basada en categorías como:

```text
feat
fix
refactor
test
docs
chore
ci
perf
security
```

Ejemplos:

```text
feat(api): agregar validación de materiales
fix(auth): corregir invalidación de sesiones
test(proforma): cubrir cálculo de totales
docs(api): actualizar contratos de endpoints
refactor(usuarios): migrar servicio a arquitectura modular
ci(test): ajustar ejecución de cobertura
```

Un commit debe mantener un alcance coherente. Cuando sea posible, se deben evitar commits que mezclen cambios funcionales no relacionados, refactorizaciones extensas y modificaciones documentales independientes.

## Pull Requests

Un Pull Request debe permitir identificar:

- qué se modificó;
- por qué se modificó;
- qué componentes fueron afectados;
- qué pruebas se ejecutaron;
- si hubo cambios de base de datos;
- si hubo cambios de API;
- si existe impacto de seguridad;
- si existe impacto de configuración o despliegue.

Cuando el cambio modifique un contrato existente, se debe indicar el impacto sobre los consumidores correspondientes.

Cuando una modificación dependa de una decisión arquitectónica, debe referenciarse la documentación o decisión técnica relacionada.

## Revisión de código

La revisión debe comprobar como mínimo:

- corrección funcional;
- coherencia arquitectónica;
- validación de entradas;
- aislamiento multi-tenant;
- manejo de errores;
- seguridad;
- pruebas;
- mantenibilidad;
- ausencia de duplicación innecesaria;
- impacto sobre componentes existentes.

La revisión no debe limitarse a comprobar que el código compile.

## CI/CD

Los Pull Requests deben pasar las verificaciones automatizadas configuradas por el proyecto.

El pipeline debe utilizar las mismas versiones y condiciones documentadas para reducir diferencias entre desarrollo y CI.

Las verificaciones pueden incluir:

- instalación reproducible de dependencias;
- lint;
- pruebas;
- cobertura;
- análisis de calidad;
- validaciones adicionales según el flujo vigente.

Un cambio que falle una verificación obligatoria debe ser revisado antes de integrarse.

## Documentación

Los cambios deben actualizar la documentación cuando modifiquen de manera relevante:

- arquitectura;
- API;
- base de datos;
- seguridad;
- configuración;
- despliegue;
- CI/CD;
- integraciones;
- decisiones técnicas;
- procedimientos operativos.

La documentación debe describir el estado real del sistema. No se deben documentar funcionalidades como existentes si todavía no forman parte del código actual.

## Cambios legacy

El código legacy debe tratarse con precaución.

Antes de eliminar o reemplazar un componente se debe:

1. identificar sus consumidores;
2. determinar si existe una implementación equivalente;
3. migrar los consumidores necesarios;
4. ejecutar las pruebas afectadas;
5. verificar lint y CI;
6. eliminar el código únicamente cuando ya no sea necesario;
7. revisar el impacto sobre documentación y análisis de calidad.

No se debe eliminar código únicamente porque parezca duplicado sin comprobar sus referencias.

## Dependencias

Las nuevas dependencias deben incorporarse únicamente cuando exista una necesidad técnica justificada.

Antes de agregarlas se debe considerar:

- funcionalidad aportada;
- compatibilidad con la arquitectura;
- mantenimiento;
- tamaño;
- seguridad;
- licencia;
- impacto en CI/CD;
- alternativas existentes.

Las actualizaciones de dependencias deben probar las áreas afectadas.

## Variables de entorno

Las variables requeridas por el sistema deben documentarse sin incluir valores secretos.

Cuando una nueva variable sea obligatoria, se debe actualizar la documentación de configuración correspondiente y, cuando aplique, los ejemplos de entorno utilizados para desarrollo o pruebas.

Los nombres de las variables deben mantenerse consistentes entre código, CI/CD y documentación.

## Cambios que requieren revisión adicional

Se debe realizar una revisión más amplia cuando un cambio afecte:

- autenticación;
- autorización;
- multi-tenancy;
- facturación;
- datos personales;
- esquema de base de datos;
- contratos de API;
- tokens o sesiones;
- servicios externos;
- IA;
- configuración de producción;
- pipelines de CI/CD.

## Checklist previo al Pull Request

```text
[ ] El cambio tiene un alcance definido.
[ ] Se revisó la arquitectura existente.
[ ] Se evitó duplicar funcionalidad existente.
[ ] Se actualizaron las pruebas necesarias.
[ ] Las pruebas relevantes pasan.
[ ] El lint pasa en el área modificada.
[ ] Se revisaron aspectos de seguridad.
[ ] Se verificó el aislamiento multi-tenant cuando aplica.
[ ] Se revisaron cambios de base de datos cuando aplica.
[ ] Se revisaron cambios de API cuando aplica.
[ ] Se actualizaron los documentos afectados.
[ ] No se incluyeron secretos.
[ ] El commit describe correctamente el cambio.
[ ] El Pull Request explica el alcance y las verificaciones realizadas.
```

## Mantenimiento de esta guía

Esta guía debe actualizarse cuando cambien de manera relevante:

- la arquitectura;
- el flujo de CI/CD;
- las convenciones de desarrollo;
- las herramientas de calidad;
- los requisitos de seguridad;
- la estrategia de pruebas;
- la organización del repositorio.

Los cambios deben mantenerse alineados con el estado real del proyecto.

## Documentación relacionada

- `docs/Arquitectura/architecture.md`
- `docs/API/api-contracts.md`
- `docs/Base de Datos/database.md`
- `docs/CI-CD/ci-cd.md`
- `docs/Documentación Legal/compliance.md`
- `docs/Documentación Legal/release-management.md`
- `docs/Decisiones Técnicas/decisions.md`
- `docs/Decisiones Técnicas/technical-debt.md`

## Estado del documento

Este documento describe las prácticas de contribución del proyecto y debe mantenerse conforme evolucione la arquitectura y el proceso de desarrollo.
