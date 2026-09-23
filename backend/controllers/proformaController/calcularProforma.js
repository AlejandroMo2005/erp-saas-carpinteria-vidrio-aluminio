// backend/controllers/proformaController/calcularProforma.js
// Sprint 19 — empresa_id en query de configuracion (IVA por empresa)

'use strict';

const database = require('../../config/database');
const logger   = require('../../utils/logger');
const { round2, isLegacyItems, isRecipeItems, safeDate } = require('./utils');

let calcularPorRecetas = null;
let buildWhatsAppText  = null;
try {
  ({ calcularPorRecetas, buildWhatsAppText } = require('../../services/proformaCalculator'));
} catch {
  logger.warn('PROFORMA_CALCULATOR_MISSING', {
    event:   'proforma.calculator_not_found',
    message: 'No se encontró services/proformaCalculator',
  });
}

// ═══════════════════════════════════════════════════════
// POST /api/proformas/calcular
// ═══════════════════════════════════════════════════════
exports.calcularProforma = async (req, res) => {
  const connection = await database.getConnection();
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe enviar al menos 1 item para calcular',
      });
    }

    // ── Modo recetas ──────────────────────────────────────────────────────
    if (isRecipeItems(items)) {
      if (!calcularPorRecetas || !buildWhatsAppText) {
        return res.status(400).json({
          success: false,
          message: 'Modo recetas no disponible: falta services/proformaCalculator.js',
        });
      }
      const calc          = await calcularPorRecetas(connection, req.body);
      const whatsapp_text = buildWhatsAppText(calc);
      return res.status(200).json({ success: true, data: { ...calc, whatsapp_text } });
    }

    // ── Modo legacy ───────────────────────────────────────────────────────
    if (isLegacyItems(items)) {
      const cliente = (req.body.cliente || '').trim() || 'SIN NOMBRE';

      // Sprint 19: IVA de la empresa del usuario, no global
      const [ivaRows] = await connection.query(
        `SELECT valor FROM configuracion
         WHERE empresa_id = ? AND clave = 'IVA' LIMIT 1`,
        [req.empresaId]
      );
      const iva_valor = ivaRows?.[0]?.valor != null ? Number(ivaRows[0].valor) : 0.15;

      let subtotal = 0;

      for (let i = 0; i < items.length; i++) {
        const it       = items[i];
        const cantidad = Number(it.cantidad);

        if (!it.material_id)
          return res.status(400).json({ success: false, message: `Falta material_id en item #${i + 1}` });
        if (!Number.isFinite(cantidad) || cantidad <= 0)
          return res.status(400).json({ success: false, message: `Cantidad invalida en item #${i + 1}` });

        let precio = it.precio_unitario != null ? Number(it.precio_unitario) : null;
        if (!Number.isFinite(precio)) {
          // Sprint 19: solo materiales de la empresa
          const [m] = await connection.query(
            'SELECT precio FROM materiales WHERE id = ? AND empresa_id = ? LIMIT 1',
            [it.material_id, req.empresaId]
          );
          if (!m?.[0])
            return res.status(400).json({ success: false, message: `Material no existe: material_id=${it.material_id}` });
          precio = Number(m[0].precio);
        }

        if (!Number.isFinite(precio) || precio < 0)
          return res.status(400).json({ success: false, message: `Precio invalido en item #${i + 1}` });

        subtotal += cantidad * precio;
      }

      subtotal = round2(subtotal);
      const iva   = round2(subtotal * iva_valor);
      const total = round2(subtotal + iva);
      const fecha = safeDate(req.body.fecha);
      const fechaTxt = fecha.split('-').reverse().join('/');

      const whatsapp_text =
        `*PROFORMA - COTIZACION*\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Cliente:* ${cliente}\n` +
        `📅 *Fecha:* ${fechaTxt}\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `💰 Subtotal: *$${subtotal.toFixed(2)}*\n` +
        `💵 *TOTAL A PAGAR (+IVA): $${total.toFixed(2)}*`;

      return res.status(200).json({
        success: true,
        data: { cliente, fecha, items, subtotal, iva, total, iva_valor, whatsapp_text },
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Payload invalido. Envie items con trabajo_id (recetas) o material_id (legacy).',
    });
  } catch (error) {
    logger.error('PROFORMA_CALCULAR', {
      event:   'proforma.calcular_error',
      message: error.message,
      userId:  req.user?.id,
    });
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
};