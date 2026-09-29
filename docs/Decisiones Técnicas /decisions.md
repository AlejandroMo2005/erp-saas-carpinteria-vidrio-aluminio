# Decisiones Técnicas

## Descripción

Este documento registra las principales decisiones técnicas que condicionan la arquitectura, implementación, seguridad, calidad, operación y evolución de la plataforma ERP/SaaS para negocios de carpintería de vidrio y aluminio.

El objetivo es conservar el contexto de las decisiones relevantes, explicar los criterios utilizados y facilitar su revisión cuando cambien los requisitos, dependencias, infraestructura o arquitectura del sistema.

## Objetivo

Mantener un registro verificable de las decisiones técnicas relevantes para:

- reducir decisiones contradictorias entre módulos;
- conservar el contexto de las soluciones adoptadas;
- facilitar el mantenimiento y evolución del sistema;
- identificar decisiones que deban revisarse;
- relacionar decisiones con seguridad, rendimiento, pruebas y operación;
- evitar que cambios arquitectónicos importantes dependan únicamente del conocimiento individual de un desarrollador.

## Alcance

Este documento cubre decisiones relacionadas con:

- arquitectura frontend y backend;
- organización modular del código;
- API;
- persistencia;
- multi-tenancy;
- autenticación y sesiones;
- seguridad;
- validación;
- caché y almacenamiento temporal;
- IA;
- observabilidad;
- testing;
- calidad de código;
- CI/CD;
- gestión de código legacy;
- documentación y evolución técnica.

No sustituye la documentación específica de arquitectura, seguridad, API, base de datos, IA, CI/CD o despliegue. Cuando una decisión requiere detalles operativos, estos deben mantenerse en el documento técnico correspondiente.

## Principios para tomar decisiones

Las decisiones técnicas deben considerar, según corresponda:

1. seguridad;
2. integridad de los datos;
3. aislamiento entre empresas;
4. mantenibilidad;
5. testabilidad;
6. rendimiento;
7. observabilidad;
8. reproducibilidad;
9. simplicidad operacional;
10. compatibilidad con la arquitectura existente;
11. costo de operación;
12. impacto sobre funcionalidades existentes.

Una decisión no debe evaluarse únicamente por la facilidad inmediata de implementación. También debe considerarse su impacto sobre mantenimiento, pruebas, seguridad y evolución futura.

## Arquitectura web

### Decisión

Mantener una arquitectura web separada entre frontend y backend.

### Contexto

La plataforma requiere una interfaz de usuario independiente de los servicios de negocio y persistencia.

### Implementación actual

El frontend utiliza React y Vite.

El backend utiliza Node.js y Express.

La comunicación entre ambas capas se realiza mediante una API HTTP bajo el prefijo `/api`.

### Justificación

La separación permite:

- desacoplar la presentación de la lógica de negocio;
- probar frontend y backend de manera independiente;
- evolucionar cada capa con menor acoplamiento;
- centralizar reglas de seguridad y negocio en el backend;
- facilitar futuras estrategias de despliegue.

## Frontend

### Decisión

Mantener React como tecnología principal de presentación y Vite como herramienta de construcción y desarrollo.

### Contexto

La interfaz requiere componentes reutilizables, manejo de estado, consumo de API y pruebas automatizadas.

### Criterio

La estructura frontend debe mantenerse orientada a componentes y responsabilidades, evitando concentrar lógica de negocio compleja dentro de componentes visuales.

La obtención y sincronización de datos debe mantenerse separada de la presentación cuando la responsabilidad lo requiera.

## Backend

### Decisión

Mantener Node.js y Express para la capa de servicios HTTP.

### Contexto

El backend concentra:

- autenticación;
- autorización;
- validación;
- reglas de negocio;
- persistencia;
- integración con servicios externos;
- auditoría;
- observabilidad.

### Criterio

Las responsabilidades deben mantenerse separadas mediante módulos, controladores, servicios, repositorios, validadores y componentes compartidos cuando corresponda.

## Arquitectura modular del backend

### Decisión

Adoptar una organización modular bajo `src/modules` y componentes compartidos bajo `src/shared`.

### Contexto

El proyecto contiene funcionalidades diferenciadas como autenticación, clientes, materiales, proveedores, trabajos, proformas, pedidos, facturación e IA.

