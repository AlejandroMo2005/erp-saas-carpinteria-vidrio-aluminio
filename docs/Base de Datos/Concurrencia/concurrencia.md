# Concurrencia de la Base de Datos

## Descripción

Este documento describe los aspectos de concurrencia relevantes para la base de datos `inventario_proformas`, considerando operaciones simultáneas sobre inventario, documentos comerciales, sesiones y secuencias.

## Índice

- [Descripción](#descripción)
- [Operaciones concurrentes](#operaciones-concurrentes)
- [Inventario](#inventario)
- [Documentos comerciales](#documentos-comerciales)
- [Secuencias de comprobantes](#secuencias-de-comprobantes)
- [Sesiones y tokens](#sesiones-y-tokens)
- [Integridad transaccional](#integridad-transaccional)
- [Consideraciones](#consideraciones)

## Operaciones concurrentes

La aplicación puede ejecutar operaciones simultáneas sobre registros relacionados con diferentes usuarios y empresas.

Las operaciones que modifican datos deben considerar la posibilidad de que dos o más solicitudes intenten modificar el mismo registro de manera concurrente.

Los principales puntos de atención corresponden a:

- Actualización de inventario.
- Creación y modificación de documentos comerciales.
- Generación de secuencias de comprobantes.
- Gestión de sesiones.
- Actualización de información relacionada entre tablas.

## Inventario

Las operaciones sobre `materiales` y `materiales_variantes` pueden modificar cantidades de stock.

Cuando varias operaciones afectan simultáneamente el mismo material o variante, la aplicación debe evitar que una operación sobrescriba los cambios realizados por otra operación.

Las operaciones críticas de inventario deben ejecutarse dentro de transacciones cuando involucren varias modificaciones que deban mantenerse como una única unidad lógica.

## Documentos comerciales

Las entidades `proformas`, `pedidos` y `facturas` mantienen información relacionada con sus respectivos detalles.

La creación de un documento y sus registros de detalle debe mantener consistencia entre:

- Cabecera.
- Detalles.
- Totales derivados.
- Relaciones con materiales.
- Relaciones con usuarios y empresas.

Las operaciones que involucren múltiples registros deben considerar el uso de transacciones para evitar estados parcialmente persistidos.

## Secuencias de comprobantes

La tabla `secuencias_comprobantes` mantiene la secuencia de comprobantes por empresa, tipo de comprobante, establecimiento y punto de emisión.

La generación de un nuevo número debe controlar las operaciones concurrentes sobre la misma secuencia para evitar la asignación duplicada de números.

La restricción `UNIQUE` definida sobre:

```text
empresa_id
tipo_comprobante
establecimiento
punto_emision
