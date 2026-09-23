// backend/routes/materialRoutes.js
// ⭐ Sprint 10 — protect + authorize en todas las rutas
// 🔧 Sprint 11 — trackActivity + inactivityGuard en escritura
// ✅ Sprint 17 — DT-07: validación Zod en PUT /variante/:id

const express = require('express');
const router  = express.Router();
const materialController                 = require('../controllers/materialController');
const { protect, authorize }             = require('../middleware/auth');
const { trackActivity, inactivityGuard } = require('../middleware/activityTracker');
const { validateBody }                   = require('../middleware/validateZod');
const { updateVarianteSchema }           = require('../validators/material.validators');

// protect + trackActivity en todas las rutas
router.use(protect, trackActivity);

// ── Lectura ────────────────────────────────────────────────────────────────
router.get('/',            materialController.getAllMateriales);
router.get('/con-colores', materialController.getConColores);

// ── Escritura — inactivityGuard porque modifica stock/precio ──────────────
// validateBody: stock (entero >= 0) y precio (número >= 0) requeridos
router.put('/variante/:id',
  authorize('ADMIN', 'ALMACEN'),
  inactivityGuard,
  validateBody(updateVarianteSchema),
  materialController.updateVariante
);

// ── Eliminar — solo ADMIN ──────────────────────────────────────────────────
router.delete('/:id',
  authorize('ADMIN'),
  inactivityGuard,
  materialController.deleteMaterial
);

module.exports = router;