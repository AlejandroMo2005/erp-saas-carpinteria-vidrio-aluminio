# Documentación del Proyecto

## 1. Propósito

Esta carpeta contiene la documentación técnica, arquitectónica, operativa y de soporte de la plataforma ERP/SaaS para negocios de carpintería de vidrio y aluminio.

La documentación se encuentra organizada por responsabilidad para facilitar su consulta, mantenimiento y evolución.

## 2. Estructura

### API

Documentación de los contratos y reglas de comunicación entre los componentes de la plataforma.

- [Contratos de API](API/api-contracts.md)

### Arquitectura

Documentación de la arquitectura general y de las principales decisiones estructurales del sistema.

- [Arquitectura](Arquitectura/architecture.md)

### Base de Datos

Documentación especializada del modelo de datos, entidades, relaciones, integridad, índices, triggers, procedimientos, migraciones y concurrencia.

- [Base de datos](Base%20de%20Datos/database.md)
- [Entidades](Base%20de%20Datos/Entidades/)
- [Relaciones](Base%20de%20Datos/Relaciones/relaciones.md)
- [Integridad](Base%20de%20Datos/Integridad/integridad.md)
- [Índices](Base%20de%20Datos/Indices/indices.md)
- [Triggers](Base%20de%20Datos/Triggers/triggers.md)
- [Procedimientos](Base%20de%20Datos/Procedimientos/procedimientos.md)
- [Migraciones](Base%20de%20Datos/Migraciones/migraciones.md)
- [Concurrencia](Base%20de%20Datos/Concurrencia/concurrencia.md)

### CI/CD

Documentación de integración continua, validaciones automatizadas y procesos de entrega.

- [CI/CD](CI-CD/ci-cd.md)

### Decisiones Técnicas

Registro de decisiones arquitectónicas y de la deuda técnica identificada durante la evolución del proyecto.

- [Decisiones técnicas](Decisiones%20Técnicas/decisions.md)
- [Deuda técnica](Decisiones%20Técnicas/technical-debt.md)

### Despliegue

Documentación de arquitectura de despliegue, entornos, infraestructura, configuración, servicios, seguridad, red, escalabilidad y recuperación.

- [Despliegue](Despliegue/deployment.md)

### Documentación Legal

Documentación relacionada con cumplimiento, contribución y gestión de versiones.

- [Compliance](Documentación%20Legal/compliance.md)
- [Contributing](Documentación%20Legal/contributing.md)
- [Release Management](Documentación%20Legal/release-management.md)

### IA

Documentación relacionada con la integración de servicios de inteligencia artificial, modelos, solicitudes, proveedores y operación.

- [Inteligencia Artificial](IA/ai.md)

### Observabilidad

Documentación especializada para logging, métricas, health checks, monitoreo, alertas, trazabilidad, auditoría, rendimiento, seguridad y diagnóstico.

- [Observabilidad](Observabilidad/observability.md)
- [Logging](Observabilidad/Logging/logging.md)
- [Métricas](Observabilidad/Metricas/metricas.md)
- [Health Checks](Observabilidad/Health%20Checks/health-checks.md)
- [Monitoreo](Observabilidad/Monitoreo/monitoreo.md)
- [Alertas](Observabilidad/Alertas/alertas.md)
- [Trazabilidad](Observabilidad/Trazabilidad/trazabilidad.md)
- [Auditoría](Observabilidad/Auditoria/auditoria.md)
- [Rendimiento](Observabilidad/Rendimiento/rendimiento.md)
- [Seguridad](Observabilidad/Seguridad/seguridad.md)
- [Diagnóstico](Observabilidad/Diagnostico/diagnostico.md)

### Solución de Problemas

Procedimientos para diagnóstico y resolución de incidencias técnicas.

- [Solución de problemas](Solucion%20de%20Problemas/troubleshooting.md)

## 3. Principios de organización

La documentación se organiza por responsabilidad técnica para evitar concentrar información de diferentes dominios en un único archivo.

Los documentos principales funcionan como puntos de entrada y enlazan hacia documentación especializada cuando existe una separación adicional de responsabilidades.

Las referencias entre documentos deben utilizar enlaces relativos para mantener la navegación funcional dentro del repositorio.

## 4. Mantenimiento

La documentación debe mantenerse alineada con la implementación real del sistema.

Cuando una modificación arquitectónica, funcional, de seguridad, infraestructura, base de datos o proceso operativo cambie el comportamiento documentado, el documento correspondiente debe actualizarse junto con el cambio técnico.

No se debe documentar como existente una capacidad que únicamente haya sido propuesta o planificada.

## 5. Documentación relacionada

- [Arquitectura](Arquitectura/architecture.md)
- [Decisiones técnicas](Decisiones%20Técnicas/decisions.md)
- [Deuda técnica](Decisiones%20Técnicas/technical-debt.md)
- [CI/CD](CI-CD/ci-cd.md)
- [Despliegue](Despliegue/deployment.md)
- [Base de Datos](Base%20de%20Datos/database.md)
- [API](API/api-contracts.md)
- [Observabilidad](Observabilidad/observability.md)
- [IA](IA/ai.md)
- [Solución de Problemas](Solucion%20de%20Problemas/troubleshooting.md)
