# Matriz de Riesgos Técnicos

## Descripción

Este documento identifica y organiza los principales riesgos técnicos asociados con la plataforma ERP/SaaS para negocios de carpintería de vidrio y aluminio.

La matriz permite relacionar cada riesgo con su causa, impacto potencial, controles existentes, mecanismos de verificación y acciones de tratamiento.

No representa una predicción de incidentes. Constituye un instrumento de gestión técnica para identificar condiciones que pueden afectar la seguridad, integridad, disponibilidad, rendimiento, mantenibilidad o evolución del sistema.

## Objetivo

La matriz tiene como objetivos:

- identificar riesgos técnicos relevantes;
- establecer controles preventivos y detectivos;
- facilitar la priorización técnica;
- relacionar riesgos con pruebas;
- apoyar decisiones arquitectónicas;
- reducir regresiones;
- facilitar revisiones de seguridad y operación;
- conservar evidencia del tratamiento aplicado.

## Criterios

Los riesgos deben evaluarse considerando:

- probabilidad;
- impacto;
- exposición;
- capacidad de detección;
- controles existentes;
- facilidad de mitigación;
- dependencia de componentes externos.

La clasificación debe revisarse cuando cambien la arquitectura, infraestructura o funcionalidades.

## Escala de probabilidad

| Nivel | Descripción |
|---|---|
| Baja | La condición requiere circunstancias poco frecuentes |
| Media | La condición puede producirse durante operaciones normales o cambios habituales |
| Alta | La condición puede producirse con frecuencia o existe una exposición significativa |

## Escala de impacto

| Nivel | Descripción |
|---|---|
| Bajo | Impacto limitado y recuperación sencilla |
| Medio | Puede afectar una funcionalidad o proceso relevante |
| Alto | Puede afectar datos, seguridad, operación o procesos críticos |

## Matriz

