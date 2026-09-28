# Logs

## Descripción

Los logs registran eventos relevantes de la aplicación y proporcionan información para diagnóstico, monitoreo, auditoría operacional y análisis de incidentes.

El sistema debe mantener una separación clara entre logs técnicos y registros de auditoría funcional, evitando almacenar información sensible innecesaria.

---

## Objetivo

Los logs deben permitir:

- Identificar errores.
- Diagnosticar fallos.
- Correlacionar eventos.
- Analizar incidentes.
- Observar comportamiento operacional.
- Relacionar problemas con despliegues.
- Facilitar soporte y mantenimiento.
- Proporcionar evidencia técnica.

---

## Backend

El backend utiliza Winston para registrar eventos de aplicación.

Los logs deben permitir observar, según corresponda:

- Inicio de procesos.
- Errores.
- Advertencias.
- Operaciones relevantes.
- Fallos de autenticación.
- Errores de integración.
- Problemas de persistencia.
- Eventos relacionados con servicios externos.

---

## Niveles de log

Los niveles deben utilizarse según la importancia del evento.

Conceptualmente:

```text
error
  -> fallo que requiere atención

warn
  -> situación anómala o potencialmente problemática

info
  -> evento operacional relevante

debug
  -> información detallada para diagnóstico
