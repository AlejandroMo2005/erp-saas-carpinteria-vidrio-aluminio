# Materiales Variantes

## Descripción

La tabla `materiales_variantes` almacena las variantes de los materiales según el color, junto con su stock y precio específicos.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único de la variante. Es clave primaria y autoincremental. |
| `material_id` | int | No | — | Identificador del material al que pertenece la variante. |
| `color_id` | int | No | — | Identificador del color asociado a la variante. |
| `stock` | decimal(10,2) | No | `0.00` | Stock disponible para la combinación material-color. |
| `precio` | decimal(10,2) | No | `0.00` | Precio correspondiente a la variante. |
| `updated_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de la última actualización. |

## Clave primaria

- `PRIMARY KEY (id)`

## Restricciones de unicidad

La combinación de:

- `material_id`
- `color_id`

es única.

Esto evita registrar más de una variante para el mismo material y color.

## Claves foráneas

| Columna | Referencia | Acción |
|---|---|---|
| `material_id` | `materiales.id` | `ON DELETE CASCADE` |
| `color_id` | `colores.id` | `ON DELETE CASCADE` |

## Índices

La restricción única sobre `material_id` y `color_id` proporciona un índice compuesto para identificar cada variante.

También existen índices asociados a las claves foráneas definidas en el esquema.

## Relaciones

- Una variante pertenece a un material.
- Una variante pertenece a un color.
- Un material puede tener múltiples variantes.
- Un color puede estar asociado a múltiples variantes.
- La eliminación de un material elimina sus variantes en cascada.
- La eliminación de un color elimina las variantes asociadas en cascada.

## Control de inventario

El campo `stock` permite mantener una cantidad independiente para cada combinación de material y color.

## Precio

El campo `precio` permite almacenar un valor específico para cada variante.

## Referencia del esquema

Tabla definida como `materiales_variantes` en la base de datos `inventario_proformas`.