### Criterio

La organización modular busca reducir el acoplamiento y facilitar:

- pruebas aisladas;
- evolución funcional;
- localización de responsabilidades;
- reutilización controlada;
- migración progresiva del código legacy.

Los módulos no deben introducir dependencias innecesarias entre dominios.

## Migración desde arquitectura legacy

### Decisión

Realizar la migración del código legacy de forma progresiva, verificando consumidores y pruebas antes de eliminar componentes antiguos.

### Contexto

El proyecto contiene código histórico fuera de la arquitectura modular actual. Parte de este código puede mantener consumidores, pruebas o dependencias indirectas.

### Criterio

El proceso recomendado es:

1. identificar el componente legacy;
2. identificar sus consumidores;
3. identificar duplicaciones;
4. migrar los consumidores necesarios;
5. ejecutar pruebas;
6. eliminar el código obsoleto cuando ya no tenga consumidores;
7. ejecutar nuevamente pruebas y análisis de calidad;
8. actualizar documentación relacionada.

No se debe eliminar código únicamente porque tenga una ubicación considerada antigua.

## API

### Decisión

Utilizar una API HTTP bajo `/api` como contrato principal entre frontend y backend.

### Criterio

Los contratos deben definir:

- rutas;
- métodos;
- autenticación;
- autorización;
- estructura de solicitudes;
- estructura de respuestas;
- códigos HTTP;
- errores;
- validaciones;
- requisitos de seguridad.

Los cambios de contrato deben evaluarse también desde el frontend y las pruebas automatizadas.

## Validación de entrada

### Decisión

Utilizar validación mediante esquemas Zod en los puntos donde se reciben datos externos.

### Contexto

Los datos provenientes del cliente no deben considerarse confiables por defecto.

### Criterio

La validación debe realizarse antes de utilizar datos en lógica de negocio o persistencia cuando corresponda.

La validación debe contemplar:

- tipos;
- formatos;
- rangos;
- campos obligatorios;
- límites de longitud;
- estructuras anidadas;
- restricciones específicas del dominio.

La validación de entrada no sustituye las restricciones de la base de datos.

## Persistencia

### Decisión

Mantener MySQL como sistema principal de persistencia relacional.

### Contexto

El dominio contiene relaciones entre empresas, usuarios, clientes, materiales, trabajos, proformas, pedidos, facturas y otras entidades.

### Criterio

La integridad de los datos debe apoyarse tanto en la capa de aplicación como en:

- claves primarias;
- claves foráneas;
- índices;
- restricciones;
- valores enumerados;
- verificaciones;
- transacciones cuando sean necesarias.

La documentación detallada del modelo se mantiene en `docs/Base de Datos/`.

## Multi-tenancy

### Decisión

Mantener el aislamiento lógico de datos mediante `empresa_id`.

### Contexto

La plataforma tiene orientación SaaS y debe diferenciar los datos pertenecientes a cada empresa.

### Criterio

Las consultas y operaciones que trabajen con datos multi-tenant deben considerar el contexto de empresa correspondiente.

El aislamiento no debe depender únicamente de filtros agregados en la interfaz.

Las operaciones administrativas, repositorios, servicios y controladores deben preservar el contexto de tenant según la responsabilidad de cada capa.

## Autenticación

### Decisión

Mantener autenticación basada en tokens con separación entre access token y refresh token.

### Implementación actual

El access token se mantiene en memoria en el frontend.

El refresh token utiliza una cookie `httpOnly`.

El backend utiliza identificadores de sesión y mecanismos de invalidación asociados al token.

### Criterio

La arquitectura busca reducir la exposición del refresh token al código JavaScript del navegador y permitir la renovación controlada de sesiones.

Las modificaciones relacionadas con autenticación deben considerar también:

- expiración;
- revocación;
- logout;
- renovación;
- auditoría;
- aislamiento de empresa;
- pruebas de seguridad.

## Revocación de tokens

### Decisión

Utilizar Redis y persistencia asociada para mecanismos de blacklist y control de sesiones.

### Contexto

Un token firmado criptográficamente puede continuar siendo válido hasta su expiración si no existe un mecanismo adicional de revocación.

