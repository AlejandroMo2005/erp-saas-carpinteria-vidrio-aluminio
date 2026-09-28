# Configuración

## Descripción

La tabla `configuracion` almacena parámetros de configuración asociados a cada empresa mediante una clave y su valor correspondiente.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `empresa_id` | int | No | — | Identificador de la empresa a la que pertenece la configuración. |
| `clave` | varchar | No | — | Nombre o identificador de la configuración. |
| `valor` | text | Sí | `NULL` | Valor almacenado para la configuración. |
| `updated_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de la última actualización. |

## Clave primaria

La clave primaria es compuesta por:

- `empresa_id`
- `clave`

La combinación garantiza que una empresa no tenga configuraciones duplicadas para una misma clave.

## Claves foráneas

| Columna | Referencia | Acción |
|---|---|---|
| `empresa_id` | `empresas.id` | `ON UPDATE CASCADE` |

## Índices

La clave primaria compuesta por `empresa_id` y `clave` proporciona el índice principal para consultar las configuraciones de una empresa.

## Relaciones

- Una configuración pertenece a una empresa.
- Una empresa puede contener múltiples registros de configuración.
- La configuración se identifica mediante una clave única dentro de cada empresa.

## Multi-tenancy

El campo `empresa_id` establece la pertenencia de cada configuración a una empresa, permitiendo mantener parámetros independientes entre empresas.

## Modelo clave-valor

La entidad utiliza una estructura de clave-valor:

- `clave` identifica el parámetro.
- `valor` almacena su contenido.

Este modelo permite registrar diferentes parámetros sin añadir una columna específica para cada configuración.

## Actualización

El campo `updated_at` permite registrar la fecha y hora de la última modificación del registro.

## Referencia del esquema

Tabla definida como `configuracion` en la base de datos `inventario_proformas`.
