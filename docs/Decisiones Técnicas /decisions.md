# Decisiones arquitectónicas

## Descripción

Este documento registra las decisiones arquitectónicas y técnicas relevantes que afectan la estructura, evolución y operación del sistema ERP/SaaS.

Las decisiones se documentan para conservar su contexto, las alternativas consideradas y las consecuencias asociadas.

## Objetivo

Mantener un registro trazable de las decisiones que condicionan la arquitectura y evolución del sistema.

El documento permite conocer no solamente qué decisión fue adoptada, sino también el problema que la originó, las alternativas consideradas y sus consecuencias.

## Alcance

El registro comprende decisiones relacionadas con:

- Arquitectura del sistema.
- Organización modular.
- Backend y frontend.
- Base de datos.
- Multi-tenancy.
- Autenticación y seguridad.
- Persistencia y Redis.
- Testing.
- CI/CD.
- Docker.
- Migración de arquitectura legacy.
- Inteligencia artificial.
- Rendimiento.
- Documentación.

## Criterios para tomar decisiones

Las decisiones técnicas deben considerar:

- Requisitos funcionales y no funcionales.
- Seguridad.
- Integridad de los datos.
- Mantenibilidad.
- Testabilidad.
- Rendimiento.
- Escalabilidad.
- Reproducibilidad.
- Compatibilidad con la arquitectura existente.
- Complejidad operativa.
- Evidencia obtenida mediante pruebas y validaciones.

## Registro de decisiones

### ADR-001

#### Título

Estructuración modular del backend.

#### Fecha

Pendiente de registrar.

#### Estado

Aceptada.

#### Contexto

El backend evolucionó desde una organización con componentes distribuidos en directorios legacy hacia una estructura modular bajo `src/modules` y componentes compartidos bajo `src/shared`.

#### Problema

La coexistencia de componentes legacy y componentes de la arquitectura modular incrementa la duplicación y dificulta determinar cuál implementación constituye la fuente de verdad.

#### Opciones consideradas

- Mantener indefinidamente la estructura anterior.
- Migrar progresivamente hacia una arquitectura modular.
- Eliminar componentes legacy sin migrar previamente sus consumidores.

#### Decisión

Adoptar progresivamente la estructura modular bajo `src/modules` y `src/shared`, manteniendo temporalmente componentes legacy únicamente mientras existan consumidores que dependan de ellos.

#### Justificación

La migración progresiva permite reducir el riesgo de regresiones y validar cada cambio mediante las pruebas automatizadas existentes.

#### Consecuencias

- Se requiere migrar consumidores de componentes legacy.
- Puede existir duplicación temporal durante la transición.
- Las pruebas deben ejecutarse después de cada migración relevante.
- La eliminación de código legacy debe realizarse únicamente después de verificar que no existan consumidores.

#### Alternativas descartadas

La eliminación indiscriminada de componentes legacy se descarta debido al riesgo de romper dependencias existentes.

---

## Arquitectura

### Decisiones sobre estructura modular

El backend utiliza una estructura modular bajo `src/modules`, complementada por componentes compartidos bajo `src/shared`.

La migración hacia esta estructura se realiza progresivamente.

### Decisiones sobre separación de responsabilidades

Las responsabilidades se separan entre módulos funcionales, componentes compartidos, middleware, validadores, servicios y repositorios.

La separación busca reducir el acoplamiento y facilitar las pruebas y mantenimiento.

### Decisiones sobre módulos

Los módulos representan áreas funcionales del sistema y deben mantener sus responsabilidades delimitadas.

### Decisiones sobre componentes compartidos

Las funcionalidades reutilizables se ubican en `src/shared` cuando su responsabilidad no pertenece exclusivamente a un módulo funcional.

## Backend

### Controllers y handlers

Los controladores y handlers gestionan la entrada de solicitudes y coordinan la ejecución de las operaciones correspondientes.

La lógica de negocio debe mantenerse fuera de los puntos de entrada cuando pueda ser reutilizada o probada independientemente.

### Services

Los servicios concentran operaciones de negocio o integraciones que requieren una responsabilidad independiente de la capa HTTP.

### Repositories

Los repositorios encapsulan operaciones relacionadas con la persistencia cuando la responsabilidad requiere separación respecto de la lógica de negocio.

### Validators

Los validadores verifican la estructura y restricciones de los datos recibidos antes de procesarlos.

Zod forma parte de los mecanismos utilizados para la validación de datos.

### Middleware

Los middleware se utilizan para responsabilidades transversales como autenticación, tenant, seguridad, validación y seguimiento de solicitudes.

## Frontend

### Componentes

El frontend utiliza React y una arquitectura basada en componentes reutilizables.

### Hooks

Los hooks encapsulan lógica reutilizable relacionada con el estado y comportamiento de la interfaz.

