# Variantes de materiales

## Descripción

La tabla `materiales_variantes` relaciona materiales con colores y permite almacenar valores específicos de stock y precio para cada combinación.

## Tabla

`materiales_variantes`

## Columnas

### `id`

Identificador único de la variante.

- Tipo: `int`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `material_id`

Identificador del material asociado.

- Tipo: `int`
- `NOT NULL`
- Clave foránea hacia `materiales.id`

### `color_id`

Identificador del color asociado.

- Tipo: `int`
- `NOT NULL`
- Clave foránea hacia `colores.id`

### `stock`

Cantidad disponible de la variante.

- Tipo: `decimal(10,2)`
- Valor por defecto: `0.00`

### `precio`

Precio asociado a la variante.

- Tipo: `decimal(10,2)`
- Valor por defecto: `0.00`

### `updated_at`

Fecha y hora de la última actualización de la variante.

- Tipo: `timestamp`
- Valor por defecto: `CURRENT_TIMESTAMP`
- Se actualiza mediante `ON UPDATE CURRENT_TIMESTAMP`

## Claves

### Clave primaria

```text
id
