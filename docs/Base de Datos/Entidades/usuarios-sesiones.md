# Usuarios Sesiones

## Descripción

La tabla `usuarios_sesiones` almacena las sesiones activas o registradas de los usuarios, incluyendo el hash del token, información de conexión y fechas de expiración y uso.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | bigint unsigned | No | — | Identificador único de la sesión. Es clave primaria y autoincremental. |
| `usuario_id` | int | No | — | Identificador del usuario propietario de la sesión. |
| `token_hash` | varchar | No | — | Hash del token asociado a la sesión. |
| `ip` | varchar | Sí | `NULL` | Dirección IP asociada a la sesión. |
| `user_agent` | varchar | Sí | `NULL` | User agent utilizado durante la sesión. |
| `expires_at` | datetime | No | — | Fecha y hora de expiración de la sesión. |
| `created_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de creación de la sesión. |
| `last_used_at` | timestamp | Sí | `NULL` | Fecha y hora del último uso registrado de la sesión. |

## Clave primaria

- `PRIMARY KEY (id)`

## Restricciones de unicidad

- `token_hash` posee una restricción `UNIQUE`, evitando que existan sesiones diferentes con el mismo hash de token.

## Claves foráneas

| Columna | Referencia | Acción |
|---|---|---|
| `usuario_id` | `usuarios.id` | `ON DELETE CASCADE` |

## Índices

La tabla dispone de:

- Índice único sobre `token_hash`.
- Índice sobre `usuario_id`.
- Índices asociados a los campos utilizados para controlar la expiración de las sesiones.

## Relaciones

- Una sesión pertenece a un usuario.
- Un usuario puede tener múltiples sesiones.
- La eliminación de un usuario elimina en cascada sus sesiones asociadas.

## Control de expiración

El campo `expires_at` determina la fecha y hora hasta la cual la sesión puede permanecer válida.

## Trazabilidad de uso

Los campos `ip`, `user_agent`, `created_at` y `last_used_at` permiten conservar información relacionada con el origen, creación y último uso de la sesión.

## Seguridad

El campo `token_hash` almacena el hash asociado al token de sesión en lugar del token en texto plano.

## Referencia del esquema

Tabla definida como `usuarios_sesiones` en la base de datos `inventario_proformas`.
