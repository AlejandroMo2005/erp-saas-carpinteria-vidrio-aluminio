// src/modules/dashboard/dashboard.repository.js
// Sprint 19 — empresa_id en todos los queries
// 📦 Sprint 20 — Movido de models/Dashboard.js
//                config/database → ../../../config/database

'use strict';

const db = require('../../config/database.js');

// ─── Resumen KPIs ───────────────────────────────────────────────────────────
const getResumenGeneral = async (desde = null, hasta = null, empresaId) => {
  let where    = 'WHERE p.empresa_id = ?';
  const params = [empresaId];
  if (desde) { where += ' AND p.fecha >= ?'; params.push(desde); }
  if (hasta) { where += ' AND p.fecha <= ?'; params.push(hasta); }

  return db.query(`
    SELECT
      COALESCE(COUNT(DISTINCT p.id), 0)         AS total_pedidos,
      COALESCE(COUNT(DISTINCT p.usuario_id), 0) AS usuarios_activos,
      COALESCE(SUM(p.total), 0)                 AS ingresos_totales,
      COALESCE(AVG(p.total), 0)                 AS ticket_promedio,
      COALESCE(SUM(pd.cantidad), 0)             AS unidades_vendidas
    FROM pedidos p
    LEFT JOIN pedido_detalle pd ON pd.pedido_id = p.id
    ${where}
  `, params);
};

// ─── Ingresos por periodo ───────────────────────────────────────────────────
const getIngresosPorPeriodo = async (periodo = 'mes', empresaId) => {
  const formatos = { dia: '%Y-%m-%d', semana: '%x-W%v', mes: '%Y-%m', anio: '%Y' };
  const formato  = formatos[periodo] || formatos.mes;

  return db.query(`
    SELECT
      DATE_FORMAT(fecha, ?)   AS periodo,
      COUNT(id)               AS total_pedidos,
      COALESCE(SUM(total), 0) AS ingresos
    FROM pedidos
    WHERE empresa_id = ?
    GROUP BY periodo
    ORDER BY periodo ASC
  `, [formato, empresaId]);
};

// ─── Pedidos recientes ──────────────────────────────────────────────────────
const getPedidosRecientes = async (limite = 10, empresaId) => {
  return db.query(`
    SELECT
      p.id, p.fecha, p.estado, p.total,
      u.nombre AS usuario
    FROM pedidos p
    LEFT JOIN usuarios u ON u.id = p.usuario_id
    WHERE p.empresa_id = ?
    ORDER BY p.fecha DESC, p.id DESC
    LIMIT ?
  `, [empresaId, Number(limite)]);
};

// ─── Ingresos por usuario ───────────────────────────────────────────────────
const getIngresosPorUsuario = async (empresaId) => {
  return db.query(`
    SELECT
      COALESCE(u.nombre, 'Sin usuario') AS nombre,
      COUNT(p.id)                       AS total_pedidos,
      COALESCE(SUM(p.total), 0)         AS ingresos_totales
    FROM pedidos p
    LEFT JOIN usuarios u ON u.id = p.usuario_id
    WHERE p.empresa_id = ?
    GROUP BY p.usuario_id, u.nombre
    HAVING COUNT(p.id) > 0
    ORDER BY ingresos_totales DESC
    LIMIT 10
  `, [empresaId]);
};

// ─── Top productos ──────────────────────────────────────────────────────────
const getTopProductos = async (limite = 12, desde = null, hasta = null, empresaId) => {
  let where    = 'WHERE m.empresa_id = ?';
  const params = [empresaId];
  if (desde) { where += ' AND p.fecha >= ?'; params.push(desde); }
  if (hasta) { where += ' AND p.fecha <= ?'; params.push(hasta); }
  params.push(Number(limite));

  return db.query(`
    SELECT
      m.id                                               AS material_id,
      m.nombre                                           AS producto,
      m.precio                                           AS precio_base,
      COALESCE(SUM(pd.cantidad), 0)                      AS cantidad_vendida,
      COALESCE(SUM(pd.cantidad * pd.precio_unitario), 0) AS ingreso_generado
    FROM materiales m
    LEFT JOIN (
      pedido_detalle pd
      INNER JOIN pedidos p
        ON p.id = pd.pedido_id
       AND p.empresa_id = ?
       AND p.fecha IS NOT NULL
    )
      ON pd.material_id = m.id
    ${where}
    GROUP BY m.id, m.nombre, m.precio
    ORDER BY cantidad_vendida DESC
    LIMIT ?
  `, [empresaId, ...params]);
};

// ─── Materiales con variantes ───────────────────────────────────────────────
const getMaterialesVariantes = async (empresaId) => {
  return db.query(`
    SELECT
      m.id     AS material_id,
      m.nombre AS material,
      m.precio AS precio_base,
      c.id     AS color_id,
      c.nombre AS color_nombre,
      c.valor  AS color_hex,
      c.tipo   AS color_tipo,
      mv.stock,
      mv.precio AS precio_variante
    FROM materiales m
    LEFT JOIN materiales_variantes mv ON mv.material_id = m.id
    LEFT JOIN colores c
      ON mv.color_id = c.id
     AND c.empresa_id = m.empresa_id
    WHERE m.empresa_id = ? AND m.deleted_at IS NULL
    ORDER BY m.nombre ASC, c.nombre ASC
  `, [empresaId]);
};

// ─── Trabajo stats ──────────────────────────────────────────────────────────
const getTrabajoStats = async (empresaId) => {
  return db.query(`
    SELECT
      t.id, t.nombre, t.activo,
      COUNT(DISTINCT pi.proforma_id) AS pedidos_asociados
    FROM trabajos t
    LEFT JOIN proforma_items pi ON pi.trabajo_id = t.id
    LEFT JOIN proformas pr      ON pr.id = pi.proforma_id
                               AND pr.empresa_id = ?
    WHERE t.empresa_id = ? AND t.activo = 1
    GROUP BY t.id, t.nombre, t.activo
    ORDER BY pedidos_asociados DESC, t.nombre ASC
  `, [empresaId, empresaId]);
};

// ─── Estados de pedidos ─────────────────────────────────────────────────────
const getVentasPorEstado = async (empresaId) => {
  return db.query(`
    SELECT
      estado,
      COUNT(id)               AS cantidad,
      COALESCE(SUM(total), 0) AS monto_total
    FROM pedidos
    WHERE empresa_id = ?
    GROUP BY estado
    ORDER BY FIELD(estado, 'PENDIENTE', 'PROCESADO', 'ENTREGADO')
  `, [empresaId]);
};

module.exports = {
  getResumenGeneral,
  getIngresosPorPeriodo,
  getPedidosRecientes,
  getIngresosPorUsuario,
  getTopProductos,
  getMaterialesVariantes,
  getTrabajoStats,
  getVentasPorEstado,
};