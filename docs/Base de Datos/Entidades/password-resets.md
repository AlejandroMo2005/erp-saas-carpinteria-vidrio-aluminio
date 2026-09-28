# Password Resets

## Descripción

La tabla `password_resets` almacena los registros utilizados para gestionar solicitudes de restablecimiento de contraseña de los usuarios.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único del registro. Es clave primaria y autoincremental. |
| `user_id` | int | No | — | Identificador del usuario asociado al restablecimiento. |
| `code` | varchar(6) | No | — | Código utilizado durante el proceso de restablecimiento. |
| `token` | varchar(255) | No | — | Token asociado a la solicitud de restablecimiento. |
| `expires_at` | datetime | No | — | Fecha y hora de expiración de la solicitud. |
| `used` | tinyint(1) | No | `0` | Indica si el registro ya fue utilizado. |
| `created_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de creación del registro. |

## Clave primaria

- `PRIMARY KEY (id)`

## Claves foráneas

| Columna | Referencia | Acción |
|---|---|---|
| `user_id` | `usuarios.id` | `ON DELETE CASCADE` |

## Índices

La tabla dispone de índices asociados al usuario y al proceso de recuperación mediante sus campos identificadores.

## Relaciones

- Un registro de `password_resets` pertenece a un usuario.
- Un usuario puede tener registros de restablecimiento de contraseña.
- La eliminación de un usuario elimina en cascada sus registros asociados de `password_resets`.

## Control de expiración

El campo `expires_at` determina el momento hasta el cual la solicitud de restablecimiento puede considerarse válida.

## Control de uso

El campo `used` permite identificar si una solicitud ya fue utilizada y evitar su reutilización dentro del flujo de restablecimiento de contraseña.

## Seguridad

Los campos `code` y `token` forman parte del mecanismo de recuperación de credenciales. Su uso debe estar sujeto a validación de expiración y estado de utilización.

## Referencia del esquema

Tabla definida como `password_resets` en la base de datos `inventario_proformas`.
