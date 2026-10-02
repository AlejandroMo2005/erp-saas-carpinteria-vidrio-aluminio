// src/modules/comercial/pedido/pedido.controller.js
// Sprint 10 — Filtrado por rol (CLIENTE solo ve sus pedidos)
// Sprint 11 — Logger Winston + soft delete
// Sprint 19 — empresa_id en todos los queries
// 📦 Sprint 20 — Migrado a src/modules/comercial/pedido/
//                models/Pedido      → ./pedido.repository
//                config/database    → ../../../../config/database
//                utils/logger       → ../../../../utils/logger
//                utils/softDelete   → ../../../../utils/softDelete

'use strict';

const database           = require('../../../config/database.js');
const Pedido             = require('./pedido.repository');
const logger             = require('../../../shared/utils/logger');
const { softDelete }     = require('../../shared/utils/softDelete');

// ── Utilidades ─────────────────────────────────────────────────────────────

function isValidId(id) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0;
}

function sanitizeHTML(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;')
    .replace(/\//g, '&#x2F;');
}

const ESTADOS_VALIDOS = ['PENDIENTE', 'PROCESADO', 'ENTREGADO', 'CANCELADO'];

const TRANSICIONES = {
  PENDIENTE: ['PROCESADO', 'ENTREGADO', 'CANCELADO'],
  PROCESADO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

// ═══════════════════════════════════════════════════════
// GET /api/pedidos
// ═══════════════════════════════════════════════════════
exports.getAllPedidos = async (req, res) => {
  try {
    const limit  = Math.min(Math.max(parseInt(req.query.limit)  || 50, 1), 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const { soloPropio, usuarioId } = req.filtroUsuario || {};

    let whereClause, params;
    if (soloPropio) {
      whereClause = 'WHERE p.empresa_id = ? AND p.usuario_id = ? AND p.deleted_at IS NULL';
      params      = [req.empresaId, usuarioId, limit, offset];
    } else {
      whereClause = 'WHERE p.empresa_id = ? AND p.deleted_at IS NULL';
      params      = [req.empresaId, limit, offset];
    }

    const [rows] = await database.query(`
      SELECT
        p.id, p.fecha, p.estado, p.total, p.proforma_id, p.usuario_id,
        pr.cliente AS cliente,
        GROUP_CONCAT(
          DISTINCT t.nombre ORDER BY t.id SEPARATOR ', '
        ) AS trabajos_nombres
      FROM pedidos p
      LEFT JOIN proformas pr       ON pr.id = p.proforma_id
      LEFT JOIN proforma_items pi  ON pi.proforma_id = pr.id
      LEFT JOIN trabajos t         ON t.id = pi.trabajo_id
      ${whereClause}
      GROUP BY p.id, p.fecha, p.estado, p.total, p.proforma_id, p.usuario_id, pr.cliente
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `, params);

    res.status(200).json(
      rows.map(p => ({
        ...p,
        cliente:          sanitizeHTML(p.cliente),
        trabajos_nombres: sanitizeHTML(p.trabajos_nombres),
      }))
    );
  } catch (error) {
    logger.error('PEDIDO_GET_ALL', {
      event: 'pedido.getAll_error', message: error.message, userId: req.user?.id,
    });
    res.status(500).json([]);
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/pedidos/estado/:estado
// ═══════════════════════════════════════════════════════
exports.getPedidosByEstado = async (req, res) => {
  try {
    const estado = req.params.estado?.toUpperCase();
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Use: PENDIENTE, PROCESADO, ENTREGADO o CANCELADO',
      });
    }

    const [rows] = await database.query(`
      SELECT
        p.id, p.fecha, p.estado, p.total, p.proforma_id,
        pr.cliente AS cliente,
        GROUP_CONCAT(DISTINCT t.nombre ORDER BY t.id SEPARATOR ', ') AS trabajos_nombres
      FROM pedidos p
      LEFT JOIN proformas pr       ON pr.id = p.proforma_id
      LEFT JOIN proforma_items pi  ON pi.proforma_id = pr.id
      LEFT JOIN trabajos t         ON t.id = pi.trabajo_id
      WHERE p.empresa_id = ? AND p.estado = ? AND p.deleted_at IS NULL
      GROUP BY p.id, p.fecha, p.estado, p.total, p.proforma_id, pr.cliente
      ORDER BY p.id DESC
    `, [req.empresaId, estado]);

    res.status(200).json(
      rows.map(p => ({
        ...p,
        cliente:          sanitizeHTML(p.cliente),
        trabajos_nombres: sanitizeHTML(p.trabajos_nombres),
      }))
    );
  } catch (error) {
    logger.error('PEDIDO_GET_BY_ESTADO', {
      event: 'pedido.getByEstado_error', estado: req.params.estado, message: error.message,
    });
    res.status(500).json([]);
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/pedidos/:id
// ═══════════════════════════════════════════════════════
exports.getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id))
      return res.status(400).json({ success: false, message: 'ID inválido' });

    const { soloPropio, usuarioId } = req.filtroUsuario || {};
    let whereExtra, params;
    if (soloPropio) {
      whereExtra = 'AND p.empresa_id = ? AND p.usuario_id = ? AND p.deleted_at IS NULL';
      params     = [id, req.empresaId, usuarioId];
    } else {
      whereExtra = 'AND p.empresa_id = ? AND p.deleted_at IS NULL';
      params     = [id, req.empresaId];
    }

    const [pedidoRows] = await database.query(`
      SELECT
        p.id, p.fecha, p.estado, p.total, p.proforma_id, p.usuario_id,
        pr.cliente, pr.telefono,
        GROUP_CONCAT(DISTINCT t.nombre ORDER BY t.id SEPARATOR ', ') AS trabajos_nombres
      FROM pedidos p
      LEFT JOIN proformas pr       ON pr.id = p.proforma_id
      LEFT JOIN proforma_items pi  ON pi.proforma_id = pr.id
      LEFT JOIN trabajos t         ON t.id = pi.trabajo_id
      WHERE p.id = ? ${whereExtra}
      GROUP BY p.id, p.fecha, p.estado, p.total, p.proforma_id, p.usuario_id, pr.cliente, pr.telefono
    `, params);

    if (!pedidoRows?.length)
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    const pedido = pedidoRows[0];
    let items = [];

    if (pedido.proforma_id) {
      const [itemsRows] = await database.query(`
        SELECT
          pi.id, pi.ancho, pi.alto, pi.cantidad, pi.detalle,
          t.id AS trabajo_id, t.nombre AS trabajo_nombre,
          c.id AS color_id, c.nombre AS color_nombre, c.valor AS color_hex
        FROM proforma_items pi
        LEFT JOIN trabajos t ON t.id = pi.trabajo_id
        LEFT JOIN colores  c ON c.id = pi.color_id
        WHERE pi.proforma_id = ?
        ORDER BY pi.id
      `, [pedido.proforma_id]);

      items = itemsRows.map(item => ({
        ...item,
        detalle:        sanitizeHTML(item.detalle),
        trabajo_nombre: sanitizeHTML(item.trabajo_nombre),
        color_nombre:   sanitizeHTML(item.color_nombre),
      }));
    }

    res.status(200).json({
      ...pedido,
      cliente:          sanitizeHTML(pedido.cliente),
      trabajos_nombres: sanitizeHTML(pedido.trabajos_nombres),
      items,
    });
  } catch (error) {
    logger.error('PEDIDO_GET_BY_ID', {
      event: 'pedido.getById_error', pedidoId: req.params.id,
      message: error.message, userId: req.user?.id,
    });
    res.status(500).json({ success: false, message: 'Error al obtener pedido' });
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/pedidos
// ═══════════════════════════════════════════════════════
exports.createPedido = async (req, res) => {
  try {
    const { fecha, estado, total, proforma_id, observaciones, detalles } = req.body;

    if (!total || total <= 0)
      return res.status(400).json({ success: false, message: 'Total inválido' });

    const pedido = await Pedido.create({
      empresa_id:    req.empresaId,
      fecha:         fecha         || new Date(),
      estado:        estado        || 'PENDIENTE',
      total,
      proforma_id:   proforma_id   || null,
      observaciones: observaciones || null,
      detalles:      detalles      || [],
      usuario_id:    req.user.id,
    });

    logger.info('PEDIDO_CREATED', {
      event: 'pedido.created', pedidoId: pedido?.id,
      userId: req.user.id, empresaId: req.empresaId, total,
    });

    res.status(201).json({ success: true, message: 'Pedido creado correctamente', data: pedido });
  } catch (error) {
    logger.error('PEDIDO_CREATE_ERROR', {
      event: 'pedido.create_error', message: error.message, userId: req.user?.id,
    });
    res.status(500).json({ success: false, message: 'Error al crear pedido' });
  }
};

// ═══════════════════════════════════════════════════════
// PUT /api/pedidos/:id/estado
// ═══════════════════════════════════════════════════════
exports.updateEstado = async (req, res) => {
  try {
    const { id }      = req.params;
    const nuevoEstado = req.body.estado?.toUpperCase();

    if (!isValidId(id))
      return res.status(400).json({ success: false, message: 'ID inválido' });
    if (!ESTADOS_VALIDOS.includes(nuevoEstado))
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Use: PENDIENTE, PROCESADO, ENTREGADO o CANCELADO',
      });

    const [pedidoActual] = await database.query(
      'SELECT estado FROM pedidos WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL',
      [id, req.empresaId]
    );
    if (!pedidoActual?.length)
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    const estadoActual   = pedidoActual[0].estado;
    const transicionesOk = TRANSICIONES[estadoActual] ?? [];

    if (!transicionesOk.includes(nuevoEstado)) {
      return res.status(409).json({
        success: false,
        message: `No se puede cambiar de ${estadoActual} a ${nuevoEstado}.`,
      });
    }

    if (nuevoEstado === 'CANCELADO') {
      const cancelado = await Pedido.cancelar(Number(id), req.empresaId);
      if (!cancelado)
        return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
      logger.info('PEDIDO_CANCELADO', { event: 'pedido.cancelled', pedidoId: id, userId: req.user?.id });
      return res.status(200).json({
        success: true, message: 'Pedido cancelado y stock restaurado correctamente',
        estado_anterior: estadoActual, estado_nuevo: 'CANCELADO',
      });
    }

    const [result] = await database.query(
      'UPDATE pedidos SET estado = ?, updated_at = NOW() WHERE id = ? AND empresa_id = ?',
      [nuevoEstado, id, req.empresaId]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    logger.info('PEDIDO_ESTADO_UPDATE', {
      event: 'pedido.estado_updated', pedidoId: id,
      estadoAnterior: estadoActual, estadoNuevo: nuevoEstado, userId: req.user?.id,
    });

    res.status(200).json({
      success: true, message: 'Estado actualizado correctamente',
      estado_anterior: estadoActual, estado_nuevo: nuevoEstado,
    });
  } catch (error) {
    logger.error('PEDIDO_UPDATE_ESTADO_ERROR', {
      event: 'pedido.updateEstado_error', pedidoId: req.params.id,
      message: error.message, userId: req.user?.id,
    });
    res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
};

// ═══════════════════════════════════════════════════════
// DELETE /api/pedidos/:id — solo ADMIN
// Sprint 11: soft delete. Sprint 19: + empresa_id
// ═══════════════════════════════════════════════════════
exports.deletePedido = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id))
    return res.status(400).json({ success: false, message: 'ID de pedido inválido' });

  try {
    const [check] = await database.query(
      'SELECT id FROM pedidos WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL',
      [id, req.empresaId]
    );
    if (!check.length)
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    await softDelete(database, 'pedidos', id);

    logger.info('PEDIDO_SOFT_DELETE', { event: 'pedido.deleted', pedidoId: id, userId: req.user?.id });
    return res.status(200).json({ success: true, message: 'Pedido eliminado correctamente' });
  } catch (error) {
    logger.error('PEDIDO_DELETE_ERROR', {
      event: 'pedido.delete_error', pedidoId: id, message: error.message, userId: req.user?.id,
    });
    return res.status(500).json({ success: false, message: 'Error al eliminar pedido' });
  }
};