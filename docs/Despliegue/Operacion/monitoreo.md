# Monitoreo

## Descripción

El monitoreo permite observar el comportamiento operativo de la plataforma después del despliegue y detectar cambios que puedan afectar su disponibilidad, rendimiento, seguridad o estabilidad.

Debe complementar los health checks, logs y mecanismos de alerta, proporcionando información suficiente para identificar tendencias, incidentes y degradaciones.

---

## Objetivo

El monitoreo debe permitir:

- Detectar indisponibilidad.
- Identificar degradaciones de rendimiento.
- Observar consumo de recursos.
- Supervisar servicios críticos.
- Detectar errores recurrentes.
- Correlacionar incidentes con despliegues.
- Facilitar diagnóstico.
- Proporcionar evidencia operacional.
- Apoyar decisiones de recuperación.

---

## Componentes monitoreados

Los principales componentes son:

```text
Frontend
   |
Backend
   |
   +---- MySQL
   |
   +---- Redis
   |
   +---- Servicios externos
   |
Infraestructura
