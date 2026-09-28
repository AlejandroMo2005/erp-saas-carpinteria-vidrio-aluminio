# Arquitectura

## Descripción

La aplicación está estructurada como una plataforma web empresarial full-stack, compuesta por un frontend, un backend, una base de datos relacional y servicios complementarios.

## Índice

- [Descripción](#descripción)
- [Arquitectura general](#arquitectura-general)
- [Frontend](#frontend)
- [Backend](#backend)
- [Base de datos](#base-de-datos)
- [Redis](#redis)
- [Inteligencia artificial](#inteligencia-artificial)
- [Seguridad](#seguridad)
- [Comunicación entre capas](#comunicación-entre-capas)
- [Estructura modular](#estructura-modular)
- [Ejecución](#ejecución)

## Arquitectura general

La solución utiliza una arquitectura por capas en la que el frontend consume servicios HTTP proporcionados por el backend.

```text
┌──────────────────────────────┐
│          Frontend            │
│       React + Vite           │
└──────────────┬───────────────┘
               │ HTTP / JSON
               ▼
┌──────────────────────────────┐
│           Backend            │
│       Node.js + Express      │
└───────┬──────────────┬───────┘
        │              │
        ▼              ▼
┌──────────────┐ ┌──────────────┐
│    MySQL     │ │    Redis     │
│ Persistencia │ │ Datos temp.  │
└──────────────┘ └──────────────┘
