# Colores

## Descripción

La tabla `colores` almacena los colores disponibles dentro del sistema y los asocia con una empresa.

## Tabla

`colores`

## Columnas

### `id`

Identificador único del color.

- Tipo: `int`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `empresa_id`

Identificador de la empresa a la que pertenece el color.

- Tipo: `int`
- `NOT NULL`
- Valor por defecto: `1`
- Clave foránea hacia `empresas.id`

### `nombre`

Nombre del color.

- Tipo: `varchar(50)`
- `NOT NULL`

### `valor`

Valor asociado al color.

- Tipo: `varchar(30)`
- `NOT NULL`

### `tipo`

Tipo de aplicación del color.

- Tipo: `enum`
- `NOT NULL`

Valores definidos:

```text
MARCO
VIDRIO
