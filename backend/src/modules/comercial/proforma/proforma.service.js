// src/modules/comercial/proforma/proforma.service.js
// Sprint 19 — empresa_id en stock helpers
// 📦 Sprint 20 — Extraído de controllers/proformaController.js
//                Contiene: utilidades puras, stock helpers, lazy-load proformaCalculator
//                NO tiene dependencias HTTP (sin req/res)

'use strict';

const logger = require('../../../shared/utils/logger');

// ── Lazy load proformaCalculator ───────────────────────────────────────────
// Se intenta cargar al iniciar el módulo. Si no existe, los handlers
// que lo necesiten devolverán 400 con mensaje claro.
let calcularPorRecetas = null;
let buildWhatsAppText  = null;
try {
  ({ calcularPorRecetas, buildWhatsAppText } = require('../../../shared/services/proformaCalculator'));
} catch {
  logger.warn('PROFORMA_CALCULATOR_MISSING', {
    event:   'proforma.calculator_not_found',
    message: 'No se encontró services/proformaCalculator',
  });
}

// ── Utilidades puras ────────────────────────────────────────────────────────
const round2        = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const isRecipeItems = (items) => Array.isArray(items) && items.length > 0 && items[0].trabajo_id  != null;
const safeDate      = (d) =>
  d && String(d).trim() ? String(d).slice(0, 10) : new Date().toISOString().slice(0, 10);

// ── Stock helper — modo recetas ─────────────────────────────────────────────
// Valida stock y descuenta en una sola pasada dentro de una transacción abierta.
// Primero intenta descontar de materiales_variantes (con color), luego de materiales.
async function validarYRestarStock(connection, materialesAgregados, items, empresaId) {
  const colorFallback = items[0]?.color_id ?? null;

  for (const m of materialesAgregados) {
    const { material_id, cantidad } = m;
    const color_id = m.color_id ?? colorFallback;
    if (!Number.isFinite(cantidad) || cantidad <= 0)
      throw new Error(`Cantidad invalida para material #${material_id}`);

    let stockRestado = false;

    if (color_id) {
      const [variante] = await connection.query(
        `SELECT mv.id, mv.stock
         FROM materiales_variantes mv
         INNER JOIN materiales m ON m.id = mv.material_id
         INNER JOIN colores c ON c.id = mv.color_id
         WHERE mv.material_id = ?
           AND mv.color_id = ?
           AND m.empresa_id = ?
           AND c.empresa_id = ?
         LIMIT 1`,
        [material_id, color_id, empresaId, empresaId]
      );
      if (variante.length > 0) {
        const stockActual = Number(variante[0].stock);
        if (stockActual < cantidad) {
          const [mat] = await connection.query('SELECT nombre FROM materiales WHERE id = ?', [material_id]);
          const [col] = await connection.query('SELECT nombre FROM colores   WHERE id = ?', [color_id]);
          throw new Error(
            `Stock insuficiente: ${mat[0]?.nombre} (${col[0]?.nombre}). Disponible: ${stockActual}, Requerido: ${cantidad}`
          );
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


module.exports = {
  // Utilidades puras
  round2,
  isRecipeItems,
  safeDate,
  // Stock helpers (requieren connection de transacción activa)
  validarYRestarStock,
  // Calculator (puede ser null si el archivo no existe)
  calcularPorRecetas,
  buildWhatsAppText,
};