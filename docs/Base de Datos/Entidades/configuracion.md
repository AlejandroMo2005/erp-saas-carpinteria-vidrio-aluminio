# Configuración

## Descripción

La tabla `configuracion` almacena valores de configuración asociados a una empresa.

## Estructura

| Campo | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---:|---|---|
| `empresa_id` | `int` | No | — | Identificador de la empresa a la que pertenece la configuración. |
| `clave` | `varchar` | No | — | Clave que identifica el parámetro de configuración. |
| `valor` | `text` | Sí | `NULL` | Valor almacenado para la configuración. |
| `updated_at` | `timestamp` | No | `CURRENT_TIMESTAMP` | Fecha y hora de la última actualización. |

## Índices

| Nombre | Columna(s) | Tipo | Descripción |
|---|---|---|---|
| `PRIMARY` | `empresa_id`, `clave` | PRIMARY KEY | Identifica de forma única cada configuración dentro de una empresa. |

## Clave primaria

La clave primaria es compuesta por:

```text
empresa_id, clave