### Criterio

El identificador único del token y los mecanismos de blacklist permiten invalidar sesiones antes de su expiración normal cuando sea necesario.

Las operaciones de logout, revocación y renovación deben mantenerse consistentes con el modelo de sesiones.

## Redis

### Decisión

Utilizar Redis para necesidades de almacenamiento temporal y mecanismos que requieren acceso rápido.

### Usos relacionados con la arquitectura actual

Entre los usos se encuentran mecanismos asociados con:

- blacklist de tokens;
- sesiones;
- datos temporales;
- operaciones que requieran almacenamiento de corta duración cuando corresponda.

Redis no sustituye a MySQL como fuente principal de datos de negocio.

## Seguridad HTTP

### Decisión

Mantener medidas de endurecimiento HTTP mediante Helmet y políticas de seguridad configuradas en el backend.

### Criterio

La configuración debe contemplar, según el entorno:

- Content Security Policy;
- HSTS;
- Trusted Types;
- protección de cabeceras;
- restricciones relacionadas con contenido ejecutable.

Las políticas deben probarse contra el funcionamiento real de frontend y backend antes de endurecerlas de forma que rompan funcionalidades legítimas.

## CSRF

### Decisión

Mantener protección CSRF para solicitudes mutables realizadas desde el frontend.

### Implementación actual

El frontend utiliza una cookie de CSRF y envía el valor correspondiente mediante la cabecera `X-CSRF-Token`.

### Criterio

Las operaciones que modifiquen estado deben respetar el mecanismo definido por el backend.

Los cambios en autenticación mediante cookies deben revisarse conjuntamente con esta protección.

## Autorización

### Decisión

Mantener autorización basada en identidad y rol dentro del backend.

### Contexto

El sistema contempla roles como:

- `ADMIN`;
- `VENDEDOR`;
- `ALMACEN`;
- `CLIENTE`.

### Criterio

La interfaz puede ocultar funcionalidades no permitidas, pero la autorización efectiva debe realizarse en el backend.

La existencia de un control visual no debe considerarse una barrera de seguridad suficiente.

## Auditoría

### Decisión

Mantener una entidad específica para registrar acciones relevantes mediante `auditoria_acciones`.

### Contexto

La plataforma necesita trazabilidad de operaciones sensibles como autenticación, cambios de credenciales y determinadas operaciones sobre registros.

### Criterio

La auditoría debe evitar almacenar secretos o información innecesaria.

Los eventos auditables deben seleccionarse de acuerdo con su valor para:

- seguridad;
- trazabilidad;
- diagnóstico;
- control operativo;
- investigación de incidentes.

## Soft delete

### Decisión

Utilizar eliminación lógica en las entidades que disponen de `deleted_at` y requieren conservar el registro.

### Contexto

La eliminación física puede provocar pérdida de trazabilidad o afectar relaciones históricas.

### Criterio

Las consultas normales deben excluir registros eliminados cuando corresponda.

Las operaciones administrativas que necesiten consultar registros eliminados deben hacerlo de forma explícita y controlada.

## Facturación

### Decisión

Mantener facturación como dominio integrado con clientes, usuarios, materiales y configuración, utilizando estados explícitos para el ciclo de vida de la factura.

### Contexto

La base de datos contempla estados como:

- `BORRADOR`;
- `EMITIDA`;
- `AUTORIZADA`;
- `ANULADA`;
- `DEVUELTA`;
- `NO_AUTORIZADA`.

También existen estados relacionados con procesos SRI.

### Criterio

Las transiciones de estado deben respetar las reglas del dominio y evitar modificaciones arbitrarias de documentos que ya hayan alcanzado estados que restrinjan su modificación.

La documentación específica de la integración y operación se mantiene en los documentos de API, base de datos, cumplimiento y despliegue.

## Integridad de totales

### Decisión

Mantener mecanismos de base de datos para actualización de totales en determinadas relaciones de detalle.

### Implementación actual

Existen triggers asociados a:

- `factura_detalle` y `facturas`;
- `pedido_detalle` y `pedidos`.

### Criterio

Los triggers deben mantenerse simples y documentados.

No se debe asumir que todas las entidades con campos calculados poseen triggers equivalentes. La existencia de un mecanismo debe verificarse directamente en el esquema antes de documentarlo o modificarlo.

