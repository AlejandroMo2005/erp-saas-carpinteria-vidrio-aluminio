// backend/controllers/trabajoController.js
// Sprint 19 — empresa_id en todos los queries
// console.error → logger Winston

'use strict';

const db     = require('../config/database');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════
// GET /api/trabajos
// solo_base=1 → sin variante (Proformas, VisualizadorIA)
// sin param   → todos (Referencias)
// ═══════════════════════════════════════════════════════
exports.getTrabajos = async (req, res) => {
  try {
    const soloBase   = req.query.solo_base === '1';
    const whereExtra = soloBase ? ' AND (variante IS NULL OR variante = "")' : '';

    const [rows] = await db.query(
      `SELECT id, nombre, variante FROM trabajos
       WHERE empresa_id = ? AND activo = 1${whereExtra}
       ORDER BY nombre`,
      [req.empresaId]
    );
    res.json(rows);
  } catch (error) {
    logger.error('TRABAJO_GET_ALL', {
      event:   'trabajo.getAll_error',
      message: error.message,
      userId:  req.user?.id,
    });
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/trabajos/:id/recetas
// Sprint 19 — filtra materiales por empresa
// ═══════════════════════════════════════════════════════
exports.getRecetasPorTrabajo = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT
        r.id,
        r.trabajo_id,
        r.material_id,
        m.nombre AS material,
        m.precio,
        r.unidad_calculo,
        r.factor
       FROM recetas r
       INNER JOIN materiales m ON m.id = r.material_id
       WHERE r.trabajo_id = ?
         AND m.empresa_id = ?
         AND m.deleted_at IS NULL`,
      [id, req.empresaId]
    );
    res.json(rows);
  } catch (error) {
    logger.error('TRABAJO_GET_RECETAS', {
      event:     'trabajo.getRecetas_error',
      trabajoId: req.params.id,
      message:   error.message,
      userId:    req.user?.id,
    });
    res.status(500).json({ error: 'Error al obtener recetas del trabajo' });
  }
};