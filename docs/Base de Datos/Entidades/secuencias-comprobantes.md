# Secuencias de Comprobantes

## Descripción

La tabla `secuencias_comprobantes` almacena las secuencias utilizadas para generar la numeración de comprobantes electrónicos por empresa, tipo de comprobante, establecimiento y punto de emisión.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único de la secuencia. Es clave primaria y autoincremental. |
| `empresa_id` | int | No | `1` | Identificador de la empresa propietaria de la secuencia. |
| `tipo_comprobante` | enum | No | — | Tipo de comprobante al que corresponde la secuencia. |
| `establecimiento` | varchar | No | — | Código del establecimiento. |
| `punto_emision` | varchar | No | — | Código del punto de emisión. |
| `secuencia_actual` | int | No | `0` | Número de secuencia actualmente registrado. |
| `activo` | tinyint(1) | No | `1` | Indica si la secuencia está activa. |
| `created_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de creación. |
| `updated_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de actualización. |

## Tipos de comprobante

El campo `tipo_comprobante` utiliza los siguientes valores:

- `FACTURA`
- `NOTA_CREDITO`
- `NOTA_DEBITO`
- `RETENCION`
- `GUIA_REMISION`

## Clave primaria

- `PRIMARY KEY (id)`

## Restricciones de unicidad

La combinación de los siguientes campos es única por empresa:

- `empresa_id`
- `tipo_comprobante`
- `establecimiento`
- `punto_emision`

Esto permite mantener una secuencia independiente para cada combinación configurada.

## Claves foráneas

| Columna | Referencia | Acción |
|---|---|---|
| `empresa_id` | `empresas.id` | `ON UPDATE CASCADE` |

## Índices

La tabla dispone de un índice único sobre:

`empresa_id, tipo_comprobante, establecimiento, punto_emision`

También dispone del índice correspondiente a la clave foránea `empresa_id`.

## Relaciones

- Una secuencia pertenece a una empresa.
- Una empresa puede tener múltiples secuencias de comprobantes.
- Cada secuencia corresponde a un tipo de comprobante, establecimiento y punto de emisión específicos.

## Multi-tenancy

El campo `empresa_id` identifica la empresa propietaria de cada secuencia. La restricción de unicidad incorpora este campo para mantener la numeración independiente entre empresas.

## Control de secuencia

El campo `secuencia_actual` mantiene el último valor registrado para la combinación correspondiente de empresa, tipo de comprobante, establecimiento y punto de emisión.

## Estado

El campo `activo` permite determinar si una configuración de secuencia se encuentra habilitada para su utilización.

## Referencia del esquema

Tabla definida como `secuencias_comprobantes` en la base de datos `inventario_proformas`.
