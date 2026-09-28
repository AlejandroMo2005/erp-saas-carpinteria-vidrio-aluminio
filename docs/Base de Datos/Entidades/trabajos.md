# Trabajos

## Descripción

La tabla `trabajos` almacena los trabajos disponibles dentro del sistema y los asocia con una empresa.

## Tabla

`trabajos`

## Columnas

### `id`

Identificador único del trabajo.

- Tipo: `int`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `empresa_id`

Identificador de la empresa a la que pertenece el trabajo.

- Tipo: `int`
- `NOT NULL`
- Valor por defecto: `1`
- Clave foránea hacia `empresas.id`

### `nombre`

Nombre del trabajo.

- Tipo: `varchar(100)`
- `NOT NULL`

### `descripcion`

Descripción del trabajo.

- Tipo: `varchar(300)`
- Permite `NULL`

### `tipo`

Tipo de trabajo.

- Tipo: `varchar(100)`
- Permite `NULL`

### `activo`

Indica si el trabajo se encuentra activo.

- Tipo: `tinyint(1)`
- Valor por defecto: `1`

### `prompt_base`

Descripción base utilizada para los prompts asociados al trabajo.

- Tipo: `varchar(500)`
- Permite `NULL`

### `variante`

Variante asociada al trabajo.

- Tipo: `varchar(100)`
- Permite `NULL`

## Claves

### Clave primaria

```text
id
