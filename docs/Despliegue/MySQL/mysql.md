# Despliegue de MySQL

## Descripción

MySQL 8 constituye el sistema principal de persistencia de la plataforma ERP/SaaS. Almacena la información empresarial, usuarios, clientes, materiales, proformas, pedidos, facturación, auditoría, sesiones y demás entidades definidas por el modelo de datos.

El backend Node.js/Express establece la conexión con MySQL mediante un pool de conexiones y utiliza la base de datos `inventario_proformas`.

---

## Objetivo

El despliegue de MySQL debe garantizar:

- Persistencia confiable de la información.
- Aislamiento adecuado entre entornos.
- Integridad referencial.
- Disponibilidad para el backend.
- Gestión segura de credenciales.
- Capacidad de respaldo y recuperación.
- Control de cambios del esquema.
- Rendimiento adecuado.
- Protección frente a accesos no autorizados.
- Compatibilidad con las versiones del backend.

---

## Tecnología

| Componente | Configuración |
|---|---|
| Motor | MySQL |
| Versión objetivo | MySQL 8 |
| Base de datos | `inventario_proformas` |
| Cliente de aplicación | Node.js/Express |
| Pool de conexiones | Hasta 10 conexiones |
| Entornos | Desarrollo, testing, staging y producción |

La versión exacta del servidor debe mantenerse alineada con la infraestructura definida para cada entorno.

---

## Base de datos

La aplicación utiliza:

```text
inventario_proformas
