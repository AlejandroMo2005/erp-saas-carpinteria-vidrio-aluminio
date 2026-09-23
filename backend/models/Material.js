// backend/models/Material.js
// Sprint 19 — empresa_id en getAll y getConColores

'use strict';

const db = require('../config/database');

const Material = {

  // Sprint 19: filtra por empresa + excluye soft-deleted
  getAll: async (empresaId) => {
    const [rows] = await db.query(
      `SELECT * FROM materiales
       WHERE empresa_id = ? AND deleted_at IS NULL
       ORDER BY nombre ASC`,
      [empresaId]
    );
    return rows;
  },

  // Sprint 19: filtra variantes por empresa del material
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

  // Variante: no necesita empresa_id — el check lo hace el controller
  updateVarianteInfo: (id, stock, precio) =>
    db.query(
      'UPDATE materiales_variantes SET stock = ?, precio = ? WHERE id = ?',
      [stock, precio, id]
    ),

  // Sprint 19: AND empresa_id evita tocar materiales de otra empresa
  updateBasePrice: (materialId, precio, empresaId) =>
    db.query(
      'UPDATE materiales SET precio = ? WHERE id = ? AND empresa_id = ?',
      [precio, materialId, empresaId]
    ),

  // Retorna la variante con su material_id para que el controller pueda verificar empresa
  getById: async (id) => {
    const [rows] = await db.query(
      'SELECT mv.*, m.empresa_id FROM materiales_variantes mv JOIN materiales m ON m.id = mv.material_id WHERE mv.id = ?',
      [id]
    );
    return rows[0];
  },
};

module.exports = Material;