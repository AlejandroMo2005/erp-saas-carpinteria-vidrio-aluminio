# Entidades automáticas de base de datos

## auditoria_acciones

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `usuario_id` | `int DEFAULT NULL` |
| `usuario_nombre` | `varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot del nombre al momento de la acción'` |
| `accion` | `enum('DELETE','ANULACION','LOGIN','LOGOUT','LOGIN_FALLIDO','REFRESH_TOKEN','CAMBIO_PASSWORD') COLLATE utf8mb4_unicode_ci NOT NULL` |
| `tabla_afectada` | `varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `registro_id` | `varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `detalle` | `json DEFAULT NULL` |
| `ip_address` | `varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `user_agent` | `varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `created_at` | `timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP` |

## autorizaciones_sri

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `factura_id` | `int NOT NULL` |
| `tipo_comprobante` | `varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `numero_autorizacion` | `varchar(49) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `fecha_autorizacion` | `datetime DEFAULT NULL` |
| `ambiente` | `enum('PRUEBAS','PRODUCCION') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRUEBAS'` |
| `estado` | `varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `mensajes` | `text COLLATE utf8mb4_unicode_ci` |
| `xml_request` | `longtext COLLATE utf8mb4_unicode_ci` |
| `xml_response` | `longtext COLLATE utf8mb4_unicode_ci` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |

## clientes

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `nombre` | `varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `telefono` | `varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `activo` | `tinyint(1) DEFAULT '1'` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |

## colores

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `nombre` | `varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `valor` | `varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `tipo` | `enum('MARCO','VIDRIO') COLLATE utf8mb4_unicode_ci NOT NULL` |
| `activo` | `tinyint(1) DEFAULT '1'` |

## configuracion

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `clave` | `varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `valor` | `varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `updated_at` | `timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización del valor'` |

