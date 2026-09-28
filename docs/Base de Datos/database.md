# Base de datos

## Descripción

La base de datos constituye la capa principal de persistencia del sistema ERP SaaS y utiliza MySQL para almacenar la información operativa, comercial, administrativa y de seguridad.

## Motor y versión

- Motor: MySQL
- Versión: 8.0.44
- Base de datos: `inventario_proformas`

## Arquitectura de persistencia

```text
Frontend
   ↓
Backend
   ↓
Services
   ↓
Repositories / Data Access
   ↓
MySQL
