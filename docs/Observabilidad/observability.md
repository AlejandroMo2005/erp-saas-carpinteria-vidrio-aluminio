# Observabilidad

## Descripción

Esta documentación centraliza la estrategia de observabilidad de la plataforma ERP/SaaS y organiza los mecanismos utilizados para conocer el estado, comportamiento, rendimiento y seguridad de sus componentes.

La observabilidad se estructura por responsabilidades para facilitar la consulta, diagnóstico y evolución de cada mecanismo.

## Índice

- [Logging](Logging/logging.md)
- [Métricas](Metricas/metricas.md)
- [Health Checks](Health%20Checks/health-checks.md)
- [Monitoreo](Monitoreo/monitoreo.md)
- [Alertas](Alertas/alertas.md)
- [Trazabilidad](Trazabilidad/trazabilidad.md)
- [Auditoría](Auditoria/auditoria.md)
- [Rendimiento](Rendimiento/rendimiento.md)
- [Seguridad](Seguridad/seguridad.md)
- [Diagnóstico](Diagnostico/diagnostico.md)

## Logging

[Logging](Logging/logging.md) documenta el sistema de registros de la aplicación, sus niveles, contexto, eventos relevantes, protección de información sensible y uso durante el diagnóstico.

## Métricas

[Métricas](Metricas/metricas.md) define los indicadores utilizados para observar el comportamiento del frontend, backend, MySQL, Redis, IA e infraestructura.

## Health Checks

[Health Checks](Health%20Checks/health-checks.md) documenta los mecanismos destinados a verificar la disponibilidad del backend y el estado de sus dependencias.

## Monitoreo

[Monitoreo](Monitoreo/monitoreo.md) establece la estrategia general para supervisar los componentes de la plataforma y relacionar sus diferentes señales operativas.

## Alertas

[Alertas](Alertas/alertas.md) documenta las condiciones que pueden generar alertas, sus niveles de severidad, umbrales, escalamiento y relación con incidentes.

## Trazabilidad

[Trazabilidad](Trazabilidad/trazabilidad.md) documenta los mecanismos utilizados para relacionar una operación con los diferentes componentes involucrados en su procesamiento.

## Auditoría

[Auditoría](Auditoria/auditoria.md) documenta los eventos que requieren persistencia para fines de seguimiento, seguridad y análisis posterior.

## Rendimiento

[Rendimiento](Rendimiento/rendimiento.md) documenta los indicadores, líneas base y procedimientos relacionados con el rendimiento de la plataforma.

## Seguridad

[Seguridad](Seguridad/seguridad.md) documenta la observabilidad de autenticación, autorización, sesiones, tokens, aislamiento multiempresa y eventos de seguridad.

## Diagnóstico

[Diagnóstico](Diagnostico/diagnostico.md) documenta los procedimientos utilizados para investigar errores, degradaciones, incidentes y problemas de disponibilidad.

## Estado actual

La plataforma dispone de mecanismos distribuidos de logging, auditoría, health checks, trazabilidad, métricas de frontend, gestión de procesos mediante PM2 y registros específicos para operaciones de IA.

La estrategia de observabilidad se encuentra documentada por responsabilidades para facilitar su evolución y permitir incorporar posteriormente mecanismos adicionales de métricas, alertas, monitoreo y diagnóstico.

## Aspectos pendientes

Queda pendiente consolidar progresivamente:

- Métricas operativas del backend.
- Métricas de MySQL y Redis.
- Pruebas de carga y rendimiento.
- Umbrales basados en líneas base reales.
- Alertas operativas.
- Correlación uniforme de solicitudes.
- Monitoreo centralizado cuando corresponda.
- Automatización de recopilación de evidencia.
- Procedimientos operativos de respuesta ante incidentes.

## Documentación relacionada

| Documento | Relación |
|---|---|
| [Arquitectura](../Arquitectura/architecture.md) | Define los componentes y responsabilidades arquitectónicas de la plataforma. |
| [API](../API/api-contracts.md) | Define los contratos utilizados por las operaciones observadas. |
| [Base de Datos](../Base%20de%20Datos/database.md) | Documenta la estructura y comportamiento de la persistencia. |
| [CI/CD](../CI-CD/ci-cd.md) | Define los controles automatizados relacionados con integración y entrega. |
| [Despliegue](../Despliegue/deployment.md) | Documenta la operación de la plataforma en sus diferentes entornos. |
| [Decisiones técnicas](../Decisiones%20Técnicas/decisions.md) | Registra decisiones que pueden afectar la observabilidad y operación. |
| [Deuda técnica](../Decisiones%20Técnicas/technical-debt.md) | Registra aspectos pendientes que pueden afectar la mantenibilidad y operación. |
