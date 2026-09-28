# Trabajo Referencias

## Descripción

La tabla `trabajo_referencias` almacena referencias asociadas a los trabajos registrados en el sistema, incluyendo el archivo, descriptores y peso de cada referencia.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | bigint unsigned | No | — | Identificador único de la referencia. Es clave primaria y autoincremental. |
| `trabajo_id` | bigint unsigned | No | — | Identificador del trabajo asociado. |
| `filename` | varchar | No | — | Nombre del archivo de referencia. |
| `descriptores` | json | Sí | `NULL` | Descriptores asociados a la referencia. |
| `peso` | decimal(3,2) | No | `0.80` | Peso asignado a la referencia. |
| `activo` | tinyint(1) | No | `1` | Indica si la referencia está activa. |
| `created_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de creación del registro. |

## Clave primaria

- `PRIMARY KEY (id)`

## Relaciones

El campo `trabajo_id` identifica el trabajo al que pertenece la referencia.

La tabla no presenta una clave foránea declarada hacia `trabajos` en el esquema de la base de datos.

## Índices

La tabla dispone de los índices definidos en el esquema para facilitar la consulta de las referencias asociadas a los trabajos.

## Descriptores

El campo `descriptores` utiliza el tipo `JSON` para almacenar información estructurada asociada a las características de la referencia.

## Estado

El campo `activo` permite identificar si una referencia se encuentra habilitada dentro del sistema.

## Peso

El campo `peso` almacena un valor decimal utilizado para representar la ponderación asignada a la referencia. Su valor por defecto es `0.80`.

## Referencia del esquema

Tabla definida como `trabajo_referencias` en la base de datos `inventario_proformas`.
