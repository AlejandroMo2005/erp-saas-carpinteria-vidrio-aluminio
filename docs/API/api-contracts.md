# Contratos de API

## Descripción

Este documento establece la estructura general de los contratos de comunicación entre el frontend y el backend de la aplicación ERP/SaaS.

## Índice

- [Descripción](#descripción)
- [Arquitectura de comunicación](#arquitectura-de-comunicación)
- [Base de las rutas](#base-de-las-rutas)
- [Formato de solicitudes](#formato-de-solicitudes)
- [Formato de respuestas](#formato-de-respuestas)
- [Autenticación](#autenticación)
- [Cookies y CSRF](#cookies-y-csrf)
- [Validación](#validación)
- [Errores](#errores)
- [Multiempresa](#multiempresa)
- [Compatibilidad](#compatibilidad)

## Arquitectura de comunicación

La aplicación utiliza una arquitectura cliente-servidor en la que:

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | React + Vite | Interfaz y consumo de la API. |
| Backend | Node.js + Express | Lógica de negocio y exposición de endpoints. |
| Base de datos | MySQL | Persistencia de la información. |
| Caché y sesiones | Redis | Gestión de información temporal y mecanismos asociados a autenticación. |

El frontend consume los endpoints HTTP expuestos por el backend.

## Base de las rutas

Las solicitudes de la aplicación utilizan el prefijo:

```text
/api