### Contextos

Los contextos se utilizan cuando un estado o servicio requiere ser compartido entre componentes sin acoplar directamente cada componente a su origen.

### Servicios

Los servicios del frontend encapsulan operaciones de comunicación con el backend y otras responsabilidades reutilizables.

### Comunicación con API

La comunicación con el backend utiliza Axios y una URL base configurable mediante `VITE_API_URL`, con `/api` como valor utilizado por defecto.

Las solicitudes que modifican información utilizan mecanismos de protección CSRF configurados en el cliente.

## Base de datos

### Modelo de datos

MySQL 8 constituye el sistema gestor de base de datos relacional.

El modelo utiliza claves primarias, claves foráneas, restricciones, índices y relaciones para preservar la integridad de los datos.

### Multi-tenancy

Las entidades que requieren aislamiento empresarial utilizan `empresa_id`.

El backend establece el contexto empresarial mediante middleware de tenant y los accesos a datos deben respetar dicho contexto.

### Integridad

La integridad se mantiene mediante restricciones de base de datos, claves foráneas, restricciones `CHECK` cuando corresponden y validaciones en la aplicación.

### Triggers

Existen triggers para actualizar automáticamente determinados totales derivados en facturas, pedidos y proformas.

### Índices

Los índices se utilizan para facilitar las consultas sobre columnas empleadas frecuentemente en filtros, relaciones y restricciones de unicidad.

### Soft delete

Las entidades que incorporan eliminación lógica utilizan campos como `deleted_at`.

Las consultas correspondientes deben excluir registros eliminados cuando el comportamiento funcional lo requiera.

## Autenticación

### Access tokens

El frontend mantiene el access token en memoria para evitar almacenarlo de forma persistente en el almacenamiento del navegador.

### Refresh tokens

El refresh token se gestiona mediante una cookie `httpOnly`.

### JWT y JTI

Los tokens utilizan JWT y disponen de identificadores `jti` para permitir su identificación individual.

### Token blacklist

La revocación de tokens utiliza mecanismos respaldados por Redis y MySQL.

### Sesiones

Las sesiones de usuario se registran mediante la estructura de sesiones correspondiente y se relacionan con el usuario autenticado.

### Recuperación de contraseña

La recuperación de contraseña utiliza mecanismos específicos para códigos, tokens y expiración.

## Seguridad

### Gestión de secretos

Los secretos y credenciales no deben almacenarse directamente en el código fuente.

Los valores sensibles deben proporcionarse mediante variables de entorno o mecanismos de gestión de secretos.

### CSRF

El frontend utiliza un token CSRF obtenido mediante cookie y lo envía en las solicitudes que modifican información.

### CSP

La aplicación utiliza Content Security Policy mediante la configuración de seguridad HTTP.

La política debe mantenerse alineada con los recursos y mecanismos realmente utilizados por la aplicación.

### HSTS

HSTS forma parte de las cabeceras de seguridad configuradas para los entornos donde corresponde utilizar HTTPS.

### Trusted Types

Trusted Types forma parte de las medidas de seguridad configuradas mediante las políticas HTTP de la aplicación.

### Rate limiting

Los endpoints expuestos deben aplicar mecanismos de limitación de solicitudes cuando la operación lo requiera.

### Auditoría

Las acciones relevantes pueden registrarse mediante la tabla `auditoria_acciones`.

La información de auditoría debe permitir relacionar la operación con el usuario, empresa y registro afectado cuando corresponda.

## Persistencia y Redis

### MySQL

MySQL constituye la fuente principal de persistencia relacional del sistema.

### Redis

Redis se utiliza como almacenamiento temporal y soporte para mecanismos que requieren acceso rápido a información de corta duración.

### Uso de caché

El uso de caché debe evaluarse según la naturaleza de cada operación y no debe comprometer la consistencia de los datos empresariales.

### Estado temporal

Redis puede utilizarse para información temporal cuya pérdida pueda ser gestionada sin comprometer la fuente principal de datos.

## Testing

### Unit Tests

Vitest se utiliza para las pruebas unitarias del frontend y backend.

### Integration Tests

Las pruebas de integración verifican la interacción entre componentes y servicios que deben funcionar conjuntamente.

### E2E

Playwright se utiliza para las pruebas end-to-end del frontend.

### Performance

Las pruebas de rendimiento deben evaluar los flujos críticos y las condiciones de carga relevantes para el sistema.

### Security Testing

Las validaciones de seguridad incluyen análisis estático, pruebas específicas y herramientas de análisis dinámico cuando corresponda.

## CI/CD

### GitHub Actions

GitHub Actions se utiliza para automatizar las validaciones del proyecto.

### Quality Gates

