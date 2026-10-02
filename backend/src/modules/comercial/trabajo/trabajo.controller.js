// src/modules/comercial/trabajo/trabajo.controller.js
// Sprint 19 — empresa_id en todos los queries
// 📦 Sprint 20 — Migrado a src/modules/comercial/trabajo/
// ⭐ Sprint 21 — Imports actualizados a rutas src/ canónicas:
//               config/database  → ../../../config/database
//               utils/logger     → ../../../shared/utils/logger
//
// Stubs resueltos (Sprint 21):
//   getColores     → MANTENER — implementado con empresa_id, tabla colores real.
//                    Verificar que la ruta GET /api/trabajos/colores esté en
//                    trabajo.routes.js; si hay un colorController independiente,
//                    mover ahí y eliminar este método.
//   agendarPedido  → ELIMINAR de trabajo.routes.js — retorna 501 legacy.
//                    La ruta correcta es POST /api/proformas/agendar.

'use strict';

const db     = require('../../../config/database.js');      // ← Sprint 21
const logger = require('../../../shared/utils/logger');  // ← Sprint 21

// ═══════════════════════════════════════════════════════
// GET /api/trabajos?solo_base=1
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
// ═══════════════════════════════════════════════════════
exports.getRecetasPorTrabajo = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT
         r.id, r.trabajo_id, r.material_id,
         m.nombre AS material, m.precio,
         r.unidad_calculo, r.factor
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
      event:    'trabajo.getRecetas_error',
      trabajoId: req.params.id,
      message:  error.message,
      userId:   req.user?.id,
    });
    res.status(500).json({ error: 'Error al obtener recetas del trabajo' });
  }
};

// ═══════════════════════════════════════════════════════
// GET /api/trabajos/colores
//
// ✅ Sprint 21 — MANTENER con revisión:
//   Este método tiene implementación real y filtra por empresa_id.
//   Decisión: conservar aquí hasta confirmar si existe colorController
//   independiente. Si existe → mover ahí y eliminar esta exportación.
//   Verificar en trabajo.routes.js que la ruta esté registrada ANTES de
//   '/:id/recetas' para evitar que "colores" se interprete como un :id.
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
    res.json(rows);
  } catch (error) {
    logger.error('TRABAJO_GET_COLORES', {
      event:   'trabajo.getColores_error',
      message: error.message,
      userId:  req.user?.id,
    });
    res.status(500).json({ error: 'Error al obtener colores' });
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/trabajos/agendar  [LEGACY — ELIMINAR]
//
// ❌ Sprint 21 — ELIMINAR esta ruta de trabajo.routes.js.
//   El endpoint nunca fue implementado (siempre retornó 501).
//   La funcionalidad existe en POST /api/proformas/agendar.
//   Se conserva el handler solo como log de compatibilidad; una vez
//   confirmado que ningún cliente llama esta ruta, borrar todo el bloque.
// ═══════════════════════════════════════════════════════
exports.agendarPedido = async (req, res) => {
  logger.warn('TRABAJO_AGENDAR_LEGACY', {
    event:   'trabajo.agendarPedido_not_implemented',
    message: 'Endpoint legacy no implementado. Usar POST /api/proformas/agendar',
    userId:  req.user?.id,
  });
  return res.status(501).json({
    success: false,
    message: 'Endpoint legacy no implementado. Usar POST /api/proformas/agendar',
  });
};