// src/modules/inventario/material/material.repository.js
// Sprint 19 — empresa_id en getAll y getConColores
// 📦 Sprint 20 — Movido de models/Material.js (proxy eliminado)
//                config/database → ../../../../config/database

'use strict';

const db = require('../../../config/database.js');

const Material = {

  getAll: async (empresaId) => {
    const [rows] = await db.query(
      `SELECT * FROM materiales
       WHERE empresa_id = ? AND deleted_at IS NULL
       ORDER BY nombre ASC`,
      [empresaId]
    );
    return rows;
  },

  getConColores: async (empresaId) => {
    const [rows] = await db.query(`
      SELECT
        mv.id          AS variante_id,
        m.nombre       AS nombre_material,
        mv.material_id,
        c.nombre       AS color_nombre,
        c.valor        AS color_valor,
        mv.stock,
        mv.precio
      FROM materiales_variantes mv
      JOIN materiales m ON mv.material_id = m.id
      JOIN colores    c ON mv.color_id    = c.id
      WHERE m.empresa_id = ? AND m.deleted_at IS NULL
      ORDER BY m.nombre ASC, c.id ASC`,
      [empresaId]
    );
    return rows;
  },

  updateVarianteInfo: (id, stock, precio, empresaId) =>
    db.query(
      `UPDATE materiales_variantes mv
       INNER JOIN materiales m ON m.id = mv.material_id
       SET mv.stock = ?, mv.precio = ?
       WHERE mv.id = ? AND m.empresa_id = ?`,
      [stock, precio, id, empresaId]
    ),

  updateBasePrice: (materialId, precio, empresaId) =>
    db.query(
      'UPDATE materiales SET precio = ? WHERE id = ? AND empresa_id = ?',
      [precio, materialId, empresaId]
    ),

  getById: async (id, empresaId) => {
    const [rows] = await db.query(
      `SELECT mv.*, m.empresa_id
       FROM materiales_variantes mv
       JOIN materiales m ON m.id = mv.material_id
       WHERE mv.id = ? AND m.empresa_id = ?`,
      [id, empresaId]
    );
    return rows[0];
  },
};

module.exports = Material;