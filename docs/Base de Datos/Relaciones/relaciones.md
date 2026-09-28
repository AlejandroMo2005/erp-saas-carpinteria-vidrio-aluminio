# Relaciones

## Descripción

Este documento describe las relaciones existentes entre las entidades de la base de datos `inventario_proformas`, considerando las claves foráneas definidas en el esquema.

## Índice

- [Descripción](#descripción)
- [Relaciones](#relaciones)
- [Relaciones de empresas](#relaciones-de-empresas)
- [Relaciones de usuarios](#relaciones-de-usuarios)
- [Relaciones de materiales](#relaciones-de-materiales)
- [Relaciones de proformas](#relaciones-de-proformas)
- [Relaciones de pedidos](#relaciones-de-pedidos)
- [Relaciones de facturación](#relaciones-de-facturación)
- [Relaciones de solicitudes de materiales](#relaciones-de-solicitudes-de-materiales)
- [Relaciones de trabajos](#relaciones-de-trabajos)
- [Relaciones de autenticación y sesiones](#relaciones-de-autenticación-y-sesiones)
- [Relaciones de IA y auditoría](#relaciones-de-ia-y-auditoría)

## Relaciones

| Entidad origen | Campo | Entidad destino | Campo destino | Cardinalidad |
|---|---|---|---|---|
| `usuarios` | `empresa_id` | `empresas` | `id` | N:1 |
| `clientes` | `empresa_id` | `empresas` | `id` | N:1 |
| `materiales` | `empresa_id` | `empresas` | `id` | N:1 |
| `colores` | `empresa_id` | `empresas` | `id` | N:1 |
| `proveedores` | `empresa_id` | `empresas` | `id` | N:1 |
| `trabajos` | `empresa_id` | `empresas` | `id` | N:1 |
| `proformas` | `empresa_id` | `empresas` | `id` | N:1 |
| `pedidos` | `empresa_id` | `empresas` | `id` | N:1 |
| `facturas` | `empresa_id` | `empresas` | `id` | N:1 |
| `materiales_variantes` | `material_id` | `materiales` | `id` | N:1 |
| `materiales_variantes` | `color_id` | `colores` | `id` | N:1 |
| `material_colores` | `material_id` | `materiales` | `id` | N:1 |
| `material_colores` | `color_id` | `colores` | `id` | N:1 |
| `proveedor_materiales` | `proveedor_id` | `proveedores` | `id` | N:1 |
| `proveedor_materiales` | `material_id` | `materiales` | `id` | N:1 |
| `recetas` | `trabajo_id` | `trabajos` | `id` | N:1 |
| `recetas` | `material_id` | `materiales` | `id` | N:1 |
| `trabajo_referencias` | `trabajo_id` | `trabajos` | `id` | N:1 |
| `proforma_items` | `proforma_id` | `proformas` | `id` | N:1 |
| `proforma_items` | `trabajo_id` | `trabajos` | `id` | N:1 |
| `proforma_items` | `color_id` | `colores` | `id` | N:1 |
| `proforma_detalle` | `proforma_id` | `proformas` | `id` | N:1 |
| `proforma_detalle` | `material_id` | `materiales` | `id` | N:1 |
| `pedido_detalle` | `pedido_id` | `pedidos` | `id` | N:1 |
| `pedido_detalle` | `material_id` | `materiales` | `id` | N:1 |
| `factura_detalle` | `factura_id` | `facturas` | `id` | N:1 |
| `factura_detalle` | `material_id` | `materiales` | `id` | N:1 |
| `usuarios_sesiones` | `usuario_id` | `usuarios` | `id` | N:1 |
| `password_resets` | `user_id` | `usuarios` | `id` | N:1 |
| `ia_requests` | `empresa_id` | `empresas` | `id` | N:1 |
| `ia_requests` | `usuario_id` | `usuarios` | `id` | N:1 |
| `auditoria_acciones` | `empresa_id` | `empresas` | `id` | N:1 |
| `auditoria_acciones` | `usuario_id` | `usuarios` | `id` | N:1 |
| `autorizaciones_sri` | `factura_id` | `facturas` | `id` | N:1 |

## Relaciones de empresas

La entidad `empresas` actúa como entidad principal del aislamiento de datos empresariales. Varias entidades utilizan `empresa_id` para asociar sus registros con una organización.

Entre las entidades relacionadas se encuentran:

- `usuarios`
- `clientes`
- `materiales`
- `colores`
- `proveedores`
- `trabajos`
- `proformas`
- `pedidos`
- `facturas`
- `ia_requests`
- `auditoria_acciones`

## Relaciones de usuarios

`usuarios` mantiene relaciones con entidades relacionadas con autenticación, operaciones y trazabilidad:

- `usuarios_sesiones`
- `password_resets`
- `proformas`
- `pedidos`
- `facturas`
- `ia_requests`
- `auditoria_acciones`

## Relaciones de materiales

`materiales` se relaciona con:

- `materiales_variantes`
- `material_colores`
- `proveedor_materiales`
- `recetas`
- `proforma_detalle`
- `pedido_detalle`
- `factura_detalle`

Estas relaciones permiten vincular materiales con variantes, colores, proveedores, recetas y documentos comerciales.

## Relaciones de proformas

`proformas` mantiene relaciones con:

- `proforma_items`
- `proforma_detalle`

Los registros de detalle permiten asociar trabajos y materiales con una proforma.

## Relaciones de pedidos

`pedidos` mantiene una relación con:

- `pedido_detalle`

Cada detalle identifica el material correspondiente y la cantidad registrada.

## Relaciones de facturación

`facturas` mantiene relaciones con:

- `factura_detalle`
- `autorizaciones_sri`

`factura_detalle` almacena los materiales incluidos en la factura, mientras que `autorizaciones_sri` se relaciona con la información correspondiente al proceso de autorización.

## Relaciones de solicitudes de materiales

`solicitudes_materiales` mantiene una relación de cabecera-detalle con `solicitud_items`.

Los registros de `solicitud_items` pertenecen a una solicitud y permiten representar los materiales incluidos en ella.

## Relaciones de trabajos

`trabajos` mantiene relaciones con:

- `recetas`
- `trabajo_referencias`
- `proforma_items`

Estas relaciones permiten asociar materiales utilizados en un trabajo, referencias visuales y trabajos incluidos en proformas.

## Relaciones de autenticación y sesiones

Las entidades relacionadas con la autenticación y administración de sesiones son:

- `usuarios`
- `usuarios_sesiones`
- `password_resets`
- `token_blacklist`

`usuarios_sesiones` y `password_resets` mantienen relaciones directas con `usuarios`. `token_blacklist` utiliza el identificador del token como mecanismo independiente de control de tokens invalidados.

## Relaciones de IA y auditoría

`ia_requests` registra solicitudes relacionadas con los servicios de inteligencia artificial y mantiene referencias hacia la empresa y el usuario que originan la solicitud.

`auditoria_acciones` mantiene referencias hacia la empresa y el usuario para asociar las acciones registradas con su contexto organizacional y usuario correspondiente.
