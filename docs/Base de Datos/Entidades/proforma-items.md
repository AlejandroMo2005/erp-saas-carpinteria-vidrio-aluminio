# Proforma Items

## Descripción

La tabla `proforma_items` almacena los ítems de una proforma asociados con un trabajo, incluyendo sus dimensiones, cantidad, color, precio unitario y subtotal.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único del ítem. Es clave primaria y autoincremental. |
| `proforma_id` | int | No | — | Identificador de la proforma a la que pertenece el ítem. |
| `trabajo_id` | int | No | — | Identificador del trabajo asociado al ítem. |
| `color_id` | int | Sí | `NULL` | Identificador del color asociado al ítem. |
| `ancho` | decimal(10,2) | No | — | Ancho registrado para el ítem. |
| `alto` | decimal(10,2) | No | — | Alto registrado para el ítem. |
| `cantidad` | int | No | `1` | Cantidad de unidades del ítem. |
| `detalle` | text | Sí | `NULL` | Información adicional del ítem. |
| `precio_unitario` | decimal(10,2) | No | `0.00` | Precio unitario calculado al guardar, según el esquema, a partir del precio por m² y las dimensiones. |
| `subtotal` | decimal(10,2) | No | `0.00` | Subtotal del ítem, correspondiente al precio unitario multiplicado por la cantidad, sin IVA. |
| `created_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de creación del registro. |

## Clave primaria

- `PRIMARY KEY (id)`

## Claves foráneas

| Restricción | Columna | Referencia | Acción |
|---|---|---|---|
| `fk_proforma_items_color` | `color_id` | `colores.id` | `ON DELETE SET NULL` |
| `fk_proforma_items_proforma` | `proforma_id` | `proformas.id` | `ON DELETE CASCADE` |
| `fk_proforma_items_trabajo` | `trabajo_id` | `trabajos.id` | `ON DELETE RESTRICT` |

## Índices

- `idx_proforma_items_proforma_id` sobre `proforma_id`
- `idx_proforma_items_trabajo_id` sobre `trabajo_id`
- `idx_proforma_items_color_id` sobre `color_id`

## Relaciones

- Un registro de `proforma_items` pertenece a una `proforma`.
- Un registro de `proforma_items` referencia un `trabajo`.
- Un registro de `proforma_items` puede asociarse opcionalmente con un `color`.
- La eliminación de una `proforma` elimina en cascada sus registros relacionados en `proforma_items`.
- La eliminación de un `color` establece `color_id` en `NULL`.
- La eliminación de un `trabajo` está restringida cuando existen registros asociados.

## Cálculo del precio

El campo `precio_unitario` incluye en el esquema el comentario:

> Precio por m² × ancho × alto calculado al guardar

El campo `subtotal` incluye en el esquema el comentario:

> precio_unitario × cantidad (sin IVA)

## Referencia del esquema

Tabla definida como `proforma_items` en la base de datos `inventario_proformas`.
