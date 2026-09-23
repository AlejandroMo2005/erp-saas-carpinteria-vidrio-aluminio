// backend/controllers/colorController.js
// Sprint 19 — empresa_id en todos los queries
// console.error/log → logger Winston

'use strict';

const db     = require('../config/database');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════
// GET /api/colores
// Sprint 19 — filtra por empresa
// ═══════════════════════════════════════════════════════
exports.getColores = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, valor, tipo
       FROM colores
       WHERE empresa_id = ? AND activo = 1
       ORDER BY tipo, nombre`,
      [req.empresaId]
    );

    logger.info('COLOR_GET_ALL', {
      event:     'color.getAll',
      cantidad:  rows.length,
      empresaId: req.empresaId,
    });

    res.json(rows);
  } catch (error) {
    logger.error('COLOR_GET_ALL_ERROR', {
      event:   'color.getAll_error',
      message: error.message,
      userId:  req.user?.id,
    });
    res.status(500).json({ success: false, message: 'Error al obtener colores' });
  }
};