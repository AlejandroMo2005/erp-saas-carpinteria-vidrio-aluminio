# Integridad de la Base de Datos

## Descripción

Este documento describe los mecanismos de integridad definidos en la base de datos `inventario_proformas`, incluyendo claves primarias, claves foráneas, restricciones `CHECK`, valores `ENUM`, restricciones `UNIQUE` y reglas de eliminación.

## Índice

- [Descripción](#descripción)
- [Claves primarias](#claves-primarias)
- [Claves foráneas](#claves-foráneas)
- [Restricciones CHECK](#restricciones-check)
- [Restricciones UNIQUE](#restricciones-unique)
- [Valores ENUM](#valores-enum)
- [Reglas de eliminación](#reglas-de-eliminación)
- [Integridad multiempresa](#integridad-multiempresa)

## Claves primarias

Las tablas utilizan claves primarias para identificar de forma única sus registros.

Entre las principales claves primarias se encuentran:

| Tabla | Clave primaria |
|---|---|
| `empresas` | `id` |
| `usuarios` | `id` |
| `clientes` | `id` |
| `materiales` | `id` |
| `colores` | `id` |
| `proveedores` | `id` |
| `trabajos` | `id` |
| `proformas` | `id` |
| `pedidos` | `id` |
| `facturas` | `id` |
| `configuracion` | `empresa_id`, `clave` |

## Claves foráneas

Las claves foráneas mantienen la integridad referencial entre las entidades relacionadas.

Entre las principales relaciones se encuentran:

| Tabla | Campo | Referencia |
|---|---|---|
| `usuarios` | `empresa_id` | `empresas.id` |
| `clientes` | `empresa_id` | `empresas.id` |
| `materiales` | `empresa_id` | `empresas.id` |
| `colores` | `empresa_id` | `empresas.id` |
| `proveedores` | `empresa_id` | `empresas.id` |
| `trabajos` | `empresa_id` | `empresas.id` |
| `materiales_variantes` | `material_id` | `materiales.id` |
| `materiales_variantes` | `color_id` | `colores.id` |
| `material_colores` | `material_id` | `materiales.id` |
| `material_colores` | `color_id` | `colores.id` |
| `proformas` | `empresa_id` | `empresas.id` |
| `proforma_items` | `proforma_id` | `proformas.id` |
| `proforma_items` | `trabajo_id` | `trabajos.id` |
| `proforma_detalle` | `proforma_id` | `proformas.id` |
| `proforma_detalle` | `material_id` | `materiales.id` |
| `pedidos` | `empresa_id` | `empresas.id` |
| `pedido_detalle` | `pedido_id` | `pedidos.id` |
| `pedido_detalle` | `material_id` | `materiales.id` |
| `factura_detalle` | `factura_id` | `facturas.id` |
| `factura_detalle` | `material_id` | `materiales.id` |
| `usuarios_sesiones` | `usuario_id` | `usuarios.id` |
| `password_resets` | `user_id` | `usuarios.id` |
| `ia_requests` | `empresa_id` | `empresas.id` |
| `ia_requests` | `usuario_id` | `usuarios.id` |
| `auditoria_acciones` | `empresa_id` | `empresas.id` |
| `auditoria_acciones` | `usuario_id` | `usuarios.id` |

## Restricciones CHECK

El esquema utiliza restricciones `CHECK` para evitar determinados valores inválidos.

Entre las restricciones definidas se encuentran controles sobre:

- Precios que no deben ser negativos.
- Stock que no debe ser negativo.
- Cantidades de detalles.
- Valores monetarios de documentos comerciales.

Estas restricciones complementan las validaciones realizadas por la aplicación y proporcionan una segunda capa de protección directamente en la base de datos.

## Restricciones UNIQUE

Las restricciones `UNIQUE` evitan la duplicación de determinados valores dentro de las entidades correspondientes.

Entre ellas se encuentran:

| Tabla | Campo o combinación |
|---|---|
| `empresas` | `ruc` |
| `usuarios` | `email` |
| `usuarios` | `cedula_ruc` |
| `clientes` | `empresa_id`, `telefono` |
| `trabajos` | `empresa_id`, `nombre` |
| `materiales_variantes` | `material_id`, `color_id` |
| `proveedor_materiales` | `proveedor_id`, `material_id` |
| `facturas` | `empresa_id`, `numero_factura` |
| `facturas` | `empresa_id`, `clave_acceso` |
| `secuencias_comprobantes` | `empresa_id`, `tipo_comprobante`, `establecimiento`, `punto_emision` |
| `token_blacklist` | `jti` |
| `usuarios_sesiones` | `token_hash` |

## Valores ENUM

Las columnas que representan estados o categorías controladas utilizan valores `ENUM`.

Entre los principales conjuntos definidos se encuentran:

| Entidad | Campo | Valores |
|---|---|---|
| `empresas` | `plan` | `basic`, `pro`, `enterprise` |
| `usuarios` | `rol` | `ADMIN`, `VENDEDOR`, `ALMACEN`, `CLIENTE` |
| `facturas` | estado | `BORRADOR`, `EMITIDA`, `AUTORIZADA`, `ANULADA`, `DEVUELTA`, `NO_AUTORIZADA` |
| `facturas` | estado SRI | `PENDIENTE`, `RECIBIDA`, `DEVUELTA`, `AUTORIZADA`, `NO_AUTORIZADA`, `SIN_ENVIAR` |
| `auditoria_acciones` | `accion` | `DELETE`, `ANULACION`, `LOGIN`, `LOGOUT`, `LOGIN_FALLIDO`, `REFRESH_TOKEN`, `CAMBIO_PASSWORD` |
| `ia_requests` | `status` | `OK`, `ERROR`, `TIMEOUT` |

## Reglas de eliminación

Las claves foráneas utilizan diferentes comportamientos de eliminación según la dependencia entre las entidades.

Entre las reglas definidas se encuentran:

- `CASCADE` para relaciones donde los registros dependientes no tienen sentido sin el registro principal.
- `SET NULL` para relaciones donde se conserva el registro dependiente aunque desaparezca la referencia asociada.
- Relaciones con eliminación restringida cuando corresponde preservar la integridad del registro relacionado.

Un ejemplo de eliminación en cascada corresponde a los detalles dependientes de determinadas entidades principales.

## Integridad multiempresa

La base de datos utiliza `empresa_id` en múltiples entidades para asociar los registros con una empresa.

Este campo permite mantener la separación lógica de la información entre organizaciones en entidades como:

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

La integridad multiempresa se complementa con las claves foráneas hacia `empresas`, mientras que el aislamiento de los registros debe ser aplicado por la capa de acceso a datos y la lógica de la aplicación.
