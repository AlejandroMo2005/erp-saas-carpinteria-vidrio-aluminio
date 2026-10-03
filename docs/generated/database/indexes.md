# Índices de base de datos

Este archivo se genera automáticamente a partir de las fuentes SQL del proyecto.

| Tabla | Índice | Tipo | Columnas | Fuente |
| --- | --- | --- | --- | --- |
| `auditoria_acciones` | `idx_auditoria_accion_fecha` | INDEX | `accion`, `created_at` | `e2e/database/schema.sql` |
| `auditoria_acciones` | `idx_auditoria_empresa_fecha` | INDEX | `empresa_id`, `created_at` | `e2e/database/schema.sql` |
| `auditoria_acciones` | `idx_auditoria_fecha` | INDEX | `created_at` | `e2e/database/schema.sql` |
| `auditoria_acciones` | `idx_auditoria_ip` | INDEX | `ip_address` | `e2e/database/schema.sql` |
| `auditoria_acciones` | `idx_auditoria_tabla` | INDEX | `tabla_afectada` | `e2e/database/schema.sql` |
| `auditoria_acciones` | `idx_auditoria_usuario_fecha` | INDEX | `usuario_id`, `created_at` | `e2e/database/schema.sql` |
| `auditoria_acciones` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `auditoria_acciones` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `auditoria_acciones` | `PRIMARY` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `autorizaciones_sri` | `idx_asri_estado` | INDEX | `estado` | `e2e/database/schema.sql` |
| `autorizaciones_sri` | `idx_asri_factura_id` | INDEX | `factura_id` | `e2e/database/schema.sql` |
| `autorizaciones_sri` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `autorizaciones_sri` | `PRIMARY` | INDEX | `factura_id` | `e2e/database/schema.sql` |
| `clientes` | `idx_clientes_empresa` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `clientes` | `idx_clientes_nombre` | INDEX | `nombre` | `e2e/database/schema.sql` |
| `clientes` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `clientes` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `clientes` | `uq_clientes_telefono_empresa` | UNIQUE | `empresa_id`, `telefono` | `e2e/database/schema.sql` |
| `colores` | `idx_colores_empresa` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `colores` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `colores` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `configuracion` | `idx_config_empresa` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `configuracion` | `PRIMARY` | PRIMARY KEY | `empresa_id`, `clave` | `e2e/database/schema.sql` |
| `configuracion` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `empresas` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `empresas` | `uq_empresas_ruc` | UNIQUE | `ruc` | `e2e/database/schema.sql` |
| `factura_detalle` | `fk_fd_factura` | INDEX | `factura_id` | `e2e/database/schema.sql` |
| `factura_detalle` | `fk_fd_material` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `factura_detalle` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `factura_detalle` | `PRIMARY` | INDEX | `factura_id` | `e2e/database/schema.sql` |
| `factura_detalle` | `PRIMARY` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `facturas` | `fk_facturas_anulada_por` | INDEX | `anulada_por` | `e2e/database/schema.sql` |
| `facturas` | `fk_facturas_pedido` | INDEX | `pedido_id` | `e2e/database/schema.sql` |
| `facturas` | `idx_facturas_cliente_fecha` | INDEX | `cliente_id`, `fecha_emision` | `e2e/database/schema.sql` |
| `facturas` | `idx_facturas_cliente_ident` | INDEX | `cliente_identificacion` | `e2e/database/schema.sql` |
| `facturas` | `idx_facturas_empresa_fecha` | INDEX | `empresa_id`, `fecha_emision` | `e2e/database/schema.sql` |
| `facturas` | `idx_facturas_estado_fecha` | INDEX | `estado`, `fecha_emision` | `e2e/database/schema.sql` |
| `facturas` | `idx_facturas_estado_sri` | INDEX | `estado_sri` | `e2e/database/schema.sql` |
| `facturas` | `idx_facturas_fecha_emision` | INDEX | `fecha_emision` | `e2e/database/schema.sql` |
| `facturas` | `idx_facturas_usuario_fecha` | INDEX | `usuario_id`, `fecha_emision` | `e2e/database/schema.sql` |
| `facturas` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `facturas` | `PRIMARY` | INDEX | `anulada_por` | `e2e/database/schema.sql` |
| `facturas` | `PRIMARY` | INDEX | `cliente_id` | `e2e/database/schema.sql` |
| `facturas` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `facturas` | `PRIMARY` | INDEX | `pedido_id` | `e2e/database/schema.sql` |
| `facturas` | `PRIMARY` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `facturas` | `uq_factura_clave_empresa` | UNIQUE | `empresa_id`, `clave_acceso` | `e2e/database/schema.sql` |
| `facturas` | `uq_factura_numero_empresa` | UNIQUE | `empresa_id`, `numero_factura` | `e2e/database/schema.sql` |
| `ia_requests` | `idx_ia_empresa` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `ia_requests` | `idx_ia_requests_created_at` | INDEX | `created_at` | `e2e/database/schema.sql` |
| `ia_requests` | `idx_ia_requests_status` | INDEX | `status` | `e2e/database/schema.sql` |
| `ia_requests` | `idx_ia_requests_trabajo_tipo` | INDEX | `trabajo_tipo` | `e2e/database/schema.sql` |
| `ia_requests` | `idx_ia_requests_usuario_id` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `ia_requests` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `ia_requests` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `ia_requests` | `PRIMARY` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `material_colores` | `color_id` | INDEX | `color_id` | `e2e/database/schema.sql` |
| `material_colores` | `material_id` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `material_colores` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `material_colores` | `PRIMARY` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `material_colores` | `PRIMARY` | INDEX | `color_id` | `e2e/database/schema.sql` |
| `materiales` | `idx_materiales_deleted` | INDEX | `deleted_at` | `e2e/database/schema.sql` |
| `materiales` | `idx_materiales_empresa` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `materiales` | `idx_materiales_nombre` | INDEX | `nombre` | `e2e/database/schema.sql` |
| `materiales` | `idx_materiales_precio` | INDEX | `precio` | `e2e/database/schema.sql` |
| `materiales` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `materiales` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `materiales_variantes` | `color_id` | INDEX | `color_id` | `e2e/database/schema.sql` |
| `materiales_variantes` | `material_color` | UNIQUE | `material_id`, `color_id` | `e2e/database/schema.sql` |
| `materiales_variantes` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `materiales_variantes` | `PRIMARY` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `materiales_variantes` | `PRIMARY` | INDEX | `color_id` | `e2e/database/schema.sql` |
| `password_resets` | `idx_expires` | INDEX | `expires_at` | `e2e/database/schema.sql` |
| `password_resets` | `idx_token` | INDEX | `token` | `e2e/database/schema.sql` |
| `password_resets` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `password_resets` | `PRIMARY` | INDEX | `user_id` | `e2e/database/schema.sql` |
| `password_resets` | `user_id` | INDEX | `user_id` | `e2e/database/schema.sql` |
| `pedido_detalle` | `idx_pedido_detalle_color_id` | INDEX | `color_id` | `e2e/database/schema.sql` |
| `pedido_detalle` | `idx_pedido_detalle_material_id` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `pedido_detalle` | `idx_pedido_detalle_pedido_id` | INDEX | `pedido_id` | `e2e/database/schema.sql` |
| `pedido_detalle` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `pedido_detalle` | `PRIMARY` | INDEX | `pedido_id` | `e2e/database/schema.sql` |
| `pedido_detalle` | `PRIMARY` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `pedido_detalle` | `PRIMARY` | INDEX | `color_id` | `e2e/database/schema.sql` |
| `pedidos` | `fk_pedidos_usuario` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `pedidos` | `idx_pedidos_deleted` | INDEX | `deleted_at` | `e2e/database/schema.sql` |
| `pedidos` | `idx_pedidos_empresa_fecha` | INDEX | `empresa_id`, `fecha` | `e2e/database/schema.sql` |
| `pedidos` | `idx_pedidos_estado` | INDEX | `estado` | `e2e/database/schema.sql` |
| `pedidos` | `idx_pedidos_fecha` | INDEX | `fecha` | `e2e/database/schema.sql` |
| `pedidos` | `idx_pedidos_proforma_id` | INDEX | `proforma_id` | `e2e/database/schema.sql` |
| `pedidos` | `idx_pedidos_total` | INDEX | `total` | `e2e/database/schema.sql` |
| `pedidos` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `pedidos` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `pedidos` | `PRIMARY` | INDEX | `proforma_id` | `e2e/database/schema.sql` |
| `pedidos` | `PRIMARY` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `proforma_detalle` | `idx_proforma_detalle_color_id` | INDEX | `color_id` | `e2e/database/schema.sql` |
| `proforma_detalle` | `idx_proforma_detalle_material_id` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `proforma_detalle` | `idx_proforma_detalle_proforma_id` | INDEX | `proforma_id` | `e2e/database/schema.sql` |
| `proforma_detalle` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `proforma_detalle` | `PRIMARY` | INDEX | `proforma_id` | `e2e/database/schema.sql` |
| `proforma_detalle` | `PRIMARY` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `proforma_detalle` | `PRIMARY` | INDEX | `color_id` | `e2e/database/schema.sql` |
| `proforma_items` | `idx_proforma_items_color_id` | INDEX | `color_id` | `e2e/database/schema.sql` |
| `proforma_items` | `idx_proforma_items_proforma_id` | INDEX | `proforma_id` | `e2e/database/schema.sql` |
| `proforma_items` | `idx_proforma_items_trabajo_id` | INDEX | `trabajo_id` | `e2e/database/schema.sql` |
| `proforma_items` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `proforma_items` | `PRIMARY` | INDEX | `color_id` | `e2e/database/schema.sql` |
| `proforma_items` | `PRIMARY` | INDEX | `proforma_id` | `e2e/database/schema.sql` |
| `proforma_items` | `PRIMARY` | INDEX | `trabajo_id` | `e2e/database/schema.sql` |
| `proformas` | `fk_proformas_usuario` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `proformas` | `idx_proformas_cliente` | INDEX | `cliente` | `e2e/database/schema.sql` |
| `proformas` | `idx_proformas_deleted` | INDEX | `deleted_at` | `e2e/database/schema.sql` |
| `proformas` | `idx_proformas_empresa_fecha` | INDEX | `empresa_id`, `fecha` | `e2e/database/schema.sql` |
| `proformas` | `idx_proformas_fecha` | INDEX | `fecha` | `e2e/database/schema.sql` |
| `proformas` | `idx_proformas_total` | INDEX | `total` | `e2e/database/schema.sql` |
| `proformas` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `proformas` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `proformas` | `PRIMARY` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `proveedor_materiales` | `idx_prov_mat_material` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `proveedor_materiales` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `proveedor_materiales` | `PRIMARY` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `proveedor_materiales` | `PRIMARY` | INDEX | `proveedor_id` | `e2e/database/schema.sql` |
| `proveedor_materiales` | `unique_proveedor_material` | UNIQUE | `proveedor_id`, `material_id` | `e2e/database/schema.sql` |
| `proveedores` | `idx_proveedores_deleted` | INDEX | `deleted_at` | `e2e/database/schema.sql` |
| `proveedores` | `idx_proveedores_empresa` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `proveedores` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `proveedores` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `recetas` | `fk_recetas_material` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `recetas` | `fk_recetas_trabajo` | INDEX | `trabajo_id` | `e2e/database/schema.sql` |
| `recetas` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `recetas` | `PRIMARY` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `recetas` | `PRIMARY` | INDEX | `trabajo_id` | `e2e/database/schema.sql` |
| `secuencias_comprobantes` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `secuencias_comprobantes` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `secuencias_comprobantes` | `uq_secuencia_empresa` | UNIQUE | `empresa_id`, `tipo_comprobante`, `establecimiento`, `punto_emision` | `e2e/database/schema.sql` |
| `solicitud_items` | `fk_item_material` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `solicitud_items` | `fk_item_solicitud` | INDEX | `solicitud_id` | `e2e/database/schema.sql` |
| `solicitud_items` | `fk_solicitud_variante` | INDEX | `variante_id` | `e2e/database/schema.sql` |
| `solicitud_items` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `solicitud_items` | `PRIMARY` | INDEX | `material_id` | `e2e/database/schema.sql` |
| `solicitud_items` | `PRIMARY` | INDEX | `solicitud_id` | `e2e/database/schema.sql` |
| `solicitud_items` | `PRIMARY` | INDEX | `variante_id` | `e2e/database/schema.sql` |
| `solicitudes_materiales` | `fk_solicitud_usuario` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `solicitudes_materiales` | `idx_solicitudes_empresa` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `solicitudes_materiales` | `idx_solicitudes_estado` | INDEX | `estado` | `e2e/database/schema.sql` |
| `solicitudes_materiales` | `idx_solicitudes_prov` | INDEX | `proveedor_id` | `e2e/database/schema.sql` |
| `solicitudes_materiales` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `solicitudes_materiales` | `PRIMARY` | INDEX | `proveedor_id` | `e2e/database/schema.sql` |
| `solicitudes_materiales` | `PRIMARY` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `solicitudes_materiales` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `token_blacklist` | `idx_expires` | INDEX | `expires_at` | `e2e/database/schema.sql` |
| `token_blacklist` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `token_blacklist` | `uq_jti` | UNIQUE | `jti` | `e2e/database/schema.sql` |
| `trabajo_referencias` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `trabajos` | `idx_trabajos_empresa` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `trabajos` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `trabajos` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `trabajos` | `uq_trabajos_nombre_empresa` | UNIQUE | `empresa_id`, `nombre` | `e2e/database/schema.sql` |
| `usuarios` | `email` | UNIQUE | `email` | `e2e/database/schema.sql` |
| `usuarios` | `idx_usuarios_activo` | INDEX | `activo` | `e2e/database/schema.sql` |
| `usuarios` | `idx_usuarios_deleted` | INDEX | `deleted_at` | `e2e/database/schema.sql` |
| `usuarios` | `idx_usuarios_empresa` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `usuarios` | `idx_usuarios_last_activity` | INDEX | `last_activity` | `e2e/database/schema.sql` |
| `usuarios` | `idx_usuarios_nombre_completo` | INDEX | `nombre_completo` | `e2e/database/schema.sql` |
| `usuarios` | `idx_usuarios_rol` | INDEX | `rol` | `e2e/database/schema.sql` |
| `usuarios` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `usuarios` | `PRIMARY` | INDEX | `empresa_id` | `e2e/database/schema.sql` |
| `usuarios` | `uq_usuarios_cedula_ruc` | UNIQUE | `cedula_ruc` | `e2e/database/schema.sql` |
| `usuarios_sesiones` | `idx_sesiones_expires` | INDEX | `expires_at` | `e2e/database/schema.sql` |
| `usuarios_sesiones` | `idx_sesiones_usuario` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `usuarios_sesiones` | `PRIMARY` | PRIMARY KEY | `id` | `e2e/database/schema.sql` |
| `usuarios_sesiones` | `PRIMARY` | INDEX | `usuario_id` | `e2e/database/schema.sql` |
| `usuarios_sesiones` | `uq_token_hash` | UNIQUE | `token_hash` | `e2e/database/schema.sql` |

> Este archivo es generado automáticamente. No editar manualmente.
