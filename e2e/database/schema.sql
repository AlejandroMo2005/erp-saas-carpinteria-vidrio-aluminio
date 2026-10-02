-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: inventario_proformas
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auditoria_acciones`
--

DROP TABLE IF EXISTS `auditoria_acciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria_acciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `usuario_id` int DEFAULT NULL,
  `usuario_nombre` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot del nombre al momento de la acción',
  `accion` enum('DELETE','ANULACION','LOGIN','LOGOUT','LOGIN_FALLIDO','REFRESH_TOKEN','CAMBIO_PASSWORD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tabla_afectada` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registro_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detalle` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_auditoria_tabla` (`tabla_afectada`),
  KEY `idx_auditoria_fecha` (`created_at`),
  KEY `idx_auditoria_ip` (`ip_address`),
  KEY `idx_auditoria_usuario_fecha` (`usuario_id`,`created_at`),
  KEY `idx_auditoria_accion_fecha` (`accion`,`created_at`),
  KEY `idx_auditoria_empresa_fecha` (`empresa_id`,`created_at`),
  CONSTRAINT `fk_auditoria_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2516 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Auditoría de operaciones críticas — Sprint 10';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `autorizaciones_sri`
--

DROP TABLE IF EXISTS `autorizaciones_sri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `autorizaciones_sri` (
  `id` int NOT NULL AUTO_INCREMENT,
  `factura_id` int NOT NULL,
  `tipo_comprobante` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_autorizacion` varchar(49) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_autorizacion` datetime DEFAULT NULL,
  `ambiente` enum('PRUEBAS','PRODUCCION') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRUEBAS',
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mensajes` text COLLATE utf8mb4_unicode_ci,
  `xml_request` longtext COLLATE utf8mb4_unicode_ci,
  `xml_response` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_asri_factura_id` (`factura_id`),
  KEY `idx_asri_estado` (`estado`),
  CONSTRAINT `fk_asri_factura` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_clientes_telefono_empresa` (`empresa_id`,`telefono`),
  KEY `idx_clientes_nombre` (`nombre`),
  KEY `idx_clientes_empresa` (`empresa_id`),
  CONSTRAINT `fk_clientes_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `colores`
--

DROP TABLE IF EXISTS `colores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('MARCO','VIDRIO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_colores_empresa` (`empresa_id`),
  CONSTRAINT `fk_colores_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `configuracion`
--

DROP TABLE IF EXISTS `configuracion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion` (
  `empresa_id` int NOT NULL DEFAULT '1',
  `clave` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización del valor',
  PRIMARY KEY (`empresa_id`,`clave`),
  KEY `idx_config_empresa` (`empresa_id`),
  CONSTRAINT `fk_config_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre comercial',
  `razon_social` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ruc` varchar(13) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plan` enum('basic','pro','enterprise') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pro',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_empresas_ruc` (`ruc`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla maestra de empresas — Sprint 19 Multi-tenant';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `factura_detalle`
--

DROP TABLE IF EXISTS `factura_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factura_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `factura_id` int NOT NULL,
  `material_id` int DEFAULT NULL COMMENT 'NULL si es servicio libre',
  `codigo_principal` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigo_auxiliar` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(12,4) NOT NULL,
  `descuento` decimal(12,2) NOT NULL DEFAULT '0.00',
  `precio_total_sin_iva` decimal(12,2) NOT NULL,
  `porcentaje_iva` decimal(5,2) NOT NULL DEFAULT '0.00',
  `valor_iva` decimal(12,2) NOT NULL DEFAULT '0.00',
  `detalles_adicionales` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_fd_factura` (`factura_id`),
  KEY `fk_fd_material` (`material_id`),
  CONSTRAINT `fk_fd_factura` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fd_material` FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_fd_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `chk_fd_descuento` CHECK ((`descuento` >= 0)),
  CONSTRAINT `chk_fd_precio_unitario` CHECK ((`precio_unitario` >= 0)),
  CONSTRAINT `chk_fd_total_sin_iva` CHECK ((`precio_total_sin_iva` >= 0)),
  CONSTRAINT `chk_fd_valor_iva` CHECK ((`valor_iva` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `actualizar_totales_factura` AFTER INSERT ON `factura_detalle` FOR EACH ROW BEGIN
  UPDATE facturas
  SET
    subtotal_sin_iva = (
      SELECT COALESCE(SUM(precio_total_sin_iva), 0)
      FROM   factura_detalle
      WHERE  factura_id = NEW.factura_id
        AND  porcentaje_iva = 0
    ),
    subtotal_con_iva = (
      SELECT COALESCE(SUM(precio_total_sin_iva), 0)
      FROM   factura_detalle
      WHERE  factura_id = NEW.factura_id
        AND  porcentaje_iva > 0
    ),
    iva = (
      SELECT COALESCE(SUM(valor_iva), 0)
      FROM   factura_detalle
      WHERE  factura_id = NEW.factura_id
    ),
    total = (
      SELECT COALESCE(SUM(precio_total_sin_iva + valor_iva), 0)
      FROM   factura_detalle
      WHERE  factura_id = NEW.factura_id
    )
  WHERE id = NEW.factura_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `numero_factura` varchar(17) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '001-001-000000001',
  `clave_acceso` varchar(49) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '48 dígitos + dígito verificador',
  `pedido_id` int DEFAULT NULL,
  `cliente_id` int DEFAULT NULL,
  `usuario_id` int DEFAULT NULL COMMENT 'Vendedor que emitió',
  `cliente_identificacion` varchar(13) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cliente_tipo_identificacion` enum('RUC','CEDULA','PASAPORTE','CONSUMIDOR_FINAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CONSUMIDOR_FINAL',
  `cliente_nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_direccion` text COLLATE utf8mb4_unicode_ci,
  `cliente_telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cliente_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_emision` date NOT NULL,
  `fecha_autorizacion` datetime DEFAULT NULL,
  `subtotal_sin_iva` decimal(12,2) NOT NULL DEFAULT '0.00',
  `subtotal_con_iva` decimal(12,2) NOT NULL DEFAULT '0.00',
  `iva` decimal(12,2) NOT NULL DEFAULT '0.00',
  `descuento` decimal(12,2) NOT NULL DEFAULT '0.00',
  `propina` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL,
  `estado` enum('BORRADOR','EMITIDA','AUTORIZADA','ANULADA','DEVUELTA','NO_AUTORIZADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BORRADOR',
  `estado_sri` enum('PENDIENTE','RECIBIDA','DEVUELTA','AUTORIZADA','NO_AUTORIZADA','SIN_ENVIAR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SIN_ENVIAR',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `datos_adicionales` json DEFAULT NULL,
  `xml_firmado` longtext COLLATE utf8mb4_unicode_ci,
  `xml_autorizado` longtext COLLATE utf8mb4_unicode_ci,
  `mensaje_sri` text COLLATE utf8mb4_unicode_ci,
  `anulada_at` datetime DEFAULT NULL,
  `anulada_por` int DEFAULT NULL,
  `motivo_anulacion` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_factura_numero_empresa` (`empresa_id`,`numero_factura`),
  UNIQUE KEY `uq_factura_clave_empresa` (`empresa_id`,`clave_acceso`),
  KEY `fk_facturas_pedido` (`pedido_id`),
  KEY `fk_facturas_anulada_por` (`anulada_por`),
  KEY `idx_facturas_fecha_emision` (`fecha_emision`),
  KEY `idx_facturas_estado_sri` (`estado_sri`),
  KEY `idx_facturas_cliente_ident` (`cliente_identificacion`),
  KEY `idx_facturas_cliente_fecha` (`cliente_id`,`fecha_emision`),
  KEY `idx_facturas_usuario_fecha` (`usuario_id`,`fecha_emision`),
  KEY `idx_facturas_estado_fecha` (`estado`,`fecha_emision`),
  KEY `idx_facturas_empresa_fecha` (`empresa_id`,`fecha_emision`),
  CONSTRAINT `fk_facturas_anulada_por` FOREIGN KEY (`anulada_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_facturas_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_facturas_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_facturas_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_facturas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_descuento_positivo` CHECK ((`descuento` >= 0)),
  CONSTRAINT `chk_iva_positivo` CHECK ((`iva` >= 0)),
  CONSTRAINT `chk_subtotal_con_iva` CHECK ((`subtotal_con_iva` >= 0)),
  CONSTRAINT `chk_subtotal_sin_iva` CHECK ((`subtotal_sin_iva` >= 0)),
  CONSTRAINT `chk_total_positivo` CHECK ((`total` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ia_requests`
--

DROP TABLE IF EXISTS `ia_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ia_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `usuario_id` int DEFAULT NULL,
  `trabajo_tipo` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prompt` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imagen_input_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resultado_url` text COLLATE utf8mb4_unicode_ci,
  `modelo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'runwayml/stable-diffusion-inpainting',
  `duracion_ms` int DEFAULT NULL,
  `status` enum('OK','ERROR','TIMEOUT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OK',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ia_requests_usuario_id` (`usuario_id`),
  KEY `idx_ia_requests_created_at` (`created_at`),
  KEY `idx_ia_requests_trabajo_tipo` (`trabajo_tipo`),
  KEY `idx_ia_requests_status` (`status`),
  KEY `idx_ia_empresa` (`empresa_id`),
  CONSTRAINT `fk_ia_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_ia_requests_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `material_colores`
--

DROP TABLE IF EXISTS `material_colores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_colores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `color_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `material_id` (`material_id`),
  KEY `color_id` (`color_id`),
  CONSTRAINT `material_colores_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`),
  CONSTRAINT `material_colores_ibfk_2` FOREIGN KEY (`color_id`) REFERENCES `colores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `materiales`
--

DROP TABLE IF EXISTS `materiales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materiales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `precio` decimal(10,2) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `stock_minimo` decimal(10,2) DEFAULT '10.00',
  `activo` tinyint(1) DEFAULT '1',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_materiales_nombre` (`nombre`),
  KEY `idx_materiales_precio` (`precio`),
  KEY `idx_materiales_deleted` (`deleted_at`),
  KEY `idx_materiales_empresa` (`empresa_id`),
  CONSTRAINT `fk_materiales_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_materiales_precio` CHECK ((`precio` >= 0)),
  CONSTRAINT `chk_materiales_stock` CHECK ((`stock` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `materiales_variantes`
--

DROP TABLE IF EXISTS `materiales_variantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materiales_variantes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `color_id` int NOT NULL,
  `stock` decimal(10,2) DEFAULT '0.00',
  `precio` decimal(10,2) DEFAULT '0.00',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `material_color` (`material_id`,`color_id`),
  KEY `color_id` (`color_id`),
  CONSTRAINT `materiales_variantes_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `materiales_variantes_ibfk_2` FOREIGN KEY (`color_id`) REFERENCES `colores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `code` varchar(6) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pedido_detalle`
--

DROP TABLE IF EXISTS `pedido_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `material_id` int NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `detalle` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_pedido_detalle_pedido_id` (`pedido_id`),
  KEY `idx_pedido_detalle_material_id` (`material_id`),
  CONSTRAINT `fk_pedido_detalle_cascade` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pedido_detalle_ibfk_4` FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_pedido_detalle_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `chk_pedido_detalle_precio` CHECK ((`precio_unitario` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=1018 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `fecha` date DEFAULT (curdate()),
  `estado` enum('PENDIENTE','PROCESADO','ENTREGADO','CANCELADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `total` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `usuario_id` int DEFAULT NULL,
  `proforma_id` int DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pedidos_fecha` (`fecha`),
  KEY `idx_pedidos_estado` (`estado`),
  KEY `idx_pedidos_total` (`total`),
  KEY `fk_pedidos_usuario` (`usuario_id`),
  KEY `idx_pedidos_proforma_id` (`proforma_id`),
  KEY `idx_pedidos_deleted` (`deleted_at`),
  KEY `idx_pedidos_empresa_fecha` (`empresa_id`,`fecha`),
  CONSTRAINT `fk_pedidos_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_pedidos_proforma` FOREIGN KEY (`proforma_id`) REFERENCES `proformas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proforma_detalle`
--

DROP TABLE IF EXISTS `proforma_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proforma_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `proforma_id` int NOT NULL,
  `material_id` int NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_proforma_detalle_proforma_id` (`proforma_id`),
  KEY `idx_proforma_detalle_material_id` (`material_id`),
  CONSTRAINT `proforma_detalle_ibfk_3` FOREIGN KEY (`proforma_id`) REFERENCES `proformas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `proforma_detalle_ibfk_4` FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_proforma_detalle_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `chk_proforma_detalle_precio` CHECK ((`precio_unitario` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=1003 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `proforma_items`
--

DROP TABLE IF EXISTS `proforma_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proforma_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `proforma_id` int NOT NULL,
  `trabajo_id` int NOT NULL,
  `color_id` int DEFAULT NULL,
  `ancho` decimal(10,2) NOT NULL,
  `alto` decimal(10,2) NOT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `detalle` text COLLATE utf8mb4_unicode_ci,
  `precio_unitario` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Precio por m² × ancho × alto calculado al guardar',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'precio_unitario × cantidad (sin IVA)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_proforma_items_proforma_id` (`proforma_id`),
  KEY `idx_proforma_items_trabajo_id` (`trabajo_id`),
  KEY `idx_proforma_items_color_id` (`color_id`),
  CONSTRAINT `fk_proforma_items_color` FOREIGN KEY (`color_id`) REFERENCES `colores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_proforma_items_proforma` FOREIGN KEY (`proforma_id`) REFERENCES `proformas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proforma_items_trabajo` FOREIGN KEY (`trabajo_id`) REFERENCES `trabajos` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proformas`
--

DROP TABLE IF EXISTS `proformas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proformas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `fecha` date DEFAULT (curdate()),
  `fecha_agendamiento` date DEFAULT NULL,
  `cliente` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `usuario_id` int DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_proformas_fecha` (`fecha`),
  KEY `idx_proformas_cliente` (`cliente`),
  KEY `idx_proformas_total` (`total`),
  KEY `fk_proformas_usuario` (`usuario_id`),
  KEY `idx_proformas_deleted` (`deleted_at`),
  KEY `idx_proformas_empresa_fecha` (`empresa_id`,`fecha`),
  CONSTRAINT `fk_proformas_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_proformas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proveedor_materiales`
--

DROP TABLE IF EXISTS `proveedor_materiales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedor_materiales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `proveedor_id` int NOT NULL,
  `material_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_proveedor_material` (`proveedor_id`,`material_id`),
  KEY `idx_prov_mat_material` (`material_id`),
  CONSTRAINT `fk_prov_mat_material` FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prov_mat_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ciudad` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono_whatsapp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_proveedores_deleted` (`deleted_at`),
  KEY `idx_proveedores_empresa` (`empresa_id`),
  CONSTRAINT `fk_proveedores_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recetas`
--

DROP TABLE IF EXISTS `recetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recetas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trabajo_id` int NOT NULL,
  `material_id` int NOT NULL,
  `unidad_calculo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `factor` decimal(10,4) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_recetas_trabajo` (`trabajo_id`),
  KEY `fk_recetas_material` (`material_id`),
  CONSTRAINT `fk_recetas_material` FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recetas_trabajo` FOREIGN KEY (`trabajo_id`) REFERENCES `trabajos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=181 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `secuencias_comprobantes`
--

DROP TABLE IF EXISTS `secuencias_comprobantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `secuencias_comprobantes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `tipo_comprobante` enum('FACTURA','NOTA_CREDITO','NOTA_DEBITO','RETENCION','GUIA_REMISION') COLLATE utf8mb4_unicode_ci NOT NULL,
  `establecimiento` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '001',
  `punto_emision` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '001',
  `secuencia_actual` int NOT NULL DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_secuencia_empresa` (`empresa_id`,`tipo_comprobante`,`establecimiento`,`punto_emision`),
  CONSTRAINT `fk_secuencias_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solicitud_items`
--

DROP TABLE IF EXISTS `solicitud_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `solicitud_id` int NOT NULL,
  `material_id` int DEFAULT NULL,
  `variante_id` int DEFAULT NULL,
  `nombre_material` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `unidad` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'm',
  PRIMARY KEY (`id`),
  KEY `fk_item_solicitud` (`solicitud_id`),
  KEY `fk_item_material` (`material_id`),
  KEY `fk_solicitud_variante` (`variante_id`),
  CONSTRAINT `fk_item_material` FOREIGN KEY (`material_id`) REFERENCES `materiales` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_item_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes_materiales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_solicitud_variante` FOREIGN KEY (`variante_id`) REFERENCES `materiales_variantes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solicitudes_materiales`
--

DROP TABLE IF EXISTS `solicitudes_materiales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_materiales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `proveedor_id` int DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `plantilla_texto` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_solicitud_usuario` (`usuario_id`),
  KEY `idx_solicitudes_estado` (`estado`),
  KEY `idx_solicitudes_prov` (`proveedor_id`),
  KEY `idx_solicitudes_empresa` (`empresa_id`),
  CONSTRAINT `fk_solicitud_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_solicitud_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_solicitudes_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `token_blacklist`
--

DROP TABLE IF EXISTS `token_blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `jti` varchar(36) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_jti` (`jti`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2150 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trabajo_referencias`
--

DROP TABLE IF EXISTS `trabajo_referencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trabajo_referencias` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `trabajo_id` int unsigned NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descriptores` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `peso` decimal(3,2) NOT NULL DEFAULT '0.80',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trabajos`
--

DROP TABLE IF EXISTS `trabajos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trabajos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1',
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `prompt_base` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Descripcion base en ingles que se agrega a todos los prompts de este trabajo',
  `variante` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_trabajos_nombre_empresa` (`empresa_id`,`nombre`),
  KEY `idx_trabajos_empresa` (`empresa_id`),
  CONSTRAINT `fk_trabajos_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL DEFAULT '1' COMMENT 'FK → empresas.id',
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cedula_ruc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('ADMIN','VENDEDOR','ALMACEN','CLIENTE') COLLATE utf8mb4_unicode_ci DEFAULT 'CLIENTE' COMMENT 'ADMIN/VENDEDOR/ALMACEN = sistema | CLIENTE = registro web',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_expires` bigint DEFAULT NULL,
  `last_activity` timestamp NULL DEFAULT NULL COMMENT 'Última actividad — expiración automática a los 7 días sin uso',
  `token_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'jti del access token activo — NULL invalida todos los tokens',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'Soft delete: NULL=activo, fecha=eliminado',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `uq_usuarios_cedula_ruc` (`cedula_ruc`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_activo` (`activo`),
  KEY `idx_usuarios_nombre_completo` (`nombre_completo`),
  KEY `idx_usuarios_deleted` (`deleted_at`),
  KEY `idx_usuarios_last_activity` (`last_activity`),
  KEY `idx_usuarios_empresa` (`empresa_id`),
  CONSTRAINT `fk_usuarios_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios_sesiones`
--

DROP TABLE IF EXISTS `usuarios_sesiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_sesiones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` timestamp NULL DEFAULT NULL COMMENT 'Último uso del refresh token — para expiración por sesión',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token_hash` (`token_hash`),
  KEY `idx_sesiones_usuario` (`usuario_id`),
  KEY `idx_sesiones_expires` (`expires_at`),
  CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2417 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'inventario_proformas'
--

--
-- Dumping routines for database 'inventario_proformas'
--
/*!50003 DROP PROCEDURE IF EXISTS `_add_column_if_not_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `_add_column_if_not_exists`(
    IN p_tabla VARCHAR(64),
    IN p_columna VARCHAR(64),
    IN p_definicion TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_tabla
          AND COLUMN_NAME = p_columna
    ) THEN
        SET @sql = CONCAT(
            'ALTER TABLE `', p_tabla,
            '` ADD COLUMN `', p_columna, '` ',
            p_definicion
        );

        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `_crear_indice` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `_crear_indice`(
  IN p_tabla      VARCHAR(64),
  IN p_indice     VARCHAR(64),
  IN p_columnas   TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.STATISTICS
    WHERE  TABLE_SCHEMA = DATABASE()
      AND  TABLE_NAME   = p_tabla
      AND  INDEX_NAME   = p_indice
  ) THEN
    SET @_sql = CONCAT(
        'CREATE INDEX `', p_indice,
        '` ON `', p_tabla, '` ',
        p_columnas
    );

    PREPARE _stmt FROM @_sql;
    EXECUTE _stmt;
    DEALLOCATE PREPARE _stmt;
  END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-28 10:53:05
