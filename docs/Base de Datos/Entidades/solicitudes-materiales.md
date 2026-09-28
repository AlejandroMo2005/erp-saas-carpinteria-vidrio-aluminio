# Solicitudes de Materiales

## Descripción

La tabla `solicitudes_materiales` almacena las solicitudes de materiales realizadas en el sistema y permite asociarlas con la empresa y el usuario responsable.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único de la solicitud. Es clave primaria y autoincremental. |
| `empresa_id` | int | No | `1` | Identificador de la empresa propietaria de la solicitud. |
| `usuario_id` | int | No | — | Identificador del usuario que registra la solicitud. |
| `fecha` | date | No | `CURRENT_DATE` | Fecha de registro de la solicitud. |
| `estado` | enum | No | `PENDIENTE` | Estado de la solicitud. |
| `observaciones` | text | Sí | `NULL` | Información adicional relacionada con la solicitud. |
| `created_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de creación del registro. |
| `updated_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de la última actualización. |

## Clave primaria

- `PRIMARY KEY (id)`

## Claves foráneas

| Columna | Referencia | Acción |
|---|---|---|
| `empresa_id` | `empresas.id` | `ON UPDATE CASCADE` |
| `usuario_id` | `usuarios.id` | `ON DELETE RESTRICT` |

## Índices

La tabla dispone de índices asociados a:

- `empresa_id`
- `usuario_id`
- `fecha`
- `estado`

## Relaciones

- Una solicitud pertenece a una empresa.
- Una solicitud está asociada a un usuario.
- Una solicitud puede contener múltiples registros en `solicitud_items`.
- La eliminación del usuario asociado está restringida cuando existen solicitudes relacionadas.

## Multi-tenancy

El campo `empresa_id` identifica la empresa propietaria de cada solicitud y permite mantener la separación de los datos entre empresas.

## Estados

El campo `estado` representa el estado del ciclo de la solicitud según los valores definidos en el esquema de la base de datos.

## Integridad

La relación con `empresa_id` mantiene la pertenencia de la solicitud a una empresa, mientras que `usuario_id` identifica al usuario responsable del registro.

## Referencia del esquema

Tabla definida como `solicitudes_materiales` en la base de datos `inventario_proformas`.