| Riesgo | Causa principal | Impacto potencial | Probabilidad | Impacto | Controles actuales | Verificación | Tratamiento |
|---|---|---|---|---|---|---|---|
| Acceso entre empresas | Filtro multi-tenant incorrecto | Exposición o modificación de datos de otra empresa | Media | Alto | `empresa_id`, middleware, repositorios | Tests unitarios/integración | Mantener pruebas explícitas de aislamiento |
| Acceso no autorizado | Fallo de autorización | Ejecución de operaciones no permitidas | Media | Alto | Roles y autorización backend | Tests unitarios/integración/E2E | Verificar permisos por rol |
| Sesión comprometida | Gestión incorrecta de tokens | Acceso no autorizado | Media | Alto | Access token, refresh token, blacklist | Tests de autenticación | Revisar expiración y revocación |
| CSRF | Solicitud mutable no protegida | Modificación no autorizada | Baja/Media | Alto | Token CSRF | Tests de API | Mantener protección en operaciones mutables |
| Validación insuficiente | Entrada no validada | Datos inválidos o comportamiento inesperado | Media | Alto | Zod y restricciones DB | Tests unitarios/integración | Validar límites y estructuras |
| Inyección | Datos no tratados correctamente | Alteración de consultas o procesamiento | Baja/Media | Alto | Validación, consultas parametrizadas | Tests de seguridad/DAST | Mantener revisión de entradas |
| Exposición de secretos | Configuración incorrecta | Compromiso de credenciales | Baja/Media | Alto | Variables de entorno, CI/CD | Revisión de configuración | Evitar secretos en repositorio |
| Registro de información sensible | Logging excesivo | Exposición de credenciales o datos | Media | Alto | Política de logging | Revisión de logs | Excluir secretos y datos sensibles |
| Log injection | Datos externos incorporados a logs | Manipulación de trazas | Media | Medio | Logging centralizado | Análisis estático/revisión | Sanitizar datos cuando corresponda |
| Código legacy | Coexistencia de arquitecturas | Duplicación e inconsistencias | Alta | Medio/Alto | Migración modular | SonarCloud/tests | Migración progresiva |
| Duplicación | Implementaciones paralelas | Correcciones inconsistentes | Alta | Medio | Arquitectura modular | SonarCloud | Consolidar implementaciones |
| Regresión funcional | Cambios sin pruebas suficientes | Pérdida de comportamiento existente | Media | Alto | Vitest/Playwright/CI | Suite de pruebas | Ampliar pruebas críticas |
| Cobertura insuficiente | Flujos no probados | Fallos no detectados | Media | Medio/Alto | Tests unitarios | Coverage + análisis funcional | Priorizar por riesgo |
| Fallo de base de datos | Servicio MySQL no disponible | Indisponibilidad | Baja/Media | Alto | Health checks | Integración/operación | Verificar recuperación |
| Corrupción lógica de datos | Cambios sin integridad suficiente | Datos inconsistentes | Baja/Media | Alto | FK, checks, triggers | Tests de integración | Mantener restricciones |
| Condiciones de carrera | Operaciones concurrentes | Stock o secuencias inconsistentes | Media | Alto | Diseño transaccional cuando corresponda | Tests de concurrencia | Diseñar flujos críticos explícitamente |
| Índices insuficientes | Consultas sin soporte adecuado | Degradación de rendimiento | Media | Medio | Índices existentes | Pruebas de rendimiento | Revisar consultas y planes |
| Sobrecarga backend | Aumento de concurrencia | Latencia o errores | Media | Alto | PM2, límites | Load testing | Medir capacidad y degradación |
| Fuga de memoria | Recursos no liberados | Reinicios o indisponibilidad | Baja/Media | Medio/Alto | PM2 `max_memory_restart` | Monitoreo/performance | Medir consumo |
| Redis no disponible | Servicio temporal fuera de servicio | Fallos de sesión o blacklist | Baja/Media | Alto | Health checks | Integración | Definir comportamiento de degradación |
| Proveedor IA no disponible | Servicio externo | Funcionalidad IA no disponible | Media | Medio | Timeouts y manejo de errores | Tests con mocks | Mantener degradación controlada |
| Límite de proveedor IA | Cuotas o créditos agotados | Solicitudes fallidas | Media | Medio | Manejo de errores | Tests de integración | Registrar y tratar respuesta del proveedor |
| Cambio de API externa | Proveedor modifica contrato | Integración rota | Media | Medio/Alto | Servicios aislados | Tests de integración | Revisar versiones y contratos |
| Error de facturación | Regla de negocio incorrecta | Documentos o totales incorrectos | Baja/Media | Alto | Validaciones, tests | Unitarias/integración/E2E | Priorizar pruebas de dominio |
| Error de secuencia | Concurrencia o configuración | Numeración incorrecta | Baja/Media | Alto | `secuencias_comprobantes` | Integración/concurrencia | Probar operaciones simultáneas |
| Fallo de trigger | Cambio de esquema o lógica | Totales incorrectos | Baja | Alto | Triggers documentados | Integración | Probar inserciones y resultados |
| Migración DB defectuosa | Cambio no reproducible | Pérdida o incompatibilidad | Baja/Media | Alto | Documentación/migraciones | Pruebas en entorno controlado | Verificar antes de despliegue |
| Configuración incorrecta | Variables ausentes o inválidas | Fallos de arranque u operación | Media | Medio/Alto | `.env.example`, validación | CI/deploy | Validar configuración |
| Dependencia vulnerable | Paquete con vulnerabilidad | Riesgo de seguridad | Media | Alto | Análisis de dependencias | Auditorías | Actualizar evaluando compatibilidad |
| Build reproducible fallido | Dependencias inconsistentes | CI o despliegue fallido | Baja/Media | Medio | `npm ci`, lockfile | CI | Mantener versiones controladas |
| DAST no ejecutado | Falta de análisis dinámico | Vulnerabilidades no detectadas | Media | Medio/Alto | Plan de seguridad | ZAP/DAST | Integrar progresivamente |
| Observabilidad insuficiente | Falta de métricas o logs | Diagnóstico lento | Media | Medio | Winston, auditoría, health checks | Revisión operativa | Ampliar señales críticas |
| Backup insuficiente | Falta de estrategia verificable | Pérdida de datos | Baja/Media | Alto | Documentación de despliegue | Pruebas de recuperación | Verificar restauración |
| Rollback insuficiente | Cambio irreversible | Recuperación difícil | Baja/Media | Alto | Procedimiento documentado | Simulaciones | Probar escenarios críticos |
| Documentación desactualizada | Cambios sin actualización | Decisiones incorrectas | Media | Medio | Documentación estructurada | Revisión | Actualizar junto con cambios |

## Riesgos críticos

Los riesgos relacionados con aislamiento multi-tenant, autenticación, autorización, integridad de datos y facturación requieren especial atención debido a su posible impacto sobre información y operaciones de negocio.

Estos riesgos deben mantenerse asociados a pruebas específicas y revisarse después de cambios arquitectónicos.

## Riesgo de multi-tenancy

El aislamiento entre empresas es un control transversal.

Un error en un filtro, repositorio, servicio o controlador puede afectar múltiples funcionalidades simultáneamente.

Por esta razón, los cambios relacionados con `empresa_id`, middleware de tenant, repositorios o autorización deben acompañarse de pruebas explícitas de aislamiento.

## Riesgo de arquitectura legacy

La coexistencia de código legacy y arquitectura modular incrementa la posibilidad de:

- utilizar accidentalmente la implementación incorrecta;
- corregir una implementación mientras otra permanece vulnerable;
- duplicar lógica;
- mantener pruebas redundantes;
- aumentar la complejidad del análisis estático.

El tratamiento debe realizarse mediante migración progresiva y eliminación controlada.

## Riesgo de duplicación

