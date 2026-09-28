# Empresas

## Descripción

La tabla `empresas` representa la entidad principal del modelo multi-tenant de la aplicación.

Cada registro identifica una empresa y permite asociar los datos de los diferentes módulos con el tenant correspondiente.

## Tabla

`empresas`

## Columnas

### `id`

Identificador único de la empresa.

- Tipo: `int`
- `AUTO_INCREMENT`
- `NOT NULL`
- Clave primaria

### `nombre`

Nombre comercial de la empresa.

- Tipo: `varchar(150)`
- `NOT NULL`

### `razon_social`

Razón social de la empresa.

- Tipo: `varchar(200)`
- Permite `NULL`

### `ruc`

RUC de la empresa.

- Tipo: `varchar(13)`
- Permite `NULL`
- Restricción `UNIQUE`

### `direccion`

Dirección de la empresa.

- Tipo: `text`
- Permite `NULL`

### `telefono`

Teléfono de la empresa.

- Tipo: `varchar(20)`
- Permite `NULL`

### `email`

Correo electrónico de la empresa.

- Tipo: `varchar(150)`
- Permite `NULL`

### `logo_url`

URL del logotipo de la empresa.

- Tipo: `varchar(500)`
- Permite `NULL`

### `plan`

Plan asociado a la empresa.

- Tipo: `enum`
- Valores:
  - `basic`
  - `pro`
  - `enterprise`
- `NOT NULL`
- Valor por defecto: `pro`

### `activo`

Indica si la empresa se encuentra activa.

- Tipo: `tinyint(1)`
- `NOT NULL`
- Valor por defecto: `1`

### `created_at`

Fecha y hora de creación del registro.

- Tipo: `timestamp`
- `NOT NULL`
- Valor por defecto: `CURRENT_TIMESTAMP`

### `updated_at`

Fecha y hora de la última actualización.

- Tipo: `timestamp`
- `NOT NULL`
- Valor por defecto: `CURRENT_TIMESTAMP`
- Se actualiza automáticamente mediante `ON UPDATE CURRENT_TIMESTAMP`

## Claves

### Clave primaria

```text
id
