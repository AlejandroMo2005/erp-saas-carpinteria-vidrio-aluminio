# Materiales

## Descripción

La tabla `materiales` almacena los materiales administrados por el inventario y asociados a una empresa.

## Tabla

`materiales`

## Columnas

### `id`

Identificador único del material.

- Tipo: `int`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `empresa_id`

Identificador de la empresa a la que pertenece el material.

- Tipo: `int`
- `NOT NULL`
- Valor por defecto: `1`
- Clave foránea hacia `empresas.id`

### `nombre`

Nombre del material.

- Tipo: `varchar(150)`
- `NOT NULL`

### `descripcion`

Descripción del material.

- Tipo: `text`
- Permite `NULL`

### `precio`

Precio del material.

- Tipo: `decimal(10,2)`
- `NOT NULL`
- Valor mínimo permitido: `0`

### `stock`

Cantidad disponible del material.

- Tipo: `int`
- `NOT NULL`
- Valor por defecto: `0`
- Valor mínimo permitido: `0`

### `created_at`

Fecha y hora de creación del registro.

- Tipo: `timestamp`
- Permite `NULL`
- Valor por defecto: `CURRENT_TIMESTAMP`

### `updated_at`

Fecha y hora de actualización del registro.

- Tipo: `timestamp`
- Permite `NULL`
- Valor por defecto: `CURRENT_TIMESTAMP`
- Se actualiza mediante `ON UPDATE CURRENT_TIMESTAMP`

### `stock_minimo`

Cantidad mínima de stock definida para el material.

- Tipo: `decimal(10,2)`
- Permite `NULL`
- Valor por defecto: `10.00`

### `activo`

Indica si el material se encuentra activo.

- Tipo: `tinyint(1)`
- Valor por defecto: `1`

### `deleted_at`

Fecha y hora de eliminación lógica del material.

- Tipo: `timestamp`
- Permite `NULL`

## Claves

### Clave primaria

```text
id
