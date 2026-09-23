// src/modules/inventario/proveedor/proveedor.repository.js
// Sprint 19 — empresa_id en todos los queries
// 📦 Sprint 20 — Movido de models/Proveedor.js (proxy eliminado)
//                config/database → ../../../../config/database

'use strict';

const db = require('../../../../config/database');

// ═══════════════════════════════════════════════════════
// PROVEEDORES CRUD
// ═══════════════════════════════════════════════════════

const getAll = async (empresaId) => {
  const [rows] = await db.query(`
    SELECT
      p.*,
      COUNT(pm.material_id) AS total_materiales
    FROM proveedores p
    LEFT JOIN proveedor_materiales pm ON pm.proveedor_id = p.id
    WHERE p.empresa_id = ? AND p.activo = 1 AND p.deleted_at IS NULL
    GROUP BY p.id
    ORDER BY p.nombre
  `, [empresaId]);
  return rows;
};

const getById = async (id, empresaId) => {
  const [proveedores] = await db.query(
    'SELECT * FROM proveedores WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL',
    [id, empresaId]
  );
  if (!proveedores.length) return null;

  const proveedor = proveedores[0];

  const [materiales] = await db.query(`
    SELECT m.id, m.nombre, m.descripcion, m.stock, m.stock_minimo, m.precio
    FROM materiales m
    JOIN proveedor_materiales pm ON pm.material_id = m.id
    WHERE pm.proveedor_id = ? AND m.empresa_id = ? AND m.deleted_at IS NULL
    ORDER BY m.nombre
  `, [id, empresaId]);

  return { ...proveedor, materiales };
};

