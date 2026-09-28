# Referencias de trabajos

## Descripción

La tabla `trabajo_referencias` almacena referencias asociadas a los trabajos registrados en el sistema.

## Tabla

`trabajo_referencias`

## Columnas

### `id`

Identificador único de la referencia.

- Tipo: `int unsigned`
- `NOT NULL`
- `AUTO_INCREMENT`
- Clave primaria

### `trabajo_id`

Identificador del trabajo asociado.

- Tipo: `int unsigned`
- `NOT NULL`

### `filename`

Nombre del archivo de referencia.

- Tipo: `varchar(255)`
- `NOT NULL`

### `descriptores`

Información descriptiva asociada a la referencia.

- Tipo: `text`
- `NOT NULL`

### `peso`

Peso asignado a la referencia.

- Tipo: `decimal(3,2)`
- `NOT NULL`
- Valor por defecto: `0.80`

### `activo`

Indica si la referencia se encuentra activa.

- Tipo: `tinyint(1)`
- `NOT NULL`
- Valor por defecto: `1`

### `created_at`

Fecha y hora de creación de la referencia.

- Tipo: `timestamp`
- `NOT NULL`
- Valor por defecto: `CURRENT_TIMESTAMP`

## Claves

### Clave primaria

```text
id
