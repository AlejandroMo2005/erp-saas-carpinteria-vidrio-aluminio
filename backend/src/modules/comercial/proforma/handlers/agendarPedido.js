// src/modules/comercial/proforma/handlers/agendarPedido.js
// Sprint 13 — Fix INSERT proforma_items: precio_unitario y subtotal
// Sprint 19 — empresa_id en todos los INSERTs
// 📦 Sprint 20 — Extraído de controllers/proformaController.js
//                Stock helpers movidos a ../proforma.service

'use strict';

const database = require('../../../../../config/database');
const logger   = require('../../../../../utils/logger');
const {
  round2,
  isLegacyItems,
  isRecipeItems,
  safeDate,
  validarYRestarStock,
  validarYRestarStockLegacy,
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

    const { cliente, fecha, total, items, telefono, fecha_agendamiento } = req.body;
    const usuario_id = req.user.id;
    const empresa_id = req.empresaId;
    const esCliente  = req.user?.rol === 'CLIENTE';

    if (!Array.isArray(items) || items.length === 0)
      throw new Error('Debe enviar al menos 1 item');

    // ── Modo recetas ────────────────────────────────────────────────────
    if (isRecipeItems(items)) {
      if (!calcularPorRecetas || !buildWhatsAppText)
        throw new Error('Modo recetas no disponible');

      const calc          = await calcularPorRecetas(connection, req.body);
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

      // Fix Sprint 13: guardar precio_unitario y subtotal por ítem
      try {
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
      } catch (e) {
        logger.warn('PROFORMA_ITEMS_INSERT_WARN', {
          event: 'proforma.items_insert_warning', message: e.message,
        });
      }

      for (const m of calc.materialesAgregados) {
        await connection.query(
          'INSERT INTO proforma_detalle (proforma_id, material_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [proforma_id, m.material_id, m.cantidad, m.precio_unitario]
        );
      }

      // Crear pedido — intenta con proforma_id, fallback sin él
      let pedido_id = null;
      try {
        const [ped] = await connection.query(
          `INSERT INTO pedidos (empresa_id, fecha, estado, total, usuario_id, proforma_id, created_at, updated_at)
           VALUES (?, ?, 'PENDIENTE', ?, ?, ?, NOW(), NOW())`,
          [empresa_id, safeDate(calc.fecha_agendamiento || calc.fecha), calc.total, usuario_id, proforma_id]
        );
        pedido_id = ped.insertId;
      } catch {
        const [ped] = await connection.query(
          `INSERT INTO pedidos (empresa_id, fecha, estado, total, usuario_id, created_at, updated_at)
           VALUES (?, ?, 'PENDIENTE', ?, ?, NOW(), NOW())`,
          [empresa_id, safeDate(calc.fecha_agendamiento || calc.fecha), calc.total, usuario_id]
        );
        pedido_id = ped.insertId;
      }

      for (const m of calc.materialesAgregados) {
        await connection.query(
          'INSERT INTO pedido_detalle (pedido_id, material_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [pedido_id, m.material_id, m.cantidad, m.precio_unitario]
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

    // ── Modo legacy ─────────────────────────────────────────────────────
    if (isLegacyItems(items)) {
      const safeCliente = (cliente || '').trim();
      if (!safeCliente) throw new Error('Cliente es requerido');
      const safeFecha = safeDate(fecha);
      const safeTotal = Number(total) || 0;

      if (!esCliente) await validarYRestarStockLegacy(connection, items, empresa_id);

      const [prof] = await connection.query(
        `INSERT INTO proformas
           (empresa_id, fecha, cliente, telefono, fecha_agendamiento, total, usuario_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [empresa_id, safeFecha, safeCliente,
         telefono ? String(telefono).trim() : null,
         fecha_agendamiento ? String(fecha_agendamiento).slice(0, 10) : null,
         safeTotal, usuario_id]
      );
      const proforma_id = prof.insertId;

      let pedido_id = null;
      try {
        const [ped] = await connection.query(
          `INSERT INTO pedidos (empresa_id, fecha, estado, total, usuario_id, proforma_id, created_at, updated_at)
           VALUES (?, ?, 'PENDIENTE', ?, ?, ?, NOW(), NOW())`,
          [empresa_id, safeFecha, safeTotal, usuario_id, proforma_id]
        );
        pedido_id = ped.insertId;
      } catch {
        const [ped] = await connection.query(
          `INSERT INTO pedidos (empresa_id, fecha, estado, total, usuario_id, created_at, updated_at)
           VALUES (?, ?, 'PENDIENTE', ?, ?, NOW(), NOW())`,
          [empresa_id, safeFecha, safeTotal, usuario_id]
        );
        pedido_id = ped.insertId;
      }

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.material_id) throw new Error(`Falta material_id en item #${i + 1}`);
        const cantidad = Number(it.cantidad);
        const precio   = Number(it.precio_unitario);
        if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error(`Cantidad invalida en item #${i + 1}`);
        if (!Number.isFinite(precio)   || precio   < 0)  throw new Error(`Precio invalido en item #${i + 1}`);

        await connection.query(
          'INSERT INTO proforma_detalle (proforma_id, material_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [proforma_id, it.material_id, cantidad, precio]
        );
        await connection.query(
          'INSERT INTO pedido_detalle (pedido_id, material_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [pedido_id, it.material_id, cantidad, precio]
        );
      }

      await connection.commit();
      logger.info('PROFORMA_AGENDADA_LEGACY', {
        event: 'proforma.agendada_legacy', proformaId: proforma_id, pedidoId: pedido_id,
        userId: usuario_id, empresaId: empresa_id, total: safeTotal,
      });
      return res.status(201).json({
        success: true, message: 'Agendado en modo legacy correctamente',
        proforma_id, pedido_id,
      });
    }

    throw new Error('Items invalidos: debe ser modo recetas (trabajo_id) o modo legacy (material_id)');

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