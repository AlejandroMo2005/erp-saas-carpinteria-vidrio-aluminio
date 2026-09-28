# Entorno de desarrollo

## Descripción

El entorno de desarrollo está orientado a la programación, integración y validación local de los cambios realizados sobre el sistema ERP/SaaS.

Este entorno permite ejecutar frontend, backend y servicios auxiliares de manera independiente durante el proceso de desarrollo.

## Objetivo

Proporcionar un entorno controlado para:

- Desarrollar nuevas funcionalidades.
- Refactorizar componentes existentes.
- Ejecutar pruebas unitarias e integración.
- Ejecutar análisis estático.
- Validar cambios antes de incorporarlos al flujo de CI/CD.
- Detectar errores durante el desarrollo.

## Componentes

El entorno contempla los siguientes componentes:

| Componente | Tecnología | Puerto de desarrollo |
|---|---|---:|
| Frontend | React + Vite | 3000 |
| Backend | Node.js + Express | 5000 |
| Base de datos | MySQL 8 | Configurado mediante variables de entorno |
| Cache/estado auxiliar | Redis | Configurado mediante variables de entorno |

## Frontend

El frontend se ejecuta mediante Vite en modo desarrollo.

El servidor de desarrollo utiliza el puerto `3000`.

El frontend consume la API mediante el prefijo `/api`.

La configuración de Vite permite redirigir las solicitudes de API hacia el backend local.

## Backend

El backend se ejecuta mediante Node.js y Express.

Durante el desarrollo puede utilizarse el proceso de desarrollo configurado con Nodemon para reiniciar automáticamente la aplicación cuando se detectan cambios.

El backend utiliza el puerto `5000`.

## Base de datos

El entorno de desarrollo requiere una instancia de MySQL compatible con la estructura de la base de datos utilizada por el proyecto.

La conexión se configura mediante variables de entorno.

La base de datos utilizada por el proyecto es:

```text
inventario_proformas