La duplicación identificada por herramientas de calidad debe interpretarse dentro del contexto de la migración arquitectónica.

Cuando varias alertas provienen de una misma duplicación estructural, deben tratarse como un conjunto.

No debe crearse una abstracción únicamente para reducir similitud textual.

## Riesgo de seguridad

Los hallazgos de seguridad deben analizarse según:

- componente;
- entrada controlable;
- exposición;
- criticidad;
- explotabilidad;
- código activo;
- relación con legacy.

La existencia de una alerta no determina por sí sola el impacto real.

## Riesgo de datos

Las entidades relacionadas con:

- inventario;
- proformas;
- pedidos;
- facturación;
- usuarios;

requieren especial atención debido a que errores de integridad pueden propagarse hacia procesos posteriores.

Las restricciones de base de datos deben complementarse con validación y pruebas de aplicación.

## Riesgo de concurrencia

Los flujos que modifican recursos compartidos requieren especial revisión.

Ejemplos:

- stock;
- secuencias de comprobantes;
- sesiones;
- operaciones financieras;
- actualización de estados.

Las pruebas de concurrencia deben utilizarse cuando una operación pueda recibir solicitudes simultáneas con efectos sobre el mismo recurso.

## Riesgo de servicios externos

Los servicios externos pueden fallar independientemente del sistema.

Las integraciones deben contemplar:

- timeout;
- errores HTTP;
- respuestas inválidas;
- límites;
- cambios de proveedor;
- indisponibilidad.

El sistema debe evitar convertir automáticamente un fallo externo en una excepción no controlada.

## Riesgo de configuración

Las diferencias entre entornos pueden producir fallos que no aparecen durante desarrollo.

Las variables de entorno deben documentarse y validarse.

No deben utilizarse valores sensibles por defecto en ambientes de producción.

## Riesgo de despliegue

Los cambios de código, base de datos o configuración pueden producir incompatibilidades.

Antes de desplegar debe verificarse:

- versión;
- dependencias;
- variables;
- base de datos;
- migraciones;
- pruebas;
- health checks;
- procedimiento de rollback.

## Riesgo de recuperación

La disponibilidad de un procedimiento documentado no garantiza que la recuperación funcione.

Los procedimientos críticos de recuperación deben probarse periódicamente cuando la infraestructura lo permita.

## Controles preventivos

Los principales controles preventivos incluyen:

- validación de entrada;
- autorización;
- aislamiento multi-tenant;
- restricciones de base de datos;
- pruebas automatizadas;
- revisión de código;
- linting;
- análisis estático;
- gestión de dependencias;
- configuración controlada;
- revisión de cambios.

## Controles detectivos

Los controles detectivos incluyen:

- logs;
- auditoría;
- health checks;
- CI/CD;
- SonarCloud;
- pruebas;
- monitoreo;
- análisis DAST;
- métricas de rendimiento.

## Tratamiento de riesgos

Las estrategias disponibles son:

### Mitigar

Reducir probabilidad o impacto mediante controles.

### Eliminar

Eliminar la causa, por ejemplo mediante la eliminación de código legacy.

### Transferir

Utilizar mecanismos externos o servicios especializados cuando sea apropiado.

### Aceptar

Mantener temporalmente el riesgo cuando sea conocido y justificado.

La aceptación debe quedar documentada cuando el riesgo sea relevante.

## Criterios de revisión

Un riesgo debe revisarse cuando:

- cambia su componente;
- cambia la arquitectura;
- cambia la infraestructura;
- se introduce una nueva integración;
- aparece un incidente;
- cambia el modelo de datos;
- se detecta una vulnerabilidad;
- se modifica el flujo asociado.

## Evidencia

El tratamiento de riesgos puede respaldarse mediante:

- pruebas;
- resultados de CI;
- análisis estático;
- reportes de seguridad;
- pruebas de rendimiento;
- documentación;
- commits;
- Pull Requests;
- registros de incidentes.

## Relación con otros documentos

Esta matriz se complementa con:

- `docs/Calidad/Estrategia de Pruebas.md`
- `docs/Calidad/Matriz de Trazabilidad.md`
- `docs/Decisiones Técnicas/decisions.md`
- `docs/Decisiones Técnicas/technical-debt.md`
- `docs/Arquitectura/architecture.md`
- `docs/Observabilidad/observability.md`
- `docs/CI-CD/ci-cd.md`
- `docs/Despliegue/deployment.md`
- `docs/Solucion de Problemas/troubleshooting.md`

## Mantenimiento

La matriz debe revisarse después de cambios relevantes de arquitectura, seguridad, infraestructura o funcionalidad.

Los niveles de riesgo no deben permanecer estáticos si cambia la exposición o los controles disponibles.

La matriz debe representar el estado técnico conocido y no debe utilizarse para afirmar que un riesgo ha desaparecido únicamente porque exista un control documentado.
