# IA Requests

## Descripción

La tabla `ia_requests` registra las solicitudes realizadas a los servicios de inteligencia artificial, incluyendo el usuario y empresa asociados, el tipo de trabajo, el modelo utilizado, el resultado y el estado de procesamiento.

## Estructura

| Columna | Tipo | Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|
| `id` | int | No | — | Identificador único de la solicitud. Es clave primaria y autoincremental. |
| `empresa_id` | int | No | `1` | Identificador de la empresa asociada a la solicitud. |
| `usuario_id` | int | Sí | `NULL` | Identificador del usuario que realizó la solicitud. |
| `trabajo_tipo` | varchar(100) | No | — | Tipo de trabajo solicitado al servicio de IA. |
| `prompt` | varchar(500) | Sí | `NULL` | Prompt utilizado para la solicitud. |
| `imagen_input_hash` | varchar(64) | Sí | `NULL` | Hash asociado a la imagen de entrada. |
| `resultado_url` | text | Sí | `NULL` | URL del resultado generado. |
| `modelo` | varchar(255) | No | `runwayml/stable-diffusion-inpainting` | Modelo utilizado para procesar la solicitud. |
| `duracion_ms` | int | Sí | `NULL` | Duración del procesamiento expresada en milisegundos. |
| `status` | enum | No | `OK` | Estado final de procesamiento de la solicitud. |
| `created_at` | timestamp | Sí | `CURRENT_TIMESTAMP` | Fecha y hora de creación del registro. |

## Estados

El campo `status` utiliza los siguientes valores:

- `OK`
- `ERROR`
- `TIMEOUT`

## Clave primaria

- `PRIMARY KEY (id)`

## Claves foráneas

| Columna | Referencia | Acción |
|---|---|---|
| `empresa_id` | `empresas.id` | Según la restricción definida en el esquema. |
| `usuario_id` | `usuarios.id` | Según la restricción definida en el esquema. |

## Índices

La tabla dispone de índices asociados a:

- `empresa_id`
- `usuario_id`
- `status`
- `created_at`

## Relaciones

- Una solicitud de IA pertenece a una empresa.
- Una solicitud puede estar asociada a un usuario.
- Un usuario puede generar múltiples solicitudes de IA.
- Una empresa puede registrar múltiples solicitudes de IA.

## Multi-tenancy

El campo `empresa_id` identifica la empresa asociada a cada solicitud y permite mantener la separación de los registros de IA entre empresas.

## Trazabilidad

La entidad conserva información relacionada con:

- Tipo de trabajo solicitado.
- Prompt utilizado.
- Hash de la imagen de entrada.
- Modelo utilizado.
- URL del resultado.
- Duración del procesamiento.
- Estado de la solicitud.
- Fecha y hora de creación.

Estos datos permiten mantener un registro del procesamiento realizado por los servicios de IA.

## Referencia del esquema

Tabla definida como `ia_requests` en la base de datos `inventario_proformas`.
