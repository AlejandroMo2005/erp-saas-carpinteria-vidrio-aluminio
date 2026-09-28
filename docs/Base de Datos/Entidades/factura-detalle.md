# Factura Detalle

## Descripción

La tabla `factura_detalle` almacena los elementos que conforman una factura, incluyendo el material, descripción, cantidad, precios, descuentos, impuestos y totales correspondientes.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único del detalle. |
| `factura_id` | int | No | — | Identificador de la factura a la que pertenece el detalle. |
| `material_id` | int | Sí | `NULL` | Identificador del material asociado. |
| `codigo_principal` | varchar | Sí | `NULL` | Código principal del producto o material. |
| `codigo_auxiliar` | varchar | Sí | `NULL` | Código auxiliar del producto o material. |
| `descripcion` | varchar | No | — | Descripción del elemento facturado. |
| `cantidad` | decimal(10,2) | No | — | Cantidad facturada. |
| `precio_unitario` | decimal(10,2) | No | — | Precio unitario del elemento. |
| `descuento` | decimal(10,2) | No | `0.00` | Valor del descuento aplicado. |
| `precio_total_sin_impuestos` | decimal(10,2) | No | — | Valor total del detalle antes de impuestos. |
| `codigo_impuesto` | varchar | Sí | `NULL` | Código del impuesto correspondiente. |
| `codigo_porcentaje` | varchar | Sí | `NULL` | Código del porcentaje de impuesto. |
| `tarifa` | decimal(10,2) | Sí | `NULL` | Tarifa aplicada al impuesto. |
| `base_imponible` | decimal(10,2) | Sí | `NULL` | Base imponible utilizada para calcular el impuesto. |
| `valor_impuesto` | decimal(10,2) | Sí | `NULL` | Valor calculado del impuesto. |
| `detalle_adicional` | json | Sí | `NULL` | Información adicional del detalle en formato JSON. |

## Clave primaria

- `PRIMARY KEY (id)`

## Claves foráneas

| Columna | Referencia |
|---|---|
| `factura_id` | `facturas.id` |
| `material_id` | `materiales.id` |

## Relaciones

- Un detalle pertenece a una factura.
- Un detalle puede estar asociado a un material.
- Una factura puede contener múltiples registros de `factura_detalle`.
- Un material puede estar asociado a múltiples detalles de factura.

## Información tributaria

La entidad conserva los datos necesarios para representar los impuestos aplicados a cada detalle:

- Código del impuesto.
- Código del porcentaje.
- Tarifa.
- Base imponible.
- Valor del impuesto.

## Valores monetarios

El detalle almacena de forma independiente la cantidad, el precio unitario, el descuento y el valor total sin impuestos.

También conserva el valor del impuesto para mantener el detalle tributario de la línea facturada.

## Información adicional

El campo `detalle_adicional` permite almacenar información complementaria en formato JSON sin modificar la estructura principal de la entidad.

## Integridad

La tabla incluye restricciones sobre cantidades, precios, descuentos y valores monetarios para mantener la consistencia de los datos de facturación.

## Integración con facturas

Los registros de esta tabla participan en el cálculo de los totales almacenados en `facturas`, mediante el trigger `actualizar_totales_factura`.

## Referencia del esquema

Tabla definida como `factura_detalle` en la base de datos `inventario_proformas`.
