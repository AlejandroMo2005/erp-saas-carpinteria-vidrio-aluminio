# Facturas

## Descripción

La tabla `facturas` almacena las facturas generadas por el sistema y su información relacionada con la empresa, usuario, cliente, secuencia de comprobante y proceso de autorización electrónica.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único de la factura. |
| `empresa_id` | int | No | `1` | Empresa propietaria de la factura. |
| `numero_factura` | varchar | No | — | Número de factura asignado al comprobante. |
| `clave_acceso` | varchar | Sí | `NULL` | Clave de acceso del comprobante electrónico. |
| `estado` | enum | No | `BORRADOR` | Estado de la factura dentro del sistema. |
| `estado_sri` | enum | No | `PENDIENTE` | Estado de procesamiento ante el SRI. |
| `subtotal_sin_iva` | decimal(10,2) | No | `0.00` | Subtotal correspondiente a valores sin IVA. |
| `subtotal_con_iva` | decimal(10,2) | No | `0.00` | Subtotal correspondiente a valores gravados con IVA. |
| `iva` | decimal(10,2) | No | `0.00` | Valor del IVA calculado. |
| `total` | decimal(10,2) | No | `0.00` | Valor total de la factura. |
| `created_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de creación. |
| `updated_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de actualización. |

## Estados de la factura

El campo `estado` utiliza los siguientes valores:

- `BORRADOR`
- `EMITIDA`
- `AUTORIZADA`
- `ANULADA`
- `DEVUELTA`
- `NO_AUTORIZADA`

## Estados SRI

El campo `estado_sri` utiliza los siguientes valores:

- `PENDIENTE`
- `RECIBIDA`
- `DEVUELTA`
- `AUTORIZADA`
- `NO_AUTORIZADA`
- `SIN_ENVIAR`

## Clave primaria

- `PRIMARY KEY (id)`

## Restricciones de unicidad

La entidad mantiene unicidad por empresa para:

- `empresa_id` + `numero_factura`
- `empresa_id` + `clave_acceso`

Esto evita duplicidades de numeración y de claves de acceso dentro de una misma empresa.

## Claves foráneas

La tabla mantiene relaciones con las entidades definidas en el esquema para la empresa, usuario y demás registros asociados al proceso de facturación.

## Relaciones

- Una factura pertenece a una empresa.
- Una factura puede estar asociada a un usuario.
- Una factura puede contener múltiples registros en `factura_detalle`.
- Una factura puede relacionarse con registros de autorización SRI según el flujo de facturación electrónica.

## Multi-tenancy

El campo `empresa_id` identifica la empresa propietaria de cada factura. Las restricciones de unicidad relacionadas con la numeración y la clave de acceso también consideran la empresa.

## Totales

La factura almacena separadamente:

- Subtotal sin IVA.
- Subtotal con IVA.
- IVA.
- Total.

Los valores se relacionan con los registros almacenados en `factura_detalle` mediante el mecanismo de actualización de totales definido en el esquema.

## Integridad

La entidad contiene restricciones para mantener la consistencia de los valores monetarios, estados y relaciones definidas para el proceso de facturación.

## Referencia del esquema

Tabla definida como `facturas` en la base de datos `inventario_proformas`.
