// backend/controllers/proformaController.js
// Sprint 10 — Filtrado por rol
// Sprint 11 — Logger Winston + soft delete
// Sprint 13 — Fix INSERT proforma_items: precio_unitario y subtotal
// Sprint 19 — Multi-empresa: empresa_id en todos los queries

'use strict';

const database = require('../config/database');
const logger   = require('../utils/logger');

let calcularPorRecetas = null;
let buildWhatsAppText  = null;
try {
  ({ calcularPorRecetas, buildWhatsAppText } = require('../services/proformaCalculator'));
} catch {
  logger.warn('PROFORMA_CALCULATOR_MISSING', {
    event:   'proforma.calculator_not_found',
    message: 'No se encontró services/proformaCalculator',
  });
}

// ── Utilidades ─────────────────────────────────────────────────────────────
const round2          = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const isLegacyItems   = (items) => Array.isArray(items) && items.length > 0 && items[0].material_id != null;
const isRecipeItems   = (items) => Array.isArray(items) && items.length > 0 && items[0].trabajo_id  != null;
const safeDate        = (d) => d && String(d).trim() ? String(d).slice(0, 10) : new Date().toISOString().slice(0, 10);

// ── Stock helpers ──────────────────────────────────────────────────────────

async function validarYRestarStock(connection, materialesAgregados, items, empresaId) {
  const color_id = items[0]?.color_id || null;
  for (const m of materialesAgregados) {
    const { material_id, cantidad } = m;
    if (!Number.isFinite(cantidad) || cantidad <= 0)
      throw new Error(`Cantidad invalida para material #${material_id}`);

    let stockRestado = false;
    if (color_id) {
      const [variante] = await connection.query(
        'SELECT id, stock FROM materiales_variantes WHERE material_id = ? AND color_id = ? LIMIT 1',
        [material_id, color_id]
      );
      if (variante.length > 0) {
        const stockActual = Number(variante[0].stock);
        if (stockActual < cantidad) {
          const [mat] = await connection.query('SELECT nombre FROM materiales WHERE id = ?', [material_id]);
          const [col] = await connection.query('SELECT nombre FROM colores   WHERE id = ?', [color_id]);
          throw new Error(`Stock insuficiente: ${mat[0]?.nombre} (${col[0]?.nombre}). Disponible: ${stockActual}, Requerido: ${cantidad}`);
        }
        await connection.query(
          'UPDATE materiales_variantes SET stock = stock - ? WHERE material_id = ? AND color_id = ?',
          [cantidad, material_id, color_id]
        );
        stockRestado = true;
      }
    }
    if (!stockRestado) {
      const [mat] = await connection.query(
        'SELECT nombre, stock FROM materiales WHERE id = ? AND empresa_id = ? LIMIT 1',
        [material_id, empresaId]
      );
      if (!mat.length) throw new Error(`Material no encontrado: ID ${material_id}`);
      const stockActual = Number(mat[0].stock);
      if (stockActual < cantidad)
        throw new Error(`Stock insuficiente: ${mat[0].nombre}. Disponible: ${stockActual}, Requerido: ${cantidad}`);
      await connection.query(
        'UPDATE materiales SET stock = stock - ? WHERE id = ? AND empresa_id = ?',
        [cantidad, material_id, empresaId]
      );
    }
  }
}

async function validarYRestarStockLegacy(connection, items, empresaId) {
  for (let i = 0; i < items.length; i++) {
    const { material_id, cantidad, color_id } = items[i];
    if (!Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0)
      throw new Error(`Cantidad invalida en item #${i + 1}`);

    let stockRestado = false;
    if (color_id) {
      const [variante] = await connection.query(
        'SELECT id, stock FROM materiales_variantes WHERE material_id = ? AND color_id = ? LIMIT 1',
        [material_id, color_id]
      );
      if (variante.length > 0) {
        const stockActual = Number(variante[0].stock);
        if (stockActual < Number(cantidad)) {
          const [mat] = await connection.query('SELECT nombre FROM materiales WHERE id = ?', [material_id]);
          const [col] = await connection.query('SELECT nombre FROM colores   WHERE id = ?', [color_id]);
          throw new Error(`Stock insuficiente: ${mat[0]?.nombre} (${col[0]?.nombre}). Disponible: ${stockActual}, Requerido: ${cantidad}`);
        }
        await connection.query(
          'UPDATE materiales_variantes SET stock = stock - ? WHERE material_id = ? AND color_id = ?',
          [Number(cantidad), material_id, color_id]
        );
        stockRestado = true;
      }
    }
    if (!stockRestado) {
      const [mat] = await connection.query(
        'SELECT nombre, stock FROM materiales WHERE id = ? AND empresa_id = ? LIMIT 1',
        [material_id, empresaId]
      );
      if (!mat.length) throw new Error(`Material no encontrado: ID ${material_id}`);
      const stockActual = Number(mat[0].stock);
      if (stockActual < Number(cantidad))
        throw new Error(`Stock insuficiente: ${mat[0].nombre}. Disponible: ${stockActual}, Requerido: ${cantidad}`);
      await connection.query(
        'UPDATE materiales SET stock = stock - ? WHERE id = ? AND empresa_id = ?',
        [Number(cantidad), material_id, empresaId]
      );
    }
  }
}

