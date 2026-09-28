# Health checks

## Descripción

Los health checks permiten verificar de forma automatizada el estado operativo de los componentes de la plataforma y detectar fallos antes de que afecten de forma prolongada a los usuarios.

El sistema debe distinguir entre disponibilidad de la aplicación y disponibilidad de sus dependencias. Una aplicación puede estar ejecutándose como proceso y, al mismo tiempo, presentar problemas de conectividad con MySQL, Redis u otros servicios necesarios.

---

## Objetivo

Los health checks deben permitir:

- Confirmar que la aplicación está disponible.
- Detectar fallos de dependencias críticas.
- Facilitar el monitoreo automático.
- Validar despliegues.
- Detectar problemas después de una actualización.
- Facilitar decisiones de rollback.
- Proporcionar información operacional sin exponer información sensible.

---

## Tipos de health check

Se pueden distinguir tres niveles:

### Liveness

Determina si el proceso de la aplicación está ejecutándose correctamente.

Su finalidad principal es detectar procesos detenidos o que no pueden responder.

```text
Proceso
   |
   v
¿Responde?
   |
   +---- No ----> Reinicio / intervención
   |
   +---- Sí ----> Continúa