const create = async (data, materialIds = []) => {
  const { nombre, ciudad, telefono_whatsapp, email, notas, empresa_id } = data;
  const [result] = await db.query(`
    INSERT INTO proveedores (empresa_id, nombre, ciudad, telefono_whatsapp, email, notas)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [empresa_id, nombre, ciudad, telefono_whatsapp, email, notas]);

  const proveedorId = result.insertId;
  if (materialIds.length > 0) await _asignarMateriales(proveedorId, materialIds);

  const [rows] = await db.query('SELECT * FROM proveedores WHERE id = ?', [proveedorId]);
  return rows[0];
};

const update = async (id, data, materialIds = [], empresaId) => {
  const { nombre, ciudad, telefono_whatsapp, email, notas } = data;
  await db.query(`
    UPDATE proveedores
    SET nombre = ?, ciudad = ?, telefono_whatsapp = ?, email = ?, notas = ?
    WHERE id = ? AND empresa_id = ?
  `, [nombre, ciudad, telefono_whatsapp, email, notas, id, empresaId]);

  await db.query('DELETE FROM proveedor_materiales WHERE proveedor_id = ?', [id]);
  if (materialIds.length > 0) await _asignarMateriales(id, materialIds);

  const [rows] = await db.query('SELECT * FROM proveedores WHERE id = ?', [id]);
  return rows[0];
};

const _asignarMateriales = async (proveedorId, materialIds) => {
  const values = materialIds.map(() => '(?, ?)').join(', ');
  const params = materialIds.flatMap(mid => [proveedorId, mid]);
  await db.query(
    `INSERT IGNORE INTO proveedor_materiales (proveedor_id, material_id) VALUES ${values}`,
    params
  );
};

// ═══════════════════════════════════════════════════════
// ALERTAS DE STOCK
// ═══════════════════════════════════════════════════════

const getAlertasStock = async (empresaId) => {
  const [rows] = await db.query(`
    SELECT
      mv.id                                          AS variante_id,
      mv.material_id,
      COALESCE(m.nombre, CONCAT('Material #', mv.material_id, ' (sin registro)')) AS material,
      c.nombre                                       AS color,
      mv.stock,
      COALESCE(m.stock_minimo, 10)                   AS stock_minimo,
      p.id                                           AS proveedor_id,
      p.nombre                                       AS proveedor,
      p.telefono_whatsapp,
      p.ciudad,
      (COALESCE(m.stock_minimo, 10) - mv.stock)      AS faltante
    FROM materiales_variantes mv
    LEFT JOIN materiales m            ON mv.material_id    = m.id
    JOIN      colores c               ON mv.color_id       = c.id
    LEFT JOIN proveedor_materiales pm ON pm.material_id    = mv.material_id
    LEFT JOIN proveedores p           ON p.id              = pm.proveedor_id
                                     AND p.activo          = 1
                                     AND p.empresa_id      = ?
    WHERE (m.empresa_id = ? OR m.id IS NULL)
      AND (m.activo = 1 OR m.id IS NULL)
      AND mv.stock <= COALESCE(m.stock_minimo, 10)
    ORDER BY (COALESCE(m.stock_minimo, 10) - mv.stock) DESC, material, c.nombre
  `, [empresaId, empresaId]);
  return rows;
};

// ═══════════════════════════════════════════════════════
// SOLICITUDES
// ═══════════════════════════════════════════════════════

const createSolicitud = async (data, items) => {
  const { proveedor_id, usuario_id, plantilla_texto, empresa_id } = data;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(`
      INSERT INTO solicitudes_materiales (empresa_id, proveedor_id, usuario_id, plantilla_texto)
      VALUES (?, ?, ?, ?)
    `, [empresa_id, proveedor_id, usuario_id, plantilla_texto]);

    const solicitudId = result.insertId;

    for (const item of items) {
      let materialIdSeguro = null;
      if (item.material_id) {
        const [check] = await connection.query(
          'SELECT id FROM materiales WHERE id = ? AND empresa_id = ? LIMIT 1',
          [item.material_id, empresa_id]
        );
        materialIdSeguro = check.length > 0 ? item.material_id : null;
      }
      await connection.query(`
        INSERT INTO solicitud_items
          (solicitud_id, material_id, variante_id, nombre_material, color, cantidad, unidad)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        solicitudId, materialIdSeguro, item.variante_id || null,
        item.nombre_material, item.color || null,
        item.cantidad, item.unidad || 'unidad',
      ]);
    }

    await connection.commit();
    const [rows] = await connection.query(
      'SELECT * FROM solicitudes_materiales WHERE id = ?', [solicitudId]
    );
    return rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const marcarEnviada = async (solicitudId) => {
  await db.query(
    "UPDATE solicitudes_materiales SET estado = 'enviada' WHERE id = ?",
    [solicitudId]
  );
  const [rows] = await db.query(
    'SELECT * FROM solicitudes_materiales WHERE id = ?', [solicitudId]
  );
  return rows[0];
};

const getSolicitudes = async (empresaId, { limit = 50 } = {}) => {
  const [rows] = await db.query(`
    SELECT
      s.*,
      p.nombre          AS proveedor_nombre,
      p.ciudad          AS proveedor_ciudad,
      p.telefono_whatsapp,
      u.nombre_completo AS usuario_nombre
    FROM solicitudes_materiales s
    LEFT JOIN proveedores p ON p.id = s.proveedor_id
    LEFT JOIN usuarios    u ON u.id = s.usuario_id
    WHERE s.empresa_id = ?
    ORDER BY s.created_at DESC
    LIMIT ?
  `, [empresaId, limit]);

  for (const sol of rows) {
    const [items] = await db.query(
      'SELECT * FROM solicitud_items WHERE solicitud_id = ?', [sol.id]
    );
    sol.items = items;
  }
  return rows;
};

const getMateriales = async (empresaId) => {
  const [rows] = await db.query(`
    SELECT id, nombre, descripcion, precio, stock, stock_minimo, activo, created_at, updated_at
    FROM materiales
    WHERE empresa_id = ? AND activo = 1 AND deleted_at IS NULL
    ORDER BY nombre
  `, [empresaId]);
  return rows;
};

module.exports = {
  getAll, getById, create, update,
  getAlertasStock, createSolicitud, marcarEnviada,
  getSolicitudes, getMateriales,
};