## IA

### Decisión

Mantener las integraciones de IA desacopladas de la lógica principal de negocio.

### Servicios actuales

La plataforma contempla integración con:

- Stability AI;
- Claude Vision;
- Replicate.

### Criterio

Los proveedores externos deben considerarse dependencias potencialmente no disponibles.

Las operaciones de IA deben contemplar:

- validación;
- timeouts;
- errores;
- reintentos cuando corresponda;
- trazabilidad;
- persistencia de solicitudes;
- control de costos;
- seguridad;
- límites de entrada.

Un error de un proveedor externo no debe convertirse automáticamente en un fallo no controlado del backend.

## Idempotencia

### Decisión

La idempotencia debe evaluarse de forma explícita en operaciones que puedan repetirse por reintentos de red, clientes o infraestructura.

### Criterio

Las operaciones sensibles, especialmente aquellas que generen efectos persistentes o externos, deben definir mecanismos adecuados cuando el dominio lo requiera.

La implementación concreta depende del caso de uso y no debe asumirse de forma general para todos los endpoints.

## Observabilidad

### Decisión

Mantener Winston como mecanismo principal de logging del backend.

### Criterio

Los logs deben facilitar:

- diagnóstico;
- monitoreo;
- investigación de errores;
- seguimiento operativo.

No deben registrar contraseñas, tokens, secretos ni información sensible innecesaria.

La auditoría de acciones y los logs operativos cumplen objetivos diferentes y no deben confundirse.

## Gestión de errores

### Decisión

Centralizar el tratamiento de errores de aplicación y HTTP mediante mecanismos compartidos cuando corresponda.

### Criterio

Los errores expuestos al cliente deben contener información suficiente para identificar el problema sin revelar detalles internos innecesarios.

Los errores internos deben conservar información suficiente para diagnóstico mediante logs y observabilidad.

## Pruebas automatizadas

### Decisión

Mantener pruebas unitarias e integración como parte del proceso de calidad.

### Estado actual

El backend dispone de una suite amplia de pruebas automatizadas y cobertura superior al umbral configurado.

El frontend también dispone de pruebas unitarias.

La cobertura no debe utilizarse como único indicador de calidad.

### Criterio

Las pruebas deben cubrir especialmente:

- reglas de negocio;
- autenticación;
- autorización;
- aislamiento multi-tenant;
- validaciones;
- persistencia;
- errores;
- integraciones críticas;
- concurrencia cuando corresponda.

## E2E

### Decisión

Utilizar Playwright para pruebas end-to-end.

### Criterio

Las pruebas E2E deben validar flujos funcionales completos desde la perspectiva del usuario y no sustituir las pruebas unitarias o de integración.

Deben priorizarse los flujos críticos del sistema.

## Performance

### Decisión

Evaluar rendimiento mediante métricas reproducibles y pruebas específicas, no únicamente mediante percepción manual.

### Criterio

Las evaluaciones deben considerar, según el componente:

- latencia;
- tiempo de respuesta;
- carga;
- concurrencia;
- consumo de memoria;
- consultas de base de datos;
- rendimiento frontend;
- operaciones de IA.

Las optimizaciones deben estar respaldadas por mediciones antes y después cuando sea posible.

## Gestión de dependencias

### Decisión

Mantener versiones explícitas y una instalación reproducible mediante `npm ci`.

### Criterio

Los cambios de dependencias deben evaluarse considerando:

- compatibilidad;
- vulnerabilidades;
- cambios de comportamiento;
- impacto sobre pruebas;
- impacto sobre build;
- impacto sobre CI/CD.

No se deben aplicar actualizaciones destructivas automáticamente sin revisar sus efectos.

## CI/CD

### Decisión

Utilizar GitHub Actions para automatizar controles de calidad del repositorio.

### Controles actuales

El pipeline contempla procesos relacionados con:

- instalación reproducible;
- linting;
- pruebas;
- cobertura;
- generación de artefactos.

### Criterio

CI/CD debe funcionar como mecanismo de verificación y prevención de regresiones.

Las decisiones arquitectónicas importantes deben permanecer bajo revisión humana y no delegarse exclusivamente al pipeline.

