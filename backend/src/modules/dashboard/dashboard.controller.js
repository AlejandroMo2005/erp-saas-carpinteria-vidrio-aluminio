// src/modules/dashboard/dashboard.controller.js
// Sprint 11 — Logger Winston
// Sprint 19 — empresa_id en todos los queries del modelo
// 📦 Sprint 20 — Migrado a src/modules/dashboard/
//                models/Dashboard → ./dashboard.repository
//                utils/logger     → ../../../utils/logger

'use strict';

const m      = require('./dashboard.repository');
const logger = require('../../shared/utils/logger');

// ═══════════════════════════════════════════════════════
// GET /api/dashboard/resumen
// ═══════════════════════════════════════════════════════
const getResumen = async (req, res) => {
  try {
    const { desde = null, hasta = null } = req.query;
    const [rows] = await m.getResumenGeneral(desde, hasta, req.empresaId);
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    logger.error('DASHBOARD_RESUMEN', {
      event: 'dashboard.resumen_error', message: e.message, userId: req.user?.id,
    });
    res.status(500).json({ success: false, message: 'Error al obtener resumen' });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/dashboard/ingresos?periodo=mes
// ═══════════════════════════════════════════════════════
const getIngresos = async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;
    if (!['dia', 'semana', 'mes', 'anio'].includes(periodo))
      return res.status(400).json({ success: false, message: 'Periodo no válido' });

    const [rows] = await m.getIngresosPorPeriodo(periodo, req.empresaId);
    res.json({ success: true, periodo, data: rows });
  } catch (e) {
    logger.error('DASHBOARD_INGRESOS', {
      event: 'dashboard.ingresos_error', message: e.message,
    });
    res.status(500).json({ success: false, message: 'Error al obtener ingresos' });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/dashboard/pedidos-recientes?limite=10
// ═══════════════════════════════════════════════════════
const getPedidosRecientes = async (req, res) => {
  try {
    const limite = Math.min(Math.max(parseInt(req.query.limite) || 10, 1), 50);
    const [rows] = await m.getPedidosRecientes(limite, req.empresaId);
    res.json({ success: true, data: rows });
  } catch (e) {
    logger.error('DASHBOARD_PEDIDOS_RECIENTES', {
      event: 'dashboard.pedidosRecientes_error', message: e.message,
    });
    res.status(500).json({ success: false, message: 'Error al obtener pedidos' });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/dashboard/usuarios-ingresos
// ═══════════════════════════════════════════════════════
const getUsuariosIngresos = async (req, res) => {
  try {
    const [rows] = await m.getIngresosPorUsuario(req.empresaId);
    res.json({ success: true, data: rows });
  } catch (e) {
    logger.error('DASHBOARD_USUARIOS_INGRESOS', {
      event: 'dashboard.usuariosIngresos_error', message: e.message,
    });
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/dashboard/top-productos?limite=12&desde=&hasta=
// ═══════════════════════════════════════════════════════
const getTopProductos = async (req, res) => {
  try {
    const { limite = 12, desde = null, hasta = null } = req.query;
    const limiteNum = Math.min(Math.max(parseInt(limite) || 12, 1), 50);
    const [rows] = await m.getTopProductos(limiteNum, desde, hasta, req.empresaId);
    res.json({ success: true, data: rows });
  } catch (e) {
    logger.error('DASHBOARD_TOP_PRODUCTOS', {
      event: 'dashboard.topProductos_error', message: e.message,
    });
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/dashboard/materiales-variantes
// Agrupa filas planas del modelo en objetos con variantes anidadas
// ═══════════════════════════════════════════════════════
const getMaterialesVariantes = async (req, res) => {
  try {
    const [rows] = await m.getMaterialesVariantes(req.empresaId);

    const mapa = {};
    for (const row of rows) {
      if (!mapa[row.material_id]) {
        mapa[row.material_id] = {
          material_id: row.material_id,
          material:    row.material,
          precio_base: row.precio_base,
          variantes:   [],
        };
      }
      if (row.color_id) {
        mapa[row.material_id].variantes.push({
          color_id:        row.color_id,
          color_nombre:    row.color_nombre,
          color_hex:       row.color_hex,
          color_tipo:      row.color_tipo,
          stock:           row.stock,
          precio_variante: row.precio_variante,
        });
      }
    }
    res.json({ success: true, data: Object.values(mapa) });
  } catch (e) {
    logger.error('DASHBOARD_MATERIALES_VARIANTES', {
      event: 'dashboard.materialesVariantes_error', message: e.message,
    });
    res.status(500).json({ success: false, message: 'Error al obtener materiales' });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/dashboard/trabajos-stats
// ═══════════════════════════════════════════════════════
const getTrabajoStats = async (req, res) => {
  try {
    const [rows] = await m.getTrabajoStats(req.empresaId);
    res.json({ success: true, data: rows });
  } catch (e) {
    logger.error('DASHBOARD_TRABAJO_STATS', {
      event: 'dashboard.trabajoStats_error', message: e.message,
    });
    res.status(500).json({ success: false, message: 'Error al obtener trabajos' });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/dashboard/estados
// ═══════════════════════════════════════════════════════
const getEstados = async (req, res) => {
  try {
    const [rows] = await m.getVentasPorEstado(req.empresaId);
    res.json({ success: true, data: rows });
  } catch (e) {
    logger.error('DASHBOARD_ESTADOS', {
      event: 'dashboard.estados_error', message: e.message,
    });
    res.status(500).json({ success: false, message: 'Error al obtener estados' });
  }
};

module.exports = {
  getResumen,
  getIngresos,
  getPedidosRecientes,
  getUsuariosIngresos,
  getTopProductos,
  getMaterialesVariantes,
  getTrabajoStats,
  getEstados,
};