// ═══════════════════════════════════════════════════════
// GET /api/proformas
// ═══════════════════════════════════════════════════════
exports.getAllProformas = async (req, res) => {
  try {
    const { soloPropio, usuarioId } = req.filtroUsuario || {};
    let rows;
    if (soloPropio) {
      [rows] = await database.query(
        'SELECT * FROM proformas WHERE empresa_id = ? AND usuario_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
        [req.empresaId, usuarioId]
      );
    } else {
      [rows] = await database.query(
        'SELECT * FROM proformas WHERE empresa_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
        [req.empresaId]
      );
    }
    res.json(rows);
  } catch (error) {
    logger.error('PROFORMA_GET_ALL', { event: 'proforma.getAll_error', message: error.message, userId: req.user?.id });
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/proformas/search
// ═══════════════════════════════════════════════════════
exports.searchByCliente = async (req, res) => {
  try {
    const [rows] = await database.query(
      'SELECT * FROM proformas WHERE empresa_id = ? AND cliente LIKE ? AND deleted_at IS NULL',
      [req.empresaId, `%${req.query.cliente || ''}%`]
    );
    res.json(rows);
  } catch (error) {
    logger.error('PROFORMA_SEARCH', { event: 'proforma.search_error', message: error.message, userId: req.user?.id });
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/proformas/:id
// ═══════════════════════════════════════════════════════
exports.getProformaById = async (req, res) => {
  try {
    const { soloPropio, usuarioId } = req.filtroUsuario || {};
    let rows;
    if (soloPropio) {
      [rows] = await database.query(
        'SELECT * FROM proformas WHERE id = ? AND empresa_id = ? AND usuario_id = ? AND deleted_at IS NULL',
        [req.params.id, req.empresaId, usuarioId]
      );
    } else {
      [rows] = await database.query(
        'SELECT * FROM proformas WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL',
        [req.params.id, req.empresaId]
      );
    }
    if (!rows?.length) return res.status(404).json({ success: false, message: 'Proforma no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    logger.error('PROFORMA_GET_BY_ID', { event: 'proforma.getById_error', proformaId: req.params.id, message: error.message, userId: req.user?.id });
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/proformas/calcular
// ═══════════════════════════════════════════════════════
exports.calcularProforma = async (req, res) => {
  const connection = await database.getConnection();
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: 'Debe enviar al menos 1 item para calcular' });

    if (isRecipeItems(items)) {
      if (!calcularPorRecetas || !buildWhatsAppText)
        return res.status(400).json({ success: false, message: 'Modo recetas no disponible: falta services/proformaCalculator.js' });
      const calc          = await calcularPorRecetas(connection, req.body);
      const whatsapp_text = buildWhatsAppText(calc);
      return res.status(200).json({ success: true, data: { ...calc, whatsapp_text } });
    }

    if (isLegacyItems(items)) {
      const cliente   = (req.body.cliente || '').trim() || 'SIN NOMBRE';
      const [ivaRows] = await connection.query(
        "SELECT valor FROM configuracion WHERE empresa_id = ? AND clave = 'IVA' LIMIT 1",
        [req.empresaId]
      );
      const iva_valor = ivaRows?.[0]?.valor != null ? Number(ivaRows[0].valor) : 0.15;
      let subtotal = 0;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.material_id) return res.status(400).json({ success: false, message: `Falta material_id en item #${i + 1}` });
        const cantidad = Number(it.cantidad);
        if (!Number.isFinite(cantidad) || cantidad <= 0)
          return res.status(400).json({ success: false, message: `Cantidad invalida en item #${i + 1}` });

        let precio = it.precio_unitario != null ? Number(it.precio_unitario) : null;
        if (!Number.isFinite(precio)) {
          const [m] = await connection.query(
            'SELECT precio FROM materiales WHERE id = ? AND empresa_id = ? LIMIT 1',
            [it.material_id, req.empresaId]
          );
          if (!m?.[0]) return res.status(400).json({ success: false, message: `Material no existe: material_id=${it.material_id}` });
          precio = Number(m[0].precio);
        }
        if (!Number.isFinite(precio) || precio < 0)
          return res.status(400).json({ success: false, message: `Precio invalido en item #${i + 1}` });

        subtotal += cantidad * precio;
      }

      subtotal       = round2(subtotal);
      const iva      = round2(subtotal * iva_valor);
      const total    = round2(subtotal + iva);
      const fecha    = safeDate(req.body.fecha);
      const fechaTxt = fecha.split('-').reverse().join('/');

      const whatsapp_text =
        `*PROFORMA - COTIZACION*\n━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Cliente:* ${cliente}\n📅 *Fecha:* ${fechaTxt}\n━━━━━━━━━━━━━━━━━━━\n\n` +
        `💰 Subtotal: *$${subtotal.toFixed(2)}*\n💵 *TOTAL A PAGAR (+IVA): $${total.toFixed(2)}*`;

      return res.status(200).json({ success: true, data: { cliente, fecha, items, subtotal, iva, total, iva_valor, whatsapp_text } });
    }

    return res.status(400).json({ success: false, message: 'Payload invalido. Envie items con trabajo_id (recetas) o material_id (legacy).' });
  } catch (error) {
    logger.error('PROFORMA_CALCULAR', { event: 'proforma.calcular_error', message: error.message, userId: req.user?.id });
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
};

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

    // ── Modo recetas ──────────────────────────────────────────────────────
    if (isRecipeItems(items)) {
      if (!calcularPorRecetas || !buildWhatsAppText) throw new Error('Modo recetas no disponible');

      const calc          = await calcularPorRecetas(connection, req.body);
      const whatsapp_text = buildWhatsAppText(calc);

      if (!esCliente) await validarYRestarStock(connection, calc.materialesAgregados, calc.items, empresa_id);

      const [prof] = await connection.query(
        `INSERT INTO proformas (empresa_id, fecha, cliente, telefono, fecha_agendamiento, total, usuario_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [empresa_id, safeDate(calc.fecha), calc.cliente, calc.telefono || null, calc.fecha_agendamiento || null, calc.total, usuario_id]
      );
      const proforma_id = prof.insertId;

      // Fix Sprint 13: guardar precio_unitario y subtotal por ítem
      try {
        for (const it of calc.items) {
          await connection.query(
            `INSERT INTO proforma_items (proforma_id, trabajo_id, color_id, ancho, alto, cantidad, detalle, precio_unitario, subtotal, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [proforma_id, it.trabajo_id, it.color_id || null, it.ancho, it.alto, it.cantidad || 1, it.detalle || null, round2(it.precio_unitario ?? 0), round2(it.subtotal ?? 0)]
          );
        }
      } catch (e) {
        logger.warn('PROFORMA_ITEMS_INSERT_WARN', { event: 'proforma.items_insert_warning', message: e.message });
      }

      for (const m of calc.materialesAgregados) {
        await connection.query(
          'INSERT INTO proforma_detalle (proforma_id, material_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [proforma_id, m.material_id, m.cantidad, m.precio_unitario]
        );
      }

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
      logger.info('PROFORMA_AGENDADA', { event: 'proforma.agendada_recetas', proformaId: proforma_id, pedidoId: pedido_id, userId: usuario_id, empresaId: empresa_id, total: calc.total });
      return res.status(201).json({ success: true, message: 'Agendado correctamente', proforma_id, pedido_id, data: { ...calc, whatsapp_text } });
    }

    // ── Modo legacy ───────────────────────────────────────────────────────
    if (isLegacyItems(items)) {
      const safeCliente = (cliente || '').trim();
      if (!safeCliente) throw new Error('Cliente es requerido');
      const safeFecha = safeDate(fecha);
      const safeTotal = Number(total) || 0;

      if (!esCliente) await validarYRestarStockLegacy(connection, items, empresa_id);

      const [prof] = await connection.query(
        `INSERT INTO proformas (empresa_id, fecha, cliente, telefono, fecha_agendamiento, total, usuario_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [empresa_id, safeFecha, safeCliente, telefono ? String(telefono).trim() : null,
         fecha_agendamiento ? String(fecha_agendamiento).slice(0, 10) : null, safeTotal, usuario_id]
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
      logger.info('PROFORMA_AGENDADA_LEGACY', { event: 'proforma.agendada_legacy', proformaId: proforma_id, pedidoId: pedido_id, userId: usuario_id, empresaId: empresa_id, total: safeTotal });
      return res.status(201).json({ success: true, message: 'Agendado en modo legacy correctamente', proforma_id, pedido_id });
    }

    throw new Error('Items invalidos: debe ser modo recetas (trabajo_id) o modo legacy (material_id)');

  } catch (error) {
    await connection.rollback();
    logger.error('PROFORMA_AGENDAR_ERROR', { event: 'proforma.agendar_error', message: error.message, userId: req.user?.id });
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
};