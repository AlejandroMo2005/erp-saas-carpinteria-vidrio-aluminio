# Proveedores

## Descripción

La tabla `proveedores` almacena la información de los proveedores asociados a una empresa.

## Tabla

`proveedores`

## Columnas

### `id`

Identificador único del proveedor.

- Tipo: `int`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `empresa_id`

Identificador de la empresa a la que pertenece el proveedor.

- Tipo: `int`
- `NOT NULL`
- Valor por defecto: `1`
- Clave foránea hacia `empresas.id`

### `nombre`

Nombre del proveedor.

- Tipo: `varchar(200)`
- `NOT NULL`

### `ciudad`

Ciudad del proveedor.

- Tipo: `varchar(100)`
- Permite `NULL`

### `telefono_whatsapp`

Número telefónico o WhatsApp del proveedor.

- Tipo: `varchar(20)`
- Permite `NULL`

### `email`

Correo electrónico del proveedor.

- Tipo: `varchar(200)`
- Permite `NULL`

### `notas`

Notas adicionales relacionadas con el proveedor.

- Tipo: `text`
- Permite `NULL`

### `activo`

Indica si el proveedor se encuentra activo.

- Tipo: `tinyint(1)`
- Valor por defecto: `1`

### `created_at`

Fecha y hora de creación del proveedor.

- Tipo: `timestamp`
- Permite `NULL`
- Valor por defecto: `CURRENT_TIMESTAMP`

### `deleted_at`

Fecha y hora de eliminación lógica del proveedor.

- Tipo: `timestamp`
- Permite `NULL`

## Claves

### Clave primaria

```text
id