Las validaciones de calidad deben impedir que errores críticos de linting, pruebas u otros controles obligatorios avancen en el flujo correspondiente.

### SonarCloud

SonarCloud se utiliza como herramienta de análisis de calidad y seguridad del código.

Los resultados deben interpretarse considerando la arquitectura actual y la presencia de componentes legacy.

### Artefactos

Los workflows pueden conservar reportes y resultados generados durante las validaciones automatizadas.

### Seguridad del pipeline

Los workflows deben utilizar permisos mínimos, evitar secretos en texto plano y mantener actualizadas las acciones utilizadas.

## Docker

### Contenedores

Docker se utilizará para facilitar la ejecución reproducible de los componentes que requieran contenerización.

### Reproducibilidad

La contenerización debe permitir reproducir el entorno de ejecución independientemente de configuraciones específicas de la máquina del desarrollador.

### Entornos

La configuración de contenedores debe distinguir las necesidades de desarrollo, pruebas y ejecución de producción cuando corresponda.

## Arquitectura legacy

### Motivo de la migración

La migración busca reducir duplicación, mejorar la separación de responsabilidades y establecer una estructura modular coherente.

### Arquitectura anterior

La arquitectura anterior contiene controladores, modelos, servicios, middleware y utilidades ubicados en estructuras legacy.

### Arquitectura actual

La arquitectura actual utiliza módulos bajo `src/modules` y componentes compartidos bajo `src/shared`.

### Estrategia de migración

La migración se realiza mediante:

1. Identificación de consumidores.
2. Definición del componente destino.
3. Migración de consumidores.
4. Ejecución de pruebas.
5. Verificación de referencias restantes.
6. Eliminación del componente legacy cuando corresponda.
7. Nueva ejecución de validaciones.

### Eliminación de código legacy

Un componente legacy debe eliminarse únicamente después de verificar que no existan consumidores activos y que las pruebas relevantes continúen funcionando.

## Inteligencia artificial

### Servicios externos

El sistema integra servicios externos de inteligencia artificial para funcionalidades específicas.

La integración incluye servicios relacionados con generación y procesamiento de imágenes.

### Gestión de errores

Las integraciones de IA deben controlar errores de autenticación, disponibilidad, límites, respuestas inválidas y errores específicos del proveedor.

### Límites

Las solicitudes de IA deben respetar límites de tamaño, parámetros y recursos establecidos por la aplicación y por los servicios externos.

### Observabilidad

Las solicitudes de IA pueden registrar información operacional como estado, duración y resultado, evitando almacenar información sensible innecesaria.

## Rendimiento

### Cache

El caché debe utilizarse cuando reduzca operaciones costosas sin comprometer la consistencia requerida por el flujo funcional.

### Consultas

Las consultas deben aprovechar índices, relaciones y filtros adecuados para evitar operaciones innecesariamente costosas.

### Concurrencia

Las operaciones que modifican información crítica deben considerar condiciones de concurrencia, consistencia e idempotencia cuando corresponda.

### Escalabilidad

La arquitectura debe permitir incrementar recursos y distribuir responsabilidades sin introducir dependencias innecesarias entre componentes.

## Documentación

### Documentación técnica

La documentación se organiza por dominios para describir arquitectura, API, base de datos, CI/CD, despliegue, observabilidad, seguridad y otros aspectos técnicos.

### Documentación automática

Los artefactos generados automáticamente deben mantenerse diferenciados de la documentación mantenida manualmente.

### ADR

Las decisiones arquitectónicas relevantes deben registrarse mediante ADR cuando su impacto justifique conservar contexto, alternativas y consecuencias.

## Cambios de decisiones

### Modificación de una decisión existente

Cuando una decisión existente cambia, debe conservarse su contexto histórico y documentarse la nueva decisión.

### Reemplazo de una decisión

Una decisión puede ser reemplazada cuando una nueva solución técnica resuelve el problema original bajo condiciones diferentes.

### Decisión obsoleta

Una decisión debe marcarse como obsoleta cuando deje de representar la arquitectura vigente.

La decisión original no debe eliminarse si su historial resulta relevante para comprender la evolución del sistema.

## Historial de decisiones

| ID | Decisión | Estado |
|---|---|---|
| ADR-001 | Estructuración modular del backend | Aceptada |

## Documentación relacionada

- [Deuda técnica](technical-debt.md)
- [Arquitectura](../Arquitectura/architecture.md)
- [API](../API/api-contracts.md)
- [Base de Datos](../Base%20de%20Datos/database.md)
- [CI/CD](../CI-CD/ci-cd.md)
- [Despliegue](../Despliegue/deployment.md)
- [Observabilidad](../Observabilidad/observability.md)
- [IA](../IA/ai.md)
- [Solución de Problemas](../Solucion%20de%20Problemas/troubleshooting.md)
