# Relación material-color

## Descripción

La tabla `material_colores` representa la relación entre materiales y colores disponibles en el sistema.

## Tabla

`material_colores`

## Columnas

### `id`

Identificador único de la relación.

- Tipo: `int`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `material_id`

Identificador del material relacionado.

- Tipo: `int`
- `NOT NULL`
- Clave foránea hacia `materiales.id`

### `color_id`

Identificador del color relacionado.

- Tipo: `int`
- `NOT NULL`
- Clave foránea hacia `colores.id`

## Claves

### Clave primaria

```text
id
