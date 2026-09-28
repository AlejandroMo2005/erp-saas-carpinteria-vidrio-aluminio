# Relación proveedor-material

## Descripción

La tabla `proveedor_materiales` representa la relación entre proveedores y materiales disponibles en el sistema.

## Tabla

`proveedor_materiales`

## Columnas

### `id`

Identificador único de la relación.

- Tipo: `int`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `proveedor_id`

Identificador del proveedor relacionado.

- Tipo: `int`
- `NOT NULL`
- Clave foránea hacia `proveedores.id`

### `material_id`

Identificador del material relacionado.

- Tipo: `int`
- `NOT NULL`
- Clave foránea hacia `materiales.id`

## Claves

### Clave primaria

```text
id
