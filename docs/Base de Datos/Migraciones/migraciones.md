# Migraciones de la Base de Datos

## Descripción

Este documento establece la estrategia para gestionar cambios estructurales sobre la base de datos `inventario_proformas`.

## Índice

- [Descripción](#descripción)
- [Objetivo](#objetivo)
- [Principios](#principios)
- [Cambios de esquema](#cambios-de-esquema)
- [Compatibilidad](#compatibilidad)
- [Validación](#validación)
- [Respaldo y recuperación](#respaldo-y-recuperación)

## Objetivo

Las migraciones deben permitir aplicar cambios controlados y reproducibles sobre la estructura de la base de datos, evitando modificaciones manuales que puedan generar diferencias entre los distintos entornos.

## Principios

Las modificaciones de la base de datos deben considerar:

- Trazabilidad de los cambios.
- Reproducibilidad entre entornos.
- Compatibilidad con la aplicación.
- Integridad referencial.
- Conservación de los datos existentes.
- Posibilidad de recuperación ante errores.

## Cambios de esquema

Los cambios estructurales pueden involucrar:

- Creación o modificación de tablas.
- Incorporación o modificación de columnas.
- Creación o modificación de índices.
- Incorporación de claves foráneas.
- Modificación de restricciones.
- Creación o modificación de triggers.
- Creación o modificación de procedimientos almacenados.

Los cambios deben ejecutarse de forma controlada y verificarse antes de utilizar la nueva estructura desde la aplicación.

## Compatibilidad

Antes de aplicar una modificación se debe comprobar la compatibilidad entre la versión actual del esquema y la versión de la aplicación que utilizará la nueva estructura.

Los cambios que puedan afectar operaciones existentes deben planificarse considerando las dependencias entre tablas, claves foráneas, índices, triggers y código de acceso a datos.

## Validación

Después de aplicar una migración se debe verificar:

- Existencia de las tablas modificadas.
- Existencia de las columnas esperadas.
- Estado de las claves primarias y foráneas.
- Estado de los índices.
- Funcionamiento de los triggers y procedimientos afectados.
- Integridad de los datos.
- Compatibilidad con las operaciones de la aplicación.

Las pruebas automatizadas deben ejecutarse cuando una modificación pueda afectar funcionalidades existentes.

## Respaldo y recuperación

Las modificaciones que puedan afectar datos existentes deben considerar un mecanismo de respaldo previo.

El respaldo permite recuperar el estado anterior en caso de que una migración produzca resultados inesperados o no pueda completarse correctamente.

Las operaciones de recuperación deben validarse antes de ejecutar cambios de alto impacto en un entorno con datos reales.
