# Relaciones automáticas de base de datos

| Restricción | Columna | Tabla referenciada | Columna referenciada | Fuente |
| --- | --- | --- | --- | --- |
| `fk_asri_factura` | `factura_id` | `facturas` | `id` | `e2e/database/schema.sql` |
| `fk_auditoria_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_auditoria_usuario` | `usuario_id` | `usuarios` | `id` | `e2e/database/schema.sql` |
| `fk_clientes_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_colores_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_config_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_facturas_anulada_por` | `anulada_por` | `usuarios` | `id` | `e2e/database/schema.sql` |
| `fk_facturas_cliente` | `cliente_id` | `clientes` | `id` | `e2e/database/schema.sql` |
| `fk_facturas_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_facturas_pedido` | `pedido_id` | `pedidos` | `id` | `e2e/database/schema.sql` |
| `fk_facturas_usuario` | `usuario_id` | `usuarios` | `id` | `e2e/database/schema.sql` |
| `fk_fd_factura` | `factura_id` | `facturas` | `id` | `e2e/database/schema.sql` |
| `fk_fd_material` | `material_id` | `materiales` | `id` | `e2e/database/schema.sql` |
| `fk_ia_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_ia_requests_usuario` | `usuario_id` | `usuarios` | `id` | `e2e/database/schema.sql` |
| `fk_item_material` | `material_id` | `materiales` | `id` | `e2e/database/schema.sql` |
| `fk_item_solicitud` | `solicitud_id` | `solicitudes_materiales` | `id` | `e2e/database/schema.sql` |
| `fk_materiales_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_pedido_detalle_cascade` | `pedido_id` | `pedidos` | `id` | `e2e/database/schema.sql` |
| `fk_pedido_detalle_color` | `color_id` | `colores` | `id` | `e2e/database/schema.sql` |
| `fk_pedidos_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_pedidos_proforma` | `proforma_id` | `proformas` | `id` | `e2e/database/schema.sql` |
| `fk_pedidos_usuario` | `usuario_id` | `usuarios` | `id` | `e2e/database/schema.sql` |
| `fk_proforma_detalle_color` | `color_id` | `colores` | `id` | `e2e/database/schema.sql` |
| `fk_proforma_items_color` | `color_id` | `colores` | `id` | `e2e/database/schema.sql` |
| `fk_proforma_items_proforma` | `proforma_id` | `proformas` | `id` | `e2e/database/schema.sql` |
| `fk_proforma_items_trabajo` | `trabajo_id` | `trabajos` | `id` | `e2e/database/schema.sql` |
| `fk_proformas_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_proformas_usuario` | `usuario_id` | `usuarios` | `id` | `e2e/database/schema.sql` |
| `fk_prov_mat_material` | `material_id` | `materiales` | `id` | `e2e/database/schema.sql` |
| `fk_prov_mat_proveedor` | `proveedor_id` | `proveedores` | `id` | `e2e/database/schema.sql` |
| `fk_proveedores_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_recetas_material` | `material_id` | `materiales` | `id` | `e2e/database/schema.sql` |
| `fk_recetas_trabajo` | `trabajo_id` | `trabajos` | `id` | `e2e/database/schema.sql` |
| `fk_secuencias_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_sesiones_usuario` | `usuario_id` | `usuarios` | `id` | `e2e/database/schema.sql` |
| `fk_solicitud_proveedor` | `proveedor_id` | `proveedores` | `id` | `e2e/database/schema.sql` |
| `fk_solicitud_usuario` | `usuario_id` | `usuarios` | `id` | `e2e/database/schema.sql` |
| `fk_solicitud_variante` | `variante_id` | `materiales_variantes` | `id` | `e2e/database/schema.sql` |
| `fk_solicitudes_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_trabajos_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `fk_usuarios_empresa` | `empresa_id` | `empresas` | `id` | `e2e/database/schema.sql` |
| `material_colores_ibfk_1` | `material_id` | `materiales` | `id` | `e2e/database/schema.sql` |
| `material_colores_ibfk_2` | `color_id` | `colores` | `id` | `e2e/database/schema.sql` |
| `materiales_variantes_ibfk_1` | `material_id` | `materiales` | `id` | `e2e/database/schema.sql` |
| `materiales_variantes_ibfk_2` | `color_id` | `colores` | `id` | `e2e/database/schema.sql` |
| `password_resets_ibfk_1` | `user_id` | `usuarios` | `id` | `e2e/database/schema.sql` |
| `pedido_detalle_ibfk_4` | `material_id` | `materiales` | `id` | `e2e/database/schema.sql` |
| `proforma_detalle_ibfk_3` | `proforma_id` | `proformas` | `id` | `e2e/database/schema.sql` |
| `proforma_detalle_ibfk_4` | `material_id` | `materiales` | `id` | `e2e/database/schema.sql` |

## Resumen

- Relaciones detectadas: 50

> Este archivo es generado automáticamente. No editar manualmente.
