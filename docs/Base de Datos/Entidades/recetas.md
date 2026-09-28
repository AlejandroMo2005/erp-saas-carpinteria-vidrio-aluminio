# Recetas

## Descripción

La tabla `recetas` relaciona trabajos con materiales y almacena parámetros utilizados para los cálculos asociados a cada trabajo.

## Tabla

`recetas`

## Columnas

### `id`

Identificador único de la receta.

- Tipo: `int`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `trabajo_id`

Identificador del trabajo asociado.

- Tipo: `int`
- `NOT NULL`
- Clave foránea hacia `trabajos.id`

### `material_id`

Identificador del material asociado.

- Tipo: `int`
- `NOT NULL`
- Clave foránea hacia `materiales.id`

### `unidad_calculo`

Unidad utilizada para el cálculo de la receta.

- Tipo: `varchar(50)`
- `NOT NULL`

### `factor`

Factor utilizado en el cálculo.

- Tipo: `decimal(10,4)`
- `NOT NULL`

### `created_at`

Fecha y hora de creación de la receta.

- Tipo: `timestamp`
- Permite `NULL`
- Valor por defecto: `CURRENT_TIMESTAMP`

## Claves

### Clave primaria

```text
id
