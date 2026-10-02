// src/modules/inventario/color/color.controller.js
// Sprint 19 — empresa_id en todos los queries
// 📦 Sprint 20 — Migrado a src/modules/inventario/color/
//                config/database → ../../../../config/database
//                utils/logger    → ../../../../utils/logger

'use strict';

const db     = require('../../../config/database.js');
const logger = require('../../../shared/utils/logger');

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
      event: 'color.getAll', cantidad: rows.length, empresaId: req.empresaId,
    });
    res.json(rows);
  } catch (error) {
    logger.error('COLOR_GET_ALL_ERROR', {
      event: 'color.getAll_error', message: error.message, userId: req.user?.id,
    });
    res.status(500).json({ success: false, message: 'Error al obtener colores' });
  }
};