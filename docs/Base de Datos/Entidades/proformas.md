# Proformas

## Descripción

La tabla `proformas` almacena las proformas generadas dentro del sistema y las asocia con una empresa y un usuario.

## Tabla

`proformas`

## Columnas

### `id`

Identificador único de la proforma.

- Tipo: `int`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `empresa_id`

Identificador de la empresa a la que pertenece la proforma.

- Tipo: `int`
- `NOT NULL`
- Valor por defecto: `1`
- Clave foránea hacia `empresas.id`

### `fecha`

Fecha de la proforma.

- Tipo: `date`
- Permite `NULL`
- Valor por defecto: `CURRENT_DATE`

### `fecha_agendamiento`

Fecha de agendamiento asociada a la proforma.

- Tipo: `date`
- Permite `NULL`

### `cliente`

Nombre del cliente asociado a la proforma.

- Tipo: `varchar(150)`
- `NOT NULL`

### `telefono`

Número telefónico asociado a la proforma.

- Tipo: `varchar(30)`
- Permite `NULL`

### `total`

Total de la proforma.

- Tipo: `decimal(10,2)`
- `NOT NULL`

### `created_at`

Fecha y hora de creación de la proforma.

- Tipo: `timestamp`
- Permite `NULL`
- Valor por defecto: `CURRENT_TIMESTAMP`

### `updated_at`

Fecha y hora de actualización de la proforma.

- Tipo: `timestamp`
- Permite `NULL`
- Valor por defecto: `CURRENT_TIMESTAMP`
- Se actualiza mediante `ON UPDATE CURRENT_TIMESTAMP`

### `usuario_id`

Identificador del usuario asociado a la proforma.

- Tipo: `int`
- Permite `NULL`
- Clave foránea hacia `usuarios.id`

### `deleted_at`

Fecha y hora de eliminación lógica de la proforma.

- Tipo: `timestamp`
- Permite `NULL`

## Claves

### Clave primaria

```text
id
