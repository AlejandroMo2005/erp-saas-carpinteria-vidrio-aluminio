# Despliegue con Docker

## Descripción

Docker proporciona un mecanismo de empaquetado y ejecución mediante contenedores que puede utilizarse para reproducir los componentes de la plataforma ERP/SaaS de forma aislada.

La arquitectura contempla potencialmente contenedores independientes para frontend, backend, MySQL y Redis.

El uso de Docker permite separar dependencias, simplificar la configuración de entornos y facilitar la reproducibilidad. La adopción definitiva de Docker para producción permanece pendiente de definición.

---

## Objetivo

El uso de Docker debe permitir:

- Reproducir entornos de ejecución.
- Aislar servicios.
- Mantener versiones controladas.
- Reducir diferencias entre entornos.
- Facilitar pruebas de integración.
- Simplificar el aprovisionamiento.
- Integrarse con CI/CD.
- Facilitar la recuperación de servicios.
- Mantener configuraciones separadas de los secretos.

---

## Componentes

La arquitectura puede contener los siguientes servicios:

```text
Docker
├── Frontend
├── Backend
├── MySQL
└── Redis
