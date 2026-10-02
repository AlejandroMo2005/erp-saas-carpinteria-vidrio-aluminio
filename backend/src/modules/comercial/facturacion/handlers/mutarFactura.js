// src/modules/comercial/facturacion/handlers/mutarFactura.js
// Sprint 19 — empresa_id en verificaciones antes de mutar
// 📦 Sprint 20 — Migrado a src/modules/comercial/facturacion/handlers/
//                comprobanteService → ../facturacion.service
//                Facturacion        → ../facturacion.repository
//                utils/logger       → ../../../shared/utils/logger
//                pdfService         → lazy-load conservado (dentro de descargarPDF)

'use strict';

const comprobanteService = require('../facturacion.service');
const Facturacion        = require('../facturacion.repository');
const logger             = require('../../../shared/utils/logger');
const { successResponse, errorResponse } = require('./utils');

// ═══════════════════════════════════════════════════════
// PUT /api/facturas/:id
// ═══════════════════════════════════════════════════════
exports.actualizarFactura = async (req, res) => {
  try {
    const factura = await Facturacion.obtenerFacturaPorId(req.params.id, req.empresaId);
    if (!factura)
      return errorResponse(res, 'Factura no encontrada', 404);
    if (factura.estado === 'ANULADA')
      return errorResponse(res, 'No se puede actualizar una factura anulada', 400);

    // Sprint 19: empresa_id en el UPDATE
    await Facturacion.actualizarFactura(req.params.id, req.body, req.empresaId);
    const actualizada = await Facturacion.obtenerFacturaPorId(req.params.id, req.empresaId);
    return successResponse(res, actualizada, 'Factura actualizada exitosamente');
  } catch (error) {
    return errorResponse(res, 'Error al actualizar factura', 500, error);
  }
};

// ═══════════════════════════════════════════════════════
// PUT /api/facturas/:id/anular
// ═══════════════════════════════════════════════════════
exports.anularFactura = async (req, res) => {
  try {
    const { motivo } = req.body;
    const usuarioId  = req.user?.id;

    if (!motivo || motivo.trim().length < 10)
      return errorResponse(res, 'El motivo debe tener al menos 10 caracteres', 400);
    if (!usuarioId)
      return errorResponse(res, 'Usuario no autenticado', 401);

    const factura = await Facturacion.obtenerFacturaPorId(req.params.id, req.empresaId);
    if (!factura) return errorResponse(res, 'Factura no encontrada', 404);

    // comprobanteService.anularFactura ya maneja la lógica de negocio interna
    await comprobanteService.anularFactura(req.params.id, usuarioId, motivo);

    logger.info('FACTURA_ANULADA', {
      event: 'facturacion.anulada', facturaId: req.params.id,
      motivo: motivo.trim(), empresaId: req.empresaId, userId: usuarioId,
    });
    return successResponse(res, null, 'Factura anulada exitosamente');
  } catch (error) {
    return errorResponse(res, error.message || 'Error al anular factura', 500, error);
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/facturas/:id/pdf
// ═══════════════════════════════════════════════════════
exports.descargarPDF = async (req, res) => {
  // pdfService se mantiene como lazy-load (patrón del original)
  // TODO: mover a import estático cuando pdfService se migre a src/
    const { generarRIDE, obtenerDatosEmpresa } = require('../../../../shared/services/pdfService');  try {
    const factura = await comprobanteService.obtenerFacturaPorId(req.params.id, req.empresaId);
    if (!factura) return errorResponse(res, 'Factura no encontrada', 404);

    const empresa   = obtenerDatosEmpresa();
    const pdfBuffer = await generarRIDE(factura, empresa);
    const filename  = `RIDE_${factura.numero_factura.replace(/-/g, '_')}.pdf`;

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      pdfBuffer.length,
    });
    return res.send(pdfBuffer);
  } catch (error) {
    return errorResponse(res, 'Error al generar PDF', 500, error);
  }
};