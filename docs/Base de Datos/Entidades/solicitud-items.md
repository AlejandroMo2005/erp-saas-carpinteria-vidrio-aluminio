# Solicitud Items

## Descripción

La tabla `solicitud_items` almacena los materiales incluidos en una solicitud de materiales. Cada registro representa un ítem asociado a una solicitud.

## Estructura

| Campo | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---:|---|---|
| `id` | `int` | No | Auto Increment | Identificador del ítem. |
| `solicitud_id` | `int` | No | — | Identificador de la solicitud de materiales. |
| `material_id` | `int` | Sí | `NULL` | Material asociado al ítem. |
| `variante_id` | `int` | Sí | `NULL` | Variante del material asociada al ítem. |
| `nombre_material` | `varchar(200)` | Sí | `NULL` | Nombre del material registrado en la solicitud. |
| `color` | `varchar(100)` | Sí | `NULL` | Color registrado para el material solicitado. |
| `cantidad` | `decimal(10,2)` | No | — | Cantidad solicitada. |
| `unidad` | `varchar(30)` | Sí | `'m'` | Unidad utilizada para expresar la cantidad. |

## Índices

| Nombre | Columna(s) | Tipo | Descripción |
|---|---|---|---|
| `PRIMARY` | `id` | PRIMARY KEY | Identifica de forma única cada ítem. |
| `fk_solicitud_item_solicitud` | `solicitud_id` | FOREIGN KEY | Relaciona el ítem con su solicitud. |
| `fk_solicitud_item_material` | `material_id` | FOREIGN KEY | Relaciona el ítem con un material. |
| `fk_solicitud_item_variante` | `variante_id` | FOREIGN KEY | Relaciona el ítem con una variante. |

## Clave primaria

La clave primaria está definida sobre:

```text
id
