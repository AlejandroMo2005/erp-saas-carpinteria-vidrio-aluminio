# Solicitud Items

## Descripción

La tabla `solicitud_items` almacena los materiales incluidos en una solicitud de materiales.

## Estructura

La estructura de la entidad debe documentarse directamente a partir del esquema SQL de `inventario_proformas`, conservando los nombres, tipos, restricciones y valores por defecto definidos en la base de datos.

## Relaciones

- Cada registro pertenece a una solicitud de materiales.
- Cada registro referencia el material solicitado.
- La relación con `solicitudes_materiales` permite asociar los materiales con su solicitud correspondiente.
- La relación con `materiales` identifica el material solicitado.

## Integridad

Las claves foráneas mantienen la integridad referencial entre la solicitud, sus elementos y los materiales registrados.

## Referencia del esquema

Tabla definida como `solicitud_items` en la base de datos `inventario_proformas`.
