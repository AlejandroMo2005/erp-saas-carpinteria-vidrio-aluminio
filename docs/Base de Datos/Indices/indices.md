# Índices de la Base de Datos

## Descripción

Los índices de la base de datos `inventario_proformas` permiten optimizar la búsqueda, filtrado y asociación de registros mediante columnas utilizadas frecuentemente en consultas y relaciones.

## Índice

- [Descripción](#descripción)
- [Índices por entidad](#índices-por-entidad)
- [Índices relacionados con empresas](#índices-relacionados-con-empresas)
- [Índices relacionados con documentos](#índices-relacionados-con-documentos)
- [Índices relacionados con materiales](#índices-relacionados-con-materiales)
- [Índices relacionados con autenticación](#índices-relacionados-con-autenticación)
- [Consideraciones](#consideraciones)

## Índices por entidad

| Entidad | Columnas indexadas | Propósito |
|---|---|---|
| `auditoria_acciones` | `empresa_id`, `usuario_id`, `tabla_afectada`, `registro_id`, `created_at` | Facilitar consultas de auditoría y filtrado por contexto. |
| `clientes` | `empresa_id`, `nombre` | Facilitar búsquedas y filtrado de clientes por empresa. |
| `colores` | `empresa_id` | Facilitar consultas de colores asociadas a una empresa. |
| `facturas` | `empresa_id`, `numero_factura`, `clave_acceso` | Facilitar la consulta de facturas dentro del contexto empresarial y mediante identificadores fiscales. |
| `ia_requests` | `empresa_id`, `usuario_id`, `created_at` | Facilitar consultas de solicitudes de IA por empresa, usuario y fecha. |
| `materiales` | `empresa_id`, `nombre`, `deleted_at` | Facilitar búsquedas y filtrado de materiales por empresa y estado lógico. |
| `materiales_variantes` | `material_id`, `color_id` | Facilitar consultas de variantes por material y color. |
| `password_resets` | `user_id`, `token`, `expires_at` | Facilitar la gestión y validación de solicitudes de recuperación de contraseña. |
| `pedidos` | `empresa_id`, `fecha`, `usuario_id`, `proforma_id`, `deleted_at` | Facilitar consultas de pedidos por empresa, fecha, usuario, proforma y eliminación lógica. |
| `proformas` | `empresa_id`, `fecha`, `cliente`, `total`, `usuario_id`, `deleted_at` | Facilitar búsquedas y filtrado de proformas. |
| `proveedores` | `empresa_id`, `deleted_at` | Facilitar consultas de proveedores por empresa y estado lógico. |
| `secuencias_comprobantes` | `empresa_id`, `tipo_comprobante`, `establecimiento`, `punto_emision` | Facilitar la gestión de secuencias de comprobantes por empresa. |
| `token_blacklist` | `jti`, `expires_at` | Facilitar la comprobación y gestión de tokens invalidados. |
| `trabajos` | `empresa_id`, `nombre` | Facilitar consultas de trabajos por empresa y nombre. |
| `usuarios` | `empresa_id`, `email`, `cedula_ruc`, `activo`, `deleted_at` | Facilitar consultas de usuarios y filtrado por estado. |
| `usuarios_sesiones` | `usuario_id`, `token_hash`, `expires_at` | Facilitar la gestión de sesiones y validación de tokens. |

## Índices relacionados con empresas

El campo `empresa_id` se encuentra indexado en múltiples entidades que pertenecen al contexto empresarial.

Su utilización permite optimizar consultas que filtran información por organización, especialmente en:

- `clientes`
- `colores`
- `materiales`
- `proveedores`
- `trabajos`
- `proformas`
- `pedidos`
- `facturas`
- `ia_requests`
- `auditoria_acciones`

Estos índices complementan las claves foráneas utilizadas para mantener la relación con `empresas`.

## Índices relacionados con documentos

Las entidades de documentos comerciales incorporan índices asociados a los campos utilizados para búsqueda y filtrado.

En `proformas` se indexan campos relacionados con:

- Empresa.
- Fecha.
- Cliente.
- Total.
- Usuario.
- Eliminación lógica.

En `pedidos` se consideran:

- Empresa.
- Fecha.
- Usuario.
- Proforma.
- Eliminación lógica.

En `facturas` se utilizan índices relacionados con la empresa y los identificadores de facturación.

## Índices relacionados con materiales

Las entidades relacionadas con materiales utilizan índices que facilitan la navegación entre materiales, variantes, colores y proveedores.

Entre ellas se encuentran:

- `materiales`
- `materiales_variantes`
- `material_colores`
- `proveedor_materiales`

Los índices sobre las claves utilizadas en estas relaciones permiten optimizar las consultas de asociación entre entidades.

## Índices relacionados con autenticación

Las entidades de autenticación y sesiones utilizan índices sobre identificadores utilizados durante los procesos de autenticación y control de sesiones.

Entre los campos indexados se encuentran:

- `usuarios.email`
- `usuarios.cedula_ruc`
- `usuarios.empresa_id`
- `usuarios_sesiones.usuario_id`
- `usuarios_sesiones.token_hash`
- `password_resets.user_id`
- `password_resets.token`
- `token_blacklist.jti`

Estos índices permiten realizar búsquedas directas sobre identificadores de usuarios, sesiones y tokens.

## Consideraciones

Los índices deben mantenerse alineados con los patrones reales de consulta de la aplicación.

La existencia de un índice mejora determinadas operaciones de lectura, pero también implica almacenamiento adicional y puede incrementar el costo de operaciones de escritura. Por esta razón, las modificaciones futuras del esquema deben considerar el uso efectivo de cada índice y evitar duplicaciones innecesarias.
