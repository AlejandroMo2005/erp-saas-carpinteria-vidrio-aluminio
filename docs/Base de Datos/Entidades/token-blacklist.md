# Token Blacklist

## Descripción

La tabla `token_blacklist` almacena los identificadores únicos (`jti`) de tokens invalidados, junto con su fecha de expiración.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | bigint unsigned | No | — | Identificador único del registro. Es clave primaria y autoincremental. |
| `jti` | varchar(36) | No | — | Identificador único del JWT invalidado. |
| `expires_at` | datetime | No | — | Fecha y hora de expiración del token invalidado. |
| `created_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de creación del registro. |

## Clave primaria

- `PRIMARY KEY (id)`

## Restricciones

- `jti` posee una restricción `UNIQUE`, evitando registros duplicados para el mismo identificador de token.

## Índices

- Índice único sobre `jti`.

## Funcionamiento

La tabla permite mantener una lista de tokens JWT que deben considerarse inválidos aunque su firma y fecha de expiración todavía sean técnicamente válidas.

El campo `expires_at` permite conservar la información de invalidación durante el período relevante del token.

## Relaciones

La tabla no posee claves foráneas hacia otras entidades del esquema.

## Referencia del esquema

Tabla definida como `token_blacklist` en la base de datos `inventario_proformas`.
