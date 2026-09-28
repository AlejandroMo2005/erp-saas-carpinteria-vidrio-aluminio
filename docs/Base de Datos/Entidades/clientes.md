# Clientes

## Descripción

La tabla `clientes` almacena la información de los clientes asociados a una empresa.

## Tabla

`clientes`

## Columnas

### `id`

Identificador único del cliente.

- Tipo: `int`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `empresa_id`

Identificador de la empresa a la que pertenece el cliente.

- Tipo: `int`
- `NOT NULL`
- Valor por defecto: `1`
- Clave foránea hacia `empresas.id`

### `nombre`

Nombre del cliente.

- Tipo: `varchar(150)`
- `NOT NULL`

### `telefono`

Número telefónico del cliente.

- Tipo: `varchar(30)`
- `NOT NULL`

### `activo`

Indica si el cliente se encuentra activo.

- Tipo: `tinyint(1)`
- Valor por defecto: `1`

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

## Claves

### Clave primaria

```text
id
