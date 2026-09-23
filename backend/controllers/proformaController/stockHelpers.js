// backend/controllers/proformaController/stockHelpers.js
// Sprint 19 — empresa_id en UPDATE materiales para evitar tocar stock de otra empresa

'use strict';

// ── Modo recetas: materialesAgregados del calculador ─────────────────────
async function validarYRestarStock(connection, materialesAgregados, items, empresaId) {
  const color_id = items[0]?.color_id || null;

  for (const m of materialesAgregados) {
    const { material_id, cantidad } = m;

    if (!Number.isFinite(cantidad) || cantidad <= 0)
      throw new Error(`Cantidad invalida para material #${material_id}`);

    let stockRestado = false;

    if (color_id) {
      const [variante] = await connection.query(
        `SELECT id, stock FROM materiales_variantes
         WHERE material_id = ? AND color_id = ? LIMIT 1`,
        [material_id, color_id]
      );

      if (variante.length > 0) {
        const stockActual = Number(variante[0].stock);

        if (stockActual < cantidad) {
          const [mat] = await connection.query('SELECT nombre FROM materiales WHERE id = ?', [material_id]);
          const [col] = await connection.query('SELECT nombre FROM colores   WHERE id = ?', [color_id]);
          throw new Error(
            `Stock insuficiente: ${mat[0]?.nombre} (${col[0]?.nombre}). ` +
            `Disponible: ${stockActual}, Requerido: ${cantidad}`
          );
        }

        await connection.query(
          `UPDATE materiales_variantes SET stock = stock - ?
           WHERE material_id = ? AND color_id = ?`,
          [cantidad, material_id, color_id]
        );
        stockRestado = true;
      }
    }

    if (!stockRestado) {
      // Sprint 19: AND empresa_id evita modificar stock de otra empresa
      const [mat] = await connection.query(
        'SELECT nombre, stock FROM materiales WHERE id = ? AND empresa_id = ? LIMIT 1',
        [material_id, empresaId]
      );
      if (!mat.length) throw new Error(`Material no encontrado: ID ${material_id}`);

      const stockActual = Number(mat[0].stock);
      if (stockActual < cantidad)
        throw new Error(
          `Stock insuficiente: ${mat[0].nombre}. Disponible: ${stockActual}, Requerido: ${cantidad}`
        );

      await connection.query(
        'UPDATE materiales SET stock = stock - ? WHERE id = ? AND empresa_id = ?',
        [cantidad, material_id, empresaId]
      );
    }
  }
}

// ── Modo legacy: items directos con material_id ───────────────────────────
async function validarYRestarStockLegacy(connection, items, empresaId) {
  for (let i = 0; i < items.length; i++) {
    const { material_id, cantidad, color_id } = items[i];

    if (!Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0)
      throw new Error(`Cantidad invalida en item #${i + 1}`);

    let stockRestado = false;

    if (color_id) {
      const [variante] = await connection.query(
        `SELECT id, stock FROM materiales_variantes
         WHERE material_id = ? AND color_id = ? LIMIT 1`,
        [material_id, color_id]
      );

      if (variante.length > 0) {
        const stockActual = Number(variante[0].stock);

        if (stockActual < Number(cantidad)) {
          const [mat] = await connection.query('SELECT nombre FROM materiales WHERE id = ?', [material_id]);
          const [col] = await connection.query('SELECT nombre FROM colores   WHERE id = ?', [color_id]);
          throw new Error(
            `Stock insuficiente: ${mat[0]?.nombre} (${col[0]?.nombre}). ` +
            `Disponible: ${stockActual}, Requerido: ${cantidad}`
          );
        }

        await connection.query(
          `UPDATE materiales_variantes SET stock = stock - ?
           WHERE material_id = ? AND color_id = ?`,
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
        throw new Error(
          `Stock insuficiente: ${mat[0].nombre}. Disponible: ${stockActual}, Requerido: ${cantidad}`
        );

      await connection.query(
        'UPDATE materiales SET stock = stock - ? WHERE id = ? AND empresa_id = ?',
        [Number(cantidad), material_id, empresaId]
      );
    }
  }
}

module.exports = { validarYRestarStock, validarYRestarStockLegacy };