## empresas

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `nombre` | `varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre comercial'` |
| `razon_social` | `varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `ruc` | `varchar(13) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `direccion` | `text COLLATE utf8mb4_unicode_ci` |
| `telefono` | `varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `email` | `varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `logo_url` | `varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `plan` | `enum('basic','pro','enterprise') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pro'` |
| `activo` | `tinyint(1) NOT NULL DEFAULT '1'` |
| `created_at` | `timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |

## factura_detalle

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `factura_id` | `int NOT NULL` |
| `material_id` | `int DEFAULT NULL COMMENT 'NULL si es servicio libre'` |
| `codigo_principal` | `varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `codigo_auxiliar` | `varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `descripcion` | `text COLLATE utf8mb4_unicode_ci NOT NULL` |
| `cantidad` | `decimal(10,2) NOT NULL` |
| `precio_unitario` | `decimal(12,4) NOT NULL` |
| `descuento` | `decimal(12,2) NOT NULL DEFAULT '0.00'` |
| `precio_total_sin_iva` | `decimal(12,2) NOT NULL` |
| `porcentaje_iva` | `decimal(5,2) NOT NULL DEFAULT '0.00'` |
| `valor_iva` | `decimal(12,2) NOT NULL DEFAULT '0.00'` |
| `detalles_adicionales` | `json DEFAULT NULL` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |

## facturas

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `numero_factura` | `varchar(17) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '001-001-000000001'` |
| `clave_acceso` | `varchar(49) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '48 dígitos + dígito verificador'` |
| `pedido_id` | `int DEFAULT NULL` |
| `cliente_id` | `int DEFAULT NULL` |
| `usuario_id` | `int DEFAULT NULL COMMENT 'Vendedor que emitió'` |
| `cliente_identificacion` | `varchar(13) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `cliente_tipo_identificacion` | `enum('RUC','CEDULA','PASAPORTE','CONSUMIDOR_FINAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CONSUMIDOR_FINAL'` |
| `cliente_nombre` | `varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `cliente_direccion` | `text COLLATE utf8mb4_unicode_ci` |
| `cliente_telefono` | `varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `cliente_email` | `varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `fecha_emision` | `date NOT NULL` |
| `fecha_autorizacion` | `datetime DEFAULT NULL` |
| `subtotal_sin_iva` | `decimal(12,2) NOT NULL DEFAULT '0.00'` |
| `subtotal_con_iva` | `decimal(12,2) NOT NULL DEFAULT '0.00'` |
| `iva` | `decimal(12,2) NOT NULL DEFAULT '0.00'` |
| `descuento` | `decimal(12,2) NOT NULL DEFAULT '0.00'` |
| `propina` | `decimal(12,2) NOT NULL DEFAULT '0.00'` |
| `total` | `decimal(12,2) NOT NULL` |
| `estado` | `enum('BORRADOR','EMITIDA','AUTORIZADA','ANULADA','DEVUELTA','NO_AUTORIZADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BORRADOR'` |
| `estado_sri` | `enum('PENDIENTE','RECIBIDA','DEVUELTA','AUTORIZADA','NO_AUTORIZADA','SIN_ENVIAR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SIN_ENVIAR'` |
| `observaciones` | `text COLLATE utf8mb4_unicode_ci` |
| `datos_adicionales` | `json DEFAULT NULL` |
| `xml_firmado` | `longtext COLLATE utf8mb4_unicode_ci` |
| `xml_autorizado` | `longtext COLLATE utf8mb4_unicode_ci` |
| `mensaje_sri` | `text COLLATE utf8mb4_unicode_ci` |
| `anulada_at` | `datetime DEFAULT NULL` |
| `anulada_por` | `int DEFAULT NULL` |
| `motivo_anulacion` | `text COLLATE utf8mb4_unicode_ci` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |

## ia_requests

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `usuario_id` | `int DEFAULT NULL` |
| `trabajo_tipo` | `varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `prompt` | `varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `imagen_input_hash` | `varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `resultado_url` | `text COLLATE utf8mb4_unicode_ci` |
| `modelo` | `varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'runwayml/stable-diffusion-inpainting'` |
| `duracion_ms` | `int DEFAULT NULL` |
| `status` | `enum('OK','ERROR','TIMEOUT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OK'` |
| `created_at` | `timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP` |

## material_colores

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `material_id` | `int NOT NULL` |
| `color_id` | `int NOT NULL` |

## materiales

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `nombre` | `varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `descripcion` | `text COLLATE utf8mb4_unicode_ci` |
| `precio` | `decimal(10,2) NOT NULL` |
| `stock` | `int NOT NULL DEFAULT '0'` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |
| `stock_minimo` | `decimal(10,2) DEFAULT '10.00'` |
| `activo` | `tinyint(1) DEFAULT '1'` |
| `deleted_at` | `timestamp NULL DEFAULT NULL` |

## materiales_variantes

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `material_id` | `int NOT NULL` |
| `color_id` | `int NOT NULL` |
| `stock` | `decimal(10,2) DEFAULT '0.00'` |
| `precio` | `decimal(10,2) DEFAULT '0.00'` |
| `updated_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |

## password_resets

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `user_id` | `int NOT NULL` |
| `code` | `varchar(6) NOT NULL` |
| `token` | `varchar(255) NOT NULL` |
| `expires_at` | `datetime NOT NULL` |
| `used` | `tinyint(1) DEFAULT '0'` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |

## pedido_detalle

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `pedido_id` | `int NOT NULL` |
| `material_id` | `int NOT NULL` |
| `color_id` | `int DEFAULT NULL` |
| `cantidad` | `decimal(10,2) NOT NULL` |
| `precio_unitario` | `decimal(10,2) NOT NULL` |
| `detalle` | `text COLLATE utf8mb4_unicode_ci` |

## pedidos

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `fecha` | `date DEFAULT (curdate())` |
| `estado` | `enum('PENDIENTE','PROCESADO','ENTREGADO','CANCELADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE'` |
| `total` | `decimal(10,2) NOT NULL` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |
| `usuario_id` | `int DEFAULT NULL` |
| `proforma_id` | `int DEFAULT NULL` |
| `observaciones` | `text COLLATE utf8mb4_unicode_ci` |
| `deleted_at` | `timestamp NULL DEFAULT NULL` |

## proforma_detalle

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `proforma_id` | `int NOT NULL` |
| `material_id` | `int NOT NULL` |
| `color_id` | `int DEFAULT NULL` |
| `cantidad` | `decimal(10,2) NOT NULL` |
| `precio_unitario` | `decimal(10,2) NOT NULL` |

## proforma_items

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `proforma_id` | `int NOT NULL` |
| `trabajo_id` | `int NOT NULL` |
| `color_id` | `int DEFAULT NULL` |
| `ancho` | `decimal(10,2) NOT NULL` |
| `alto` | `decimal(10,2) NOT NULL` |
| `cantidad` | `int NOT NULL DEFAULT '1'` |
| `detalle` | `text COLLATE utf8mb4_unicode_ci` |
| `precio_unitario` | `decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Precio por m² × ancho × alto calculado al guardar'` |
| `subtotal` | `decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'precio_unitario × cantidad (sin IVA)'` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |

## proformas

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `fecha` | `date DEFAULT (curdate())` |
| `fecha_agendamiento` | `date DEFAULT NULL` |
| `cliente` | `varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `telefono` | `varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `total` | `decimal(10,2) NOT NULL` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |
| `usuario_id` | `int DEFAULT NULL` |
| `deleted_at` | `timestamp NULL DEFAULT NULL` |

## proveedor_materiales

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `proveedor_id` | `int NOT NULL` |
| `material_id` | `int NOT NULL` |

## proveedores

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `nombre` | `varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `ciudad` | `varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `telefono_whatsapp` | `varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `email` | `varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `notas` | `text COLLATE utf8mb4_unicode_ci` |
| `activo` | `tinyint(1) DEFAULT '1'` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |
| `deleted_at` | `timestamp NULL DEFAULT NULL` |

## recetas

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `trabajo_id` | `int NOT NULL` |
| `material_id` | `int NOT NULL` |
| `unidad_calculo` | `varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `factor` | `decimal(10,4) NOT NULL` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |

## secuencias_comprobantes

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `tipo_comprobante` | `enum('FACTURA','NOTA_CREDITO','NOTA_DEBITO','RETENCION','GUIA_REMISION') COLLATE utf8mb4_unicode_ci NOT NULL` |
| `establecimiento` | `varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '001'` |
| `punto_emision` | `varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '001'` |
| `secuencia_actual` | `int NOT NULL DEFAULT '0'` |
| `activo` | `tinyint(1) DEFAULT '1'` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |

## solicitud_items

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `solicitud_id` | `int NOT NULL` |
| `material_id` | `int DEFAULT NULL` |
| `variante_id` | `int DEFAULT NULL` |
| `nombre_material` | `varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `color` | `varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `cantidad` | `decimal(10,2) NOT NULL` |
| `unidad` | `varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'm'` |

## solicitudes_materiales

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `proveedor_id` | `int DEFAULT NULL` |
| `usuario_id` | `int DEFAULT NULL` |
| `plantilla_texto` | `text COLLATE utf8mb4_unicode_ci NOT NULL` |
| `estado` | `varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente'` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |

## token_blacklist

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int unsigned NOT NULL AUTO_INCREMENT` |
| `jti` | `varchar(36) NOT NULL` |
| `expires_at` | `datetime NOT NULL` |
| `created_at` | `timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP` |

## trabajo_referencias

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int unsigned NOT NULL AUTO_INCREMENT` |
| `trabajo_id` | `int unsigned NOT NULL` |
| `filename` | `varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `descriptores` | `text COLLATE utf8mb4_unicode_ci NOT NULL` |
| `peso` | `decimal(3,2) NOT NULL DEFAULT '0.80'` |
| `activo` | `tinyint(1) NOT NULL DEFAULT '1'` |
| `created_at` | `timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP` |

## trabajos

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1'` |
| `nombre` | `varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `descripcion` | `varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `tipo` | `varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `activo` | `tinyint(1) DEFAULT '1'` |
| `prompt_base` | `varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Descripcion base en ingles que se agrega a todos los prompts de este trabajo'` |
| `variante` | `varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |

## usuarios

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `empresa_id` | `int NOT NULL DEFAULT '1' COMMENT 'FK → empresas.id'` |
| `nombre` | `varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `nombre_completo` | `varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `telefono` | `varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `email` | `varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `cedula_ruc` | `varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `direccion` | `varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `password` | `varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `rol` | `enum('ADMIN','VENDEDOR','ALMACEN','CLIENTE') COLLATE utf8mb4_unicode_ci DEFAULT 'CLIENTE' COMMENT 'ADMIN/VENDEDOR/ALMACEN = sistema \| CLIENTE = registro web'` |
| `activo` | `tinyint(1) DEFAULT '1'` |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |
| `reset_token` | `varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `reset_expires` | `bigint DEFAULT NULL` |
| `last_activity` | `timestamp NULL DEFAULT NULL COMMENT 'Última actividad — expiración automática a los 7 días sin uso'` |
| `token_id` | `varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'jti del access token activo — NULL invalida todos los tokens'` |
| `deleted_at` | `timestamp NULL DEFAULT NULL COMMENT 'Soft delete: NULL=activo, fecha=eliminado'` |

## usuarios_sesiones

**Fuente:** `e2e/database/schema.sql`

| Columna | Definición |
| --- | --- |
| `id` | `int NOT NULL AUTO_INCREMENT` |
| `usuario_id` | `int NOT NULL` |
| `token_hash` | `varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL` |
| `ip` | `varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `user_agent` | `varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL` |
| `expires_at` | `timestamp NOT NULL` |
| `created_at` | `timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP` |
| `last_used_at` | `timestamp NULL DEFAULT NULL COMMENT 'Último uso del refresh token — para expiración por sesión'` |

> Este archivo es generado automáticamente. No editar manualmente.
