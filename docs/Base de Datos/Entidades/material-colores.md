# Material Colores

## Descripción

La tabla `material_colores` establece la relación entre los materiales y los colores disponibles para cada uno.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único de la relación. Es clave primaria y autoincremental. |
| `material_id` | int | No | — | Identificador del material asociado. |
| `color_id` | int | No | — | Identificador del color asociado. |

## Clave primaria

- `PRIMARY KEY (id)`

## Claves foráneas

| Columna | Referencia | Acción |
|---|---|---|
| `material_id` | `materiales.id` | `ON DELETE CASCADE` |
| `color_id` | `colores.id` | `ON DELETE CASCADE` |

## Restricciones de unicidad

La combinación de:

- `material_id`
- `color_id`

es única.

Esto evita registrar más de una relación entre el mismo material y color.

## Índices

La tabla dispone de índices asociados a:

- `material_id`
- `color_id`
- La combinación `material_id` + `color_id`.

## Relaciones

- Un registro relaciona un material con un color.
- Un material puede relacionarse con múltiples colores.
- Un color puede relacionarse con múltiples materiales.
- La eliminación de un material elimina en cascada sus relaciones.
- La eliminación de un color elimina en cascada sus relaciones.

## Modelo de relación

La entidad funciona como tabla intermedia para representar la relación de muchos a muchos entre `materiales` y `colores`.

## Referencia del esquema

Tabla definida como `material_colores` en la base de datos `inventario_proformas`.
