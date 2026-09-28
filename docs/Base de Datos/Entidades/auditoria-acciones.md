# Auditoría de Acciones

## Descripción

La tabla `auditoria_acciones` almacena registros de auditoría relacionados con acciones realizadas por usuarios dentro del sistema.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | bigint unsigned | No | — | Identificador único del registro de auditoría. Es clave primaria y autoincremental. |
| `empresa_id` | int | No | `1` | Identificador de la empresa asociada a la acción. |
| `usuario_id` | int | Sí | `NULL` | Identificador del usuario que realizó la acción. |
| `usuario_nombre` | varchar(255) | Sí | `NULL` | Nombre del usuario registrado en el momento de la acción. |
| `accion` | enum | No | — | Tipo de acción registrada. |
| `tabla_afectada` | varchar(100) | Sí | `NULL` | Tabla sobre la que se realizó la acción. |
| `registro_id` | bigint unsigned | Sí | `NULL` | Identificador del registro afectado. |
| `detalle` | json | Sí | `NULL` | Información adicional relacionada con la acción. |
| `ip_address` | varchar(45) | Sí | `NULL` | Dirección IP desde la que se realizó la acción. |
| `user_agent` | varchar(500) | Sí | `NULL` | User agent utilizado por el cliente. |
| `created_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora en que se registró la acción. |

## Clave primaria

- `PRIMARY KEY (id)`

## Tipos de acción

El campo `accion` utiliza los siguientes valores:

- `DELETE`
- `ANULACION`
- `LOGIN`
- `LOGOUT`
- `LOGIN_FALLIDO`
- `REFRESH_TOKEN`
- `CAMBIO_PASSWORD`

## Claves foráneas

| Columna | Referencia |
|---|---|
| `empresa_id` | `empresas.id` |
| `usuario_id` | `usuarios.id` |

## Índices

La tabla dispone de índices asociados a:

- `empresa_id`
- `usuario_id`
- `accion`
- `tabla_afectada`
- `registro_id`
- `created_at`

## Relaciones

- Un registro de auditoría pertenece a una empresa.
- Un registro de auditoría puede estar asociado a un usuario.
- Un usuario puede generar múltiples registros de auditoría.
- Una empresa puede contener múltiples registros de auditoría.

## Multi-tenancy

El campo `empresa_id` identifica la empresa asociada a cada acción registrada, permitiendo separar los registros de auditoría por empresa.

## Trazabilidad

La entidad conserva información contextual de la acción mediante:

- Usuario.
- Acción realizada.
- Tabla afectada.
- Registro afectado.
- Detalle en formato JSON.
- Dirección IP.
- User agent.
- Fecha y hora.

Esta información permite mantener trazabilidad sobre operaciones relevantes realizadas en el sistema.

## Referencia del esquema

Tabla definida como `auditoria_acciones` en la base de datos `inventario_proformas`.
