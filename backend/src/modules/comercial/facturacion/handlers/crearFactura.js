// src/modules/comercial/facturacion/handlers/crearFactura.js
// Sprint 19 — empresa_id en INSERT y verificaciones
// 📦 Sprint 20 — Migrado a src/modules/comercial/facturacion/handlers/
//                comprobanteService → ../facturacion.service
//                Facturacion        → ../facturacion.repository
//                Configuracion      → ../../../configuracion/configuracion.repository  (pendiente migrar)
//                validacionService  → ../../../../../services/validacionService
//                utils/logger       → ../../../shared/utils/logger

'use strict';

const comprobanteService        = require('../facturacion.service');
const Facturacion               = require('../facturacion.repository');
const Configuracion             = require('../../../configuracion/configuracion.repository');
const { validarIdentificacion } = require('../../../../shared/services/validacionService');
const logger                    = require('../../../shared/utils/logger');
const { successResponse, errorResponse } = require('./utils');

// ═══════════════════════════════════════════════════════
// POST /api/facturas/desde-pedido
// ═══════════════════════════════════════════════════════
exports.crearFacturaDesdePedido = async (req, res) => {
  try {
    const { pedidoId, datosAdicionales = {} } = req.body;
    const usuarioId = req.user?.id;
    const empresaId = req.empresaId;

    if (!pedidoId)  return errorResponse(res, 'El pedidoId es requerido', 400);
    if (!usuarioId) return errorResponse(res, 'Usuario no autenticado', 401);

    const factura = await comprobanteService.crearFacturaDesdePedido(
      pedidoId, usuarioId, datosAdicionales, empresaId
    );

    logger.info('FACTURA_CREADA_DESDE_PEDIDO', {
      event: 'facturacion.creada_desde_pedido', pedidoId, empresaId, userId: usuarioId,
    });
    return successResponse(res, factura, 'Factura creada exitosamente', 201);
  } catch (error) {
    return errorResponse(res, error.message || 'Error al crear factura', 500, error);
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/facturas
// ═══════════════════════════════════════════════════════
exports.crearFacturaManual = async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const empresaId = req.empresaId;
    if (!usuarioId) return errorResponse(res, 'Usuario no autenticado', 401);

    const {
      cliente_id, cliente_nombre, cliente_identificacion,
      cliente_tipo_identificacion = 'CONSUMIDOR_FINAL',
      cliente_direccion, cliente_telefono, cliente_email,
      pedido_id = null, items, observaciones,
    } = req.body;

    if (!cliente_nombre?.trim())
      return errorResponse(res, 'El nombre del cliente es requerido', 400);
    if (!items || !Array.isArray(items) || items.length === 0)
      return errorResponse(res, 'Debe incluir al menos un item', 400);

    if (cliente_tipo_identificacion !== 'CONSUMIDOR_FINAL' && cliente_identificacion?.trim()) {
      const check = validarIdentificacion(cliente_identificacion.trim(), cliente_tipo_identificacion);
      if (!check.valida) return errorResponse(res, check.mensaje, 400);
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.descripcion?.trim())
        return errorResponse(res, `Item ${i + 1}: la descripción es requerida`, 400);
      if (!it.cantidad || parseFloat(it.cantidad) <= 0)
        return errorResponse(res, `Item ${i + 1}: la cantidad debe ser mayor a 0`, 400);
      if (parseFloat(it.precio_unitario ?? 0) < 0)
        return errorResponse(res, `Item ${i + 1}: el precio no puede ser negativo`, 400);
    }

    const tasaIva = await Configuracion.obtenerTasaIva(empresaId);
    let subtotal_sin_iva = 0, subtotal_con_iva = 0, iva_total = 0;

    const itemsCalculados = items.map(item => {
      const cantidad             = parseFloat(item.cantidad);
      const precio_unitario      = parseFloat(item.precio_unitario ?? 0);
      const descuento            = parseFloat(item.descuento       ?? 0);
      const porcentaje_iva       = parseFloat(item.porcentaje_iva  ?? (tasaIva * 100));
      const precio_total_sin_iva = parseFloat(Math.max(0, cantidad * precio_unitario - descuento).toFixed(2));
      const valor_iva            = parseFloat((precio_total_sin_iva * (porcentaje_iva / 100)).toFixed(2));

      if (porcentaje_iva === 0) subtotal_sin_iva += precio_total_sin_iva;
      else                      subtotal_con_iva += precio_total_sin_iva;
      iva_total += valor_iva;

      return {
        material_id:          item.material_id ?? null,
        descripcion:          item.descripcion.trim(),
        cantidad, precio_unitario, descuento,
        precio_total_sin_iva, porcentaje_iva, valor_iva,
        detalles_adicionales: item.detalles_adicionales ?? null,
      };
    });

    const total     = parseFloat((subtotal_sin_iva + subtotal_con_iva + iva_total).toFixed(2));
    const secuencia = await comprobanteService.obtenerSiguienteSecuencia('FACTURA', '001', '001', empresaId);

    const facturaId = await Facturacion.crearFacturaConDetalle({
      empresa_id: empresaId,
      numero_factura: secuencia.numeroFormateado,
      clave_acceso:   secuencia.claveAcceso ?? null,
      pedido_id, cliente_id: cliente_id ?? null, usuario_id: usuarioId,
      cliente_nombre: cliente_nombre.trim(),
      cliente_identificacion:      cliente_identificacion?.trim()  ?? null,
      cliente_tipo_identificacion,
      cliente_direccion:           cliente_direccion?.trim()        ?? null,
      cliente_telefono:            cliente_telefono?.trim()         ?? null,
      cliente_email:               cliente_email?.trim()            ?? null,
      fecha_emision: new Date().toISOString().split('T')[0],
      subtotal_sin_iva: parseFloat(subtotal_sin_iva.toFixed(2)),
      subtotal_con_iva: parseFloat(subtotal_con_iva.toFixed(2)),
      iva:              parseFloat(iva_total.toFixed(2)),
      descuento: 0, propina: 0, total,
      estado: 'EMITIDA', estado_sri: 'SIN_ENVIAR',
      observaciones: observaciones?.trim() ?? null,
    }, itemsCalculados);

    const facturaCreada = await Facturacion.obtenerFacturaPorId(facturaId, empresaId);

    logger.info('FACTURA_MANUAL_CREADA', {
      event: 'facturacion.manual_creada', facturaId,
      numeroFactura: secuencia.numeroFormateado,
      clienteNombre: cliente_nombre, empresaId, total, userId: usuarioId,
    });
    return successResponse(res, facturaCreada, 'Factura creada exitosamente', 201);
  } catch (error) {
    return errorResponse(res, error.message || 'Error al crear factura', 500, error);
  }
};