// src/modules/comercial/proforma/handlers/agendarPedido.js
// Sprint 19 — empresa_id en todos los INSERTs
// 📦 Sprint 20 — Extraído de controllers/proformaController.js
//                Stock helpers movidos a ../proforma.service

'use strict';

const database = require('../../../../config/database.js');
const logger   = require('../../../../shared/utils/logger');
const {
  round2,
  isRecipeItems,
  safeDate,
  validarYRestarStock,
  calcularPorRecetas,
  buildWhatsAppText,
} = require('../proforma.service');

// ═══════════════════════════════════════════════════════
// POST /api/proformas/agendar
// ═══════════════════════════════════════════════════════
exports.agendarPedido = async (req, res) => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();

    const { items } = req.body;
    const usuario_id = req.user.id;
    const empresa_id = req.empresaId;
    const esCliente  = req.user?.rol === 'CLIENTE';

    if (!Array.isArray(items) || items.length === 0)
      throw new Error('Debe enviar al menos 1 item');

    // ── Modo recetas ────────────────────────────────────────────────────
    if (isRecipeItems(items)) {
      if (!calcularPorRecetas || !buildWhatsAppText)
        throw new Error('Modo recetas no disponible');

      const calc          = await calcularPorRecetas(connection, req.body, req.empresaId);
      const whatsapp_text = buildWhatsAppText(calc);

      if (!esCliente) await validarYRestarStock(connection, calc.materialesAgregados, calc.items, empresa_id);

      const [prof] = await connection.query(
        `INSERT INTO proformas
           (empresa_id, fecha, cliente, telefono, fecha_agendamiento, total, usuario_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [empresa_id, safeDate(calc.fecha), calc.cliente, calc.telefono || null,
         calc.fecha_agendamiento || null, calc.total, usuario_id]
      );
      const proforma_id = prof.insertId;

      // Guardar los ítems calculados dentro de la misma transacción.
      for (const it of calc.items) {
        await connection.query(
          `INSERT INTO proforma_items
             (proforma_id, trabajo_id, color_id, ancho, alto, cantidad, detalle, precio_unitario, subtotal, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [proforma_id, it.trabajo_id, it.color_id || null, it.ancho, it.alto,
           it.cantidad || 1, it.detalle || null,
           round2(it.precio_unitario ?? 0), round2(it.subtotal ?? 0)]
        );
      }

      for (const m of calc.materialesAgregados) {
        await connection.query(
          'INSERT INTO proforma_detalle (proforma_id, material_id, color_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)',
          [proforma_id, m.material_id, m.color_id || null, m.cantidad, m.precio_unitario]
        );
      }

      const [ped] = await connection.query(
        `INSERT INTO pedidos (empresa_id, fecha, estado, total, usuario_id, proforma_id, created_at, updated_at)
         VALUES (?, ?, 'PENDIENTE', ?, ?, ?, NOW(), NOW())`,
        [empresa_id, safeDate(calc.fecha_agendamiento || calc.fecha), calc.total, usuario_id, proforma_id]
      );
      const pedido_id = ped.insertId;

      for (const m of calc.materialesAgregados) {
        await connection.query(
          'INSERT INTO pedido_detalle (pedido_id, material_id, color_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)',
          [pedido_id, m.material_id, m.color_id || null, m.cantidad, m.precio_unitario]
        );
      }

      await connection.commit();
      logger.info('PROFORMA_AGENDADA', {
        event: 'proforma.agendada_recetas', proformaId: proforma_id, pedidoId: pedido_id,
        userId: usuario_id, empresaId: empresa_id, total: calc.total,
      });
      return res.status(201).json({
        success: true, message: 'Agendado correctamente',
        proforma_id, pedido_id,
        data: { ...calc, whatsapp_text },
      });
    }

    throw new Error('Items invalidos: cada item debe incluir trabajo_id');

  } catch (error) {
    await connection.rollback();
    logger.error('PROFORMA_AGENDAR_ERROR', {
      event: 'proforma.agendar_error', message: error.message, userId: req.user?.id,
    });
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
};