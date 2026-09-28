# Requisitos de infraestructura

## Descripción

Este documento define los requisitos técnicos que debe cumplir la infraestructura necesaria para ejecutar y desplegar el sistema ERP/SaaS.

Los requisitos se organizan según los componentes principales de la aplicación y distinguen entre las capacidades actualmente conocidas y aquellas que dependen de la infraestructura definitiva de despliegue.

## Objetivo

Establecer una referencia para seleccionar, preparar y validar la infraestructura requerida por el sistema.

## Componentes de infraestructura

La infraestructura debe proporcionar soporte para los siguientes componentes:

| Componente | Requisito |
|---|---|
| Frontend | Entorno capaz de servir el build generado por React/Vite |
| Backend | Entorno compatible con Node.js |
| MySQL | MySQL 8 |
| Redis | Instancia compatible con Redis |
| Procesos | PM2 para administración del backend |
| Red | Comunicación HTTP/HTTPS entre componentes |
| Almacenamiento | Espacio para aplicación, logs y respaldos según configuración |
| CI/CD | Plataforma capaz de ejecutar los pipelines definidos |

## Requisitos del frontend

El frontend requiere un entorno capaz de servir los archivos estáticos generados por el proceso de build.

Durante desarrollo se utiliza Vite, pero el servidor de producción definitivo puede ser diferente.

El entorno debe permitir:

- Servir archivos estáticos.
- Configurar variables utilizadas durante el build.
- Exponer la aplicación mediante HTTPS cuando corresponda.
- Resolver correctamente las rutas del frontend.
- Comunicar el frontend con la API.

## Requisitos del backend

El backend requiere un entorno compatible con Node.js y con las dependencias definidas en su `package.json`.

La ejecución productiva utiliza PM2 como administrador de procesos.

El entorno debe proporcionar:

- Node.js compatible con la versión definida por el proyecto.
- npm.
- Acceso a MySQL.
- Acceso a Redis.
- Variables de entorno.
- Permisos adecuados para ejecutar la aplicación.
- Recursos suficientes de CPU y memoria.
- Acceso de red hacia los servicios requeridos.

## Node.js

La versión objetivo utilizada durante el desarrollo es:

```text
Node.js 20.19.4
