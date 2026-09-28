# Arquitectura de despliegue

## Descripción

Este documento describe la arquitectura lógica utilizada para desplegar el sistema ERP/SaaS y la relación entre sus principales componentes.

La solución está compuesta por un frontend desarrollado con React y Vite, un backend desarrollado con Node.js y Express, MySQL como sistema gestor de base de datos y Redis como servicio complementario.

## Componentes

### Frontend

El frontend proporciona la interfaz de usuario y las funcionalidades de interacción con el sistema.

Tecnologías principales:

- React.
- Vite.
- React Query.
- Axios.

En desarrollo, el frontend utiliza el puerto `3000`.

### Backend

El backend proporciona la API y concentra la lógica de negocio, autenticación, autorización, validaciones, acceso a datos y servicios internos.

Tecnologías principales:

- Node.js.
- Express.
- Zod.
- Redis.
- MySQL.

En desarrollo, el backend utiliza el puerto `5000`.

### MySQL

MySQL almacena la información persistente del sistema.

La base de datos utilizada por el proyecto es `inventario_proformas`.

Entre las principales áreas persistidas se encuentran:

- Empresas.
- Usuarios.
- Clientes.
- Materiales.
- Proformas.
- Pedidos.
- Facturas.
- Proveedores.
- Configuración.
- Auditoría.
- Sesiones.
- Solicitudes relacionadas con IA.

### Redis

Redis se utiliza como servicio complementario para operaciones que requieren almacenamiento temporal y control de estado asociado a la aplicación.

Entre sus usos se encuentra la gestión de elementos relacionados con autenticación y listas de revocación de tokens.

## Flujo de comunicación

La comunicación lógica entre los componentes principales puede representarse de la siguiente manera:

```text
                         Usuario
                            │
                            ▼
                    ┌───────────────┐
                    │    Frontend   │
                    │ React + Vite  │
                    │    Puerto 3000│
                    └───────┬───────┘
                            │
                         HTTP/HTTPS
                            │
                            ▼
                    ┌───────────────┐
                    │    Backend    │
                    │ Node + Express│
                    │    Puerto 5000│
                    └───────┬───────┘
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
             ┌───────────┐      ┌───────────┐
             │   MySQL   │      │   Redis   │
             │ Persistencia│     │ Temporal  │
             └───────────┘      └───────────┘