## Calidad estática

### Decisión

Utilizar ESLint para calidad del código y SonarCloud como herramienta adicional de análisis estático y calidad.

### Criterio

Los resultados de estas herramientas deben interpretarse dentro del contexto de la arquitectura.

Una alerta individual no debe resolverse automáticamente sin verificar:

- si el código continúa activo;
- si pertenece a código legacy;
- si existe duplicación entre implementaciones;
- si existe riesgo real;
- si el cambio puede afectar funcionalidad.

## Seguridad estática

### Decisión

Priorizar las vulnerabilidades reales y los flujos de riesgo antes de realizar correcciones mecánicas de todas las alertas.

### Criterio

Cada hallazgo debe analizarse considerando:

- contexto;
- explotabilidad;
- superficie expuesta;
- criticidad;
- consumidores;
- posibilidad de eliminar el código afectado mediante una migración arquitectónica.

La eliminación de código obsoleto puede resolver simultáneamente problemas de mantenibilidad, duplicación y seguridad.

## Documentación

### Decisión

Mantener documentación técnica organizada por dominio.

### Criterio

La documentación debe evolucionar junto con el sistema.

Las decisiones relevantes deben registrarse cuando:

- modifican arquitectura;
- afectan seguridad;
- introducen dependencias importantes;
- cambian contratos;
- modifican persistencia;
- afectan despliegue;
- introducen restricciones operativas.

## Evidencia técnica

### Decisión

Conservar evidencia de pruebas, análisis y verificaciones relevantes.

### Ejemplos

La evidencia puede incluir:

- resultados de pruebas;
- cobertura;
- lint;
- análisis estático;
- resultados de CI;
- pruebas E2E;
- pruebas de rendimiento;
- verificaciones de seguridad;
- comprobaciones de despliegue.

La evidencia no sustituye la documentación de la decisión. Ambas cumplen funciones diferentes.

## Revisión de decisiones

Las decisiones técnicas deben revisarse cuando cambien significativamente:

- requisitos funcionales;
- volumen de usuarios;
- modelo de negocio;
- arquitectura;
- infraestructura;
- proveedores externos;
- requisitos de seguridad;
- regulación aplicable;
- costos operativos.

Una decisión técnicamente válida en una etapa del proyecto puede requerir reevaluación posteriormente.

## Registro de decisiones

Las decisiones relevantes deben poder rastrearse mediante:

- código afectado;
- pruebas relacionadas;
- documentación específica;
- commits;
- Pull Requests;
- incidencias técnicas cuando existan.

Cuando una decisión sea reemplazada, no debe eliminarse silenciosamente su contexto histórico. Debe documentarse la nueva decisión y la razón del cambio.

## Estado actual

La arquitectura actual se encuentra en un proceso de consolidación y migración desde componentes legacy hacia una estructura modular.

Por este motivo, algunas decisiones representan el estado objetivo o la dirección arquitectónica mientras determinados componentes históricos continúan existiendo.

La documentación debe distinguir entre:

- arquitectura actualmente utilizada;
- arquitectura en migración;
- decisiones propuestas;
- componentes pendientes de eliminación.

No se debe documentar como existente una capacidad que todavía no haya sido implementada o verificada.

## Relación con otros documentos

Este documento se complementa con:

- `docs/Arquitectura/architecture.md`
- `docs/API/api-contracts.md`
- `docs/Base de Datos/database.md`
- `docs/IA/ai.md`
- `docs/Observabilidad/observability.md`
- `docs/CI-CD/ci-cd.md`
- `docs/Despliegue/deployment.md`
- `docs/Documentación Legal/compliance.md`
- `docs/Documentación Legal/contributing.md`
- `docs/Documentación Legal/release-management.md`
- `docs/Solucion de Problemas/troubleshooting.md`
- `docs/Decisiones Técnicas/technical-debt.md`

## Mantenimiento

Este documento debe actualizarse cuando una decisión técnica relevante sea modificada, reemplazada o descartada.

Cada modificación debe mantener coherencia con el código, las pruebas y la documentación específica afectada.

El registro debe priorizar decisiones que tengan impacto arquitectónico, operativo, de seguridad o de mantenimiento sobre detalles de implementación menores.
