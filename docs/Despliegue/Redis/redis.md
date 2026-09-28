# Despliegue de Redis

## Descripción

Redis es un componente auxiliar de la plataforma ERP/SaaS utilizado por el backend para operaciones que requieren almacenamiento temporal y acceso rápido a información relacionada con autenticación y gestión de tokens.

Su función principal dentro de la arquitectura actual está relacionada con la lista negra de tokens y otros mecanismos temporales del backend.

Redis no constituye la fuente principal de persistencia empresarial. La información permanente del sistema se mantiene en MySQL.

---

## Objetivo

El despliegue de Redis debe garantizar:

- Disponibilidad para el backend cuando sus funcionalidades dependan del servicio.
- Separación entre entornos.
- Protección de acceso.
- Gestión segura de credenciales.
- Configuración mediante variables de entorno.
- Recuperación controlada ante fallos.
- Uso adecuado de memoria.
- Compatibilidad con los mecanismos de autenticación.
- Integración con CI/CD e infraestructura.
- Evitar que Redis sea utilizado como sustituto de la persistencia principal.

---

## Tecnología

| Componente | Configuración |
|---|---|
| Servicio | Redis |
| Uso principal | Almacenamiento temporal |
| Consumidor | Backend Node.js/Express |
| Persistencia principal de negocio | MySQL |
| Entornos | Desarrollo, testing, staging y producción |

La versión exacta de Redis debe definirse y fijarse según la infraestructura seleccionada.

---

## Arquitectura

La relación entre los componentes es:

```text
Frontend
    |
    v
Backend Node.js/Express
    |
    +--------> MySQL
    |
    +--------> Redis
