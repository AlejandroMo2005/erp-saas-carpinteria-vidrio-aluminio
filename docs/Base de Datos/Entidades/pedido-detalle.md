# Pedido Detalle

## Descripción

La tabla `pedido_detalle` almacena los materiales incluidos en cada pedido, junto con la cantidad, el precio unitario y la información adicional del detalle.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único del detalle. Es clave primaria y autoincremental. |
| `pedido_id` | int | No | — | Identificador del pedido al que pertenece el detalle. |
| `material_id` | int | No | — | Identificador del material asociado. |
| `cantidad` | decimal(10,2) | No | — | Cantidad del material incluida en el pedido. |
| `precio_unitario` | decimal(10,2) | No | — | Precio unitario utilizado para el material. |
| `detalle` | text | Sí | `NULL` | Información adicional asociada al detalle. |

## Clave primaria

- `PRIMARY KEY (id)`

## Claves foráneas

| Columna | Referencia | Acción |
|---|---|---|
| `pedido_id` | `pedidos.id` | `ON DELETE CASCADE` |
| `material_id` | `materiales.id` | `ON DELETE RESTRICT` |

## Índices

La tabla dispone de índices asociados a:

- `pedido_id`
- `material_id`

## Relaciones

- Un registro de `pedido_detalle` pertenece a un pedido.
- Un registro de `pedido_detalle` referencia un material.
- Un pedido puede contener múltiples registros de `pedido_detalle`.
- Un material puede estar asociado a múltiples registros de `pedido_detalle`.
- La eliminación de un pedido elimina en cascada sus registros de detalle.
- La eliminación de un material está restringida cuando existen detalles asociados.

## Integridad de datos

La cantidad y el precio unitario se almacenan mediante tipos decimales para conservar precisión en cantidades y valores monetarios.

## Total del pedido

La tabla participa en la actualización del total de `pedidos` mediante el trigger `actualizar_total_pedido`, que recalcula el valor del pedido a partir de sus detalles.

## Referencia del esquema

Tabla definida como `pedido_detalle` en la base de datos `inventario_proformas`.
