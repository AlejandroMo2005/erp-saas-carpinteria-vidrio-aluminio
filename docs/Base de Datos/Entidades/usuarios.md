# Usuarios

## Descripción

La tabla `usuarios` almacena la información de los usuarios del sistema, su empresa asociada, datos de autenticación, rol, estado y elementos relacionados con la gestión de sesiones y recuperación de acceso.

## Tabla

`usuarios`

## Columnas

### `id`

Identificador único del usuario.

- Tipo: `int`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `empresa_id`

Identificador de la empresa a la que pertenece el usuario.

- Tipo: `int`
- `NOT NULL`
- Valor por defecto: `1`
- Clave foránea hacia `empresas.id`

### `nombre`

Nombre del usuario.

- Tipo: `varchar(100)`
- `NOT NULL`

### `nombre_completo`

Nombre completo del usuario.

- Tipo: `varchar(150)`
- Permite `NULL`

### `telefono`

Teléfono del usuario.

- Tipo: `varchar(20)`
- Permite `NULL`

### `email`

Correo electrónico del usuario.

- Tipo: `varchar(150)`
- Permite `NULL`
- Restricción `UNIQUE`

### `cedula_ruc`

Cédula o RUC asociado al usuario.

- Tipo: `varchar(20)`
- Permite `NULL`
- Restricción `UNIQUE`

### `direccion`

Dirección del usuario.

- Tipo: `varchar(255)`
- Permite `NULL`

### `password`

Contraseña almacenada del usuario.

- Tipo: `varchar(255)`
- `NOT NULL`

### `rol`

Rol asignado al usuario.

- Tipo: `enum`
- Valores:
  - `ADMIN`
  - `VENDEDOR`
  - `ALMACEN`
  - `CLIENTE`
- Valor por defecto: `CLIENTE`

### `activo`

Indica si el usuario se encuentra activo.

- Tipo: `tinyint(1)`
- Valor por defecto: `1`

### `created_at`

Fecha y hora de creación del usuario.

- Tipo: `timestamp`
- Permite `NULL`
- Valor por defecto: `CURRENT_TIMESTAMP`

### `updated_at`

Fecha y hora de actualización del usuario.

- Tipo: `timestamp`
- Permite `NULL`
- Valor por defecto: `CURRENT_TIMESTAMP`
- Se actualiza mediante `ON UPDATE CURRENT_TIMESTAMP`

### `reset_token`

Token asociado al proceso de recuperación de contraseña.

- Tipo: `varchar(255)`
- Permite `NULL`

### `reset_expires`

Momento de expiración asociado al proceso de recuperación.

- Tipo: `bigint`
- Permite `NULL`

### `last_activity`

Fecha y hora de la última actividad registrada del usuario.

- Tipo: `timestamp`
- Permite `NULL`

### `token_id`

Identificador `jti` del access token activo.

- Tipo: `varchar(36)`
- Permite `NULL`

### `deleted_at`

Fecha y hora de eliminación lógica del usuario.

- Tipo: `timestamp`
- Permite `NULL`

## Claves

### Clave primaria

```text
id
