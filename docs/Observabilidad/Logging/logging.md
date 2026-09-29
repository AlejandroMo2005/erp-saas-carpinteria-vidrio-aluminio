# Logging

## Descripción

Documenta la estrategia de registro de eventos de la plataforma, incluyendo niveles de log, formato, contexto, seguridad, manejo de errores y uso operativo. Este documento se enfoca exclusivamente en la responsabilidad de logging.

## Índice

- [Propósito](#propósito)
- [Sistema de logging](#sistema-de-logging)
- [Niveles de log](#niveles-de-log)
- [Contexto de los registros](#contexto-de-los-registros)
- [Eventos registrados](#eventos-registrados)
- [Seguridad de los logs](#seguridad-de-los-logs)
- [Errores y excepciones](#errores-y-excepciones)
- [Logging en procesos críticos](#logging-en-procesos-críticos)
- [Entornos](#entornos)
- [Operación y diagnóstico](#operación-y-diagnóstico)
- [Estado actual](#estado-actual)
- [Documentación relacionada](#documentación-relacionada)

## Propósito

El logging permite registrar información relevante sobre el comportamiento de la aplicación para facilitar la operación, diagnóstico de errores, análisis de incidentes y seguimiento de eventos importantes.

Los registros deben proporcionar información suficiente para comprender qué ocurrió sin exponer credenciales, tokens, contraseñas u otra información sensible.

## Sistema de logging

El backend utiliza Winston como mecanismo de logging.

La implementación actual se encuentra centralizada en:

```text
backend/src/shared/utils/logger.js
