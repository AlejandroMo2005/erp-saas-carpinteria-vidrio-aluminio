# Pedidos

## Descripción

La tabla `pedidos` almacena los pedidos generados en el sistema y los relaciona con la empresa, el usuario responsable y, opcionalmente, una proforma de origen.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único del pedido. Es clave primaria y autoincremental. |
| `empresa_id` | int | No | `1` | Identificador de la empresa propietaria del pedido. |
| `fecha` | date | No | `CURRENT_DATE` | Fecha del pedido. |
| `estado` | enum | No | `PENDIENTE` | Estado actual del pedido. |
| `total` | decimal(10,2) | No | `0.00` | Valor total del pedido. |
| `created_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de creación. |
| `updated_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de la última actualización. |
| `usuario_id` | int | Sí | `NULL` | Usuario asociado al pedido. |
| `proforma_id` | int | Sí | `NULL` | Proforma relacionada con el pedido. |
| `observaciones` | text | Sí | `NULL` | Observaciones adicionales del pedido. |
| `deleted_at` | timestamp | Sí | `NULL` | Fecha y hora de eliminación lógica. |

## Estados

El campo `estado` utiliza los siguientes valores:

- `PENDIENTE`
- `PROCESADO`
- `ENTREGADO`
- `CANCELADO`

## Clave primaria

- `PRIMARY KEY (id)`

## Claves foráneas

| Columna | Referencia | Acción |
|---|---|---|
| `empresa_id` | `empresas.id` | `ON UPDATE CASCADE` |
| `usuario_id` | `usuarios.id` | `ON DELETE SET NULL` |
| `proforma_id` | `proformas.id` | `ON DELETE SET NULL` |

## Índices

La tabla dispone de índices asociados a:

- `empresa_id`
- `fecha`
- `estado`
- `usuario_id`
- `proforma_id`
- `deleted_at`
- combinación de `empresa_id` y `fecha`

## Relaciones

- Un pedido pertenece a una empresa.
- Un pedido puede estar asociado a un usuario.
- Un pedido puede originarse a partir de una proforma.
- Un pedido puede contener múltiples registros en `pedido_detalle`.
- La eliminación de un usuario establece `usuario_id` en `NULL`.
- La eliminación de la proforma relacionada establece `proforma_id` en `NULL`.

## Multi-tenancy

El campo `empresa_id` identifica la empresa propietaria del pedido y permite mantener la separación de datos entre empresas.

## Eliminación lógica

El campo `deleted_at` permite marcar un pedido como eliminado sin eliminar físicamente el registro de la base de datos.

## Total del pedido

El campo `total` almacena el valor acumulado del pedido. La actualización del total se encuentra vinculada al trigger `actualizar_total_pedido`, que recalcula el valor a partir de los registros de `pedido_detalle`.

## Referencia del esquema

Tabla definida como `pedidos` en la base de datos `inventario_proformas`.
