# Proveedor Materiales

## Descripción

La tabla `proveedor_materiales` establece la relación entre los proveedores y los materiales que pueden suministrar.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único de la relación. Es clave primaria y autoincremental. |
| `proveedor_id` | int | No | — | Identificador del proveedor asociado. |
| `material_id` | int | No | — | Identificador del material asociado. |

## Clave primaria

- `PRIMARY KEY (id)`

## Restricciones de unicidad

La combinación de:

- `proveedor_id`
- `material_id`

es única.

Esto evita registrar más de una relación entre el mismo proveedor y material.

## Claves foráneas

| Columna | Referencia | Acción |
|---|---|---|
| `proveedor_id` | `proveedores.id` | `ON DELETE CASCADE` |
| `material_id` | `materiales.id` | `ON DELETE CASCADE` |

## Índices

La tabla dispone de índices asociados a las claves foráneas y a la combinación única de proveedor y material.

## Relaciones

- Un registro relaciona un proveedor con un material.
- Un proveedor puede estar relacionado con múltiples materiales.
- Un material puede estar relacionado con múltiples proveedores.
- La eliminación de un proveedor elimina en cascada sus relaciones.
- La eliminación de un material elimina en cascada sus relaciones.

## Modelo de relación

La entidad funciona como tabla intermedia para representar una relación de muchos a muchos entre `proveedores` y `materiales`.

## Referencia del esquema

Tabla definida como `proveedor_materiales` en la base de datos `inventario_proformas`.
