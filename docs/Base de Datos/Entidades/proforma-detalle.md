# Proforma Detalle

## Descripción

La tabla `proforma_detalle` almacena los materiales asociados directamente a una proforma, junto con la cantidad y el precio unitario utilizado.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único del detalle. Es clave primaria y autoincremental. |
| `proforma_id` | int | No | — | Identificador de la proforma a la que pertenece el detalle. |
| `material_id` | int | No | — | Identificador del material asociado. |
| `cantidad` | decimal(10,2) | No | — | Cantidad del material incluida en la proforma. |
| `precio_unitario` | decimal(10,2) | No | — | Precio unitario utilizado para el material. |

## Clave primaria

- `PRIMARY KEY (id)`

## Claves foráneas

| Restricción | Columna | Referencia | Acción |
|---|---|---|---|
| `fk_proforma_detalle_proforma` | `proforma_id` | `proformas.id` | `ON DELETE CASCADE` |
| `fk_proforma_detalle_material` | `material_id` | `materiales.id` | `ON DELETE RESTRICT` |

## Índices

- `idx_proforma_detalle_proforma_id` sobre `proforma_id`
- `idx_proforma_detalle_material_id` sobre `material_id`

## Relaciones

- Un registro de `proforma_detalle` pertenece a una `proforma`.
- Un registro de `proforma_detalle` referencia un `material`.
- Una `proforma` puede contener múltiples registros de `proforma_detalle`.
- Un `material` puede estar asociado a múltiples registros de `proforma_detalle`.
- La eliminación de una `proforma` elimina en cascada sus detalles.
- La eliminación de un material está restringida cuando existen detalles asociados.

## Integridad de datos

La cantidad y el precio unitario se almacenan como valores decimales para representar cantidades y valores monetarios con precisión de dos posiciones decimales.

## Total de la proforma

La tabla participa en la actualización del total de la proforma mediante el trigger `actualizar_total_proforma`, que recalcula el campo `proformas.total` a partir de los detalles registrados.

## Referencia del esquema

Tabla definida como `proforma_detalle` en la base de datos `inventario_proformas`.
