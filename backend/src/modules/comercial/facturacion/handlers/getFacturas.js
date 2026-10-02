// src/modules/comercial/facturacion/handlers/getFacturas.js
// Sprint 13 — getPedidosParaFacturar
// Sprint 19 — empresa_id en todos los SELECT
// 📦 Sprint 20 — Migrado a src/modules/comercial/facturacion/handlers/
//                Facturacion        → ../facturacion.repository
//                comprobanteService → ../facturacion.service
//                config/database    → ../../../config/database
//                utils/logger       → ../../../shared/utils/logger

'use strict';

const Facturacion        = require('../facturacion.repository');
const comprobanteService = require('../facturacion.service');
const database           = require('../../../../config/database.js');
const logger             = require('../../../shared/utils/logger');
const { successResponse, errorResponse } = require('./utils');

// ═══════════════════════════════════════════════════════
// GET /api/facturas
// ═══════════════════════════════════════════════════════
exports.listarFacturas = async (req, res) => {
  try {
    const {
      fechaDesde, fechaHasta, estado, estadoSRI,
      clienteNombre, numeroFactura, pagina = 1, limite = 20,
    } = req.query;

    const filtros = {
      fechaDesde, fechaHasta, estado, estadoSRI,
      clienteNombre, numeroFactura,
      empresaId: req.empresaId,               // Sprint 19
    };
    const paginacion = {
      limite: parseInt(limite),
      offset: (parseInt(pagina) - 1) * parseInt(limite),
    };

    const [facturas]    = await Facturacion.obtenerFacturas(filtros, paginacion);
    const [totalResult] = await Facturacion.contarFacturas(filtros);
    const total         = totalResult[0].total;

    return successResponse(res, {
      facturas,
      paginacion: {
        pagina:       parseInt(pagina),
        limite:       parseInt(limite),
        total,
        totalPaginas: Math.ceil(total / parseInt(limite)),
      },
    });
  } catch (error) {
    return errorResponse(res, 'Error al listar facturas', 500, error);
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/facturas/:id
// ═══════════════════════════════════════════════════════
exports.obtenerFactura = async (req, res) => {
  try {
    const factura = await comprobanteService.obtenerFacturaPorId(req.params.id, req.empresaId);
    if (!factura) return errorResponse(res, 'Factura no encontrada', 404);
    return successResponse(res, factura);
  } catch (error) {
    return errorResponse(res, 'Error al obtener factura', 500, error);
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/facturas/siguiente-numero
// ═══════════════════════════════════════════════════════
exports.obtenerSiguienteNumero = async (req, res) => {
  try {
    const { establecimiento = '001', puntoEmision = '001' } = req.query;
    const siguiente = await comprobanteService.obtenerSiguienteSecuencia(
      'FACTURA', establecimiento, puntoEmision, req.empresaId
    );
    return successResponse(res, {
      numeroFormateado: siguiente.numeroFormateado,
      secuencia:        siguiente.secuencia,
      mensaje:          'Este número se asignará al crear la factura',
    });
  } catch (error) {
    return errorResponse(res, 'Error al obtener siguiente número', 500, error);
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/facturas/validar-pedido/:pedidoId
// ═══════════════════════════════════════════════════════
exports.validarPedidoFacturable = async (req, res) => {
  try {
    const [facturas] = await Facturacion.obtenerFacturas(
      { pedidoId: req.params.pedidoId, empresaId: req.empresaId },
      { limite: 1, offset: 0 }
    );
    if (facturas.length > 0) {
      return successResponse(res, {
        facturable:       false,
        razon:            'El pedido ya tiene una factura asociada',
        facturaExistente: facturas[0].numero_factura,
      });
    }
    return successResponse(res, { facturable: true, mensaje: 'El pedido puede ser facturado' });
  } catch (error) {
    return errorResponse(res, 'Error al validar pedido', 500, error);
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/facturas/pedidos-cliente/:clienteId
// Sprint 13 — pedidos ENTREGADO del cliente sin factura vigente
// ═══════════════════════════════════════════════════════
exports.getPedidosParaFacturar = async (req, res) => {
  try {
    const id = parseInt(req.params.clienteId, 10);
    if (!Number.isInteger(id) || id <= 0)
      return errorResponse(res, 'ID de cliente inválido', 400);

    const [rows] = await database.query(`
      SELECT
        p.id, p.fecha, p.estado, p.total, p.proforma_id,
        pr.cliente AS cliente_nombre,
        GROUP_CONCAT(DISTINCT t.nombre ORDER BY t.id SEPARATOR ', ') AS trabajos_nombres
      FROM  pedidos p
      LEFT JOIN proformas pr       ON pr.id         = p.proforma_id
      LEFT JOIN proforma_items pi  ON pi.proforma_id = pr.id
      LEFT JOIN trabajos t         ON t.id           = pi.trabajo_id
      LEFT JOIN facturas f         ON f.pedido_id    = p.id AND f.estado <> 'ANULADA'
      WHERE p.empresa_id  = ?
        AND p.usuario_id  = ?
        AND p.estado      = 'ENTREGADO'
        AND p.deleted_at IS NULL
        AND f.id         IS NULL
      GROUP BY p.id, p.fecha, p.estado, p.total, p.proforma_id, pr.cliente
      ORDER BY p.id DESC
    `, [req.empresaId, id]);

    logger.info('PEDIDOS_PARA_FACTURAR', {
      event: 'facturacion.pedidos_cliente', clienteId: id,
      cantidad: rows.length, userId: req.user?.id,
    });
    return successResponse(res, rows, 'Pedidos facturables obtenidos');
  } catch (error) {
    return errorResponse(res, 'Error al obtener pedidos del cliente', 500, error);
  }
};