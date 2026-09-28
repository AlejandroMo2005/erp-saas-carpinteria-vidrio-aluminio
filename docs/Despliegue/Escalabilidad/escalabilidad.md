# Escalabilidad

## Propósito

Este documento define los criterios para la escalabilidad de la plataforma durante su despliegue y operación.

## Objetivos

La estrategia de escalabilidad debe permitir:

- Incrementar la capacidad de procesamiento.
- Atender un mayor número de usuarios.
- Mantener tiempos de respuesta adecuados.
- Evitar saturación de recursos.
- Separar componentes con diferentes necesidades de capacidad.
- Facilitar la evolución de la infraestructura.

## Componentes

La plataforma está compuesta principalmente por:

- Frontend React/Vite.
- Backend Node.js/Express.
- MySQL.
- Redis.
- Servicios externos de IA.

Cada componente presenta necesidades diferentes de escalabilidad.

## Frontend

El frontend generado por Vite puede distribuirse mediante infraestructura capaz de servir contenido estático.

La escalabilidad del frontend depende principalmente de:

- Solicitudes HTTP.
- Transferencia de archivos.
- Caché.
- CDN cuando corresponda.
- Optimización de recursos.

La separación entre frontend y backend permite escalar ambos componentes de manera independiente.

## Backend

El backend Node.js/Express debe poder ejecutarse mediante múltiples procesos o instancias cuando la demanda lo requiera.

PM2 forma parte de la estrategia actual de ejecución.

La configuración puede utilizar múltiples procesos cuando la infraestructura disponga de recursos suficientes.

La aplicación debe evitar depender de estado exclusivamente almacenado en memoria cuando dicho estado deba compartirse entre instancias.

## Autenticación y sesiones

El access token se mantiene en memoria del cliente y el refresh token utiliza una cookie `httpOnly`.

La blacklist de tokens utiliza Redis y persistencia en MySQL.

Esta arquitectura permite que la información necesaria para validar la revocación pueda compartirse entre diferentes procesos del backend.

## Redis

Redis permite centralizar información temporal utilizada por diferentes procesos.

La blacklist de tokens utiliza claves con el formato:

```text
bl:<jti>
