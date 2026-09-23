// src/modules/inventario/material/material.routes.js
// Sprint 10 — protect + authorize
// Sprint 11 — trackActivity + inactivityGuard
// Sprint 17 — DT-07: validación Zod en PUT /variante/:id
// 📦 Sprint 20 — Migrado a src/modules/inventario/material/

'use strict';

const express = require('express');
const router  = express.Router();
const ctrl                               = require('./material.controller');
const { protect, authorize }             = require('../../../shared/middleware/auth');
const { trackActivity, inactivityGuard } = require('../../../shared/middleware/activityTracker');
const { validateBody }                   = require('../../../shared/middleware/validateZod');
const { updateVarianteSchema }           = require('../../../shared/validators/material.validators');

router.use(protect, trackActivity);

router.get('/',            ctrl.getAllMateriales);
router.get('/con-colores', ctrl.getConColores);

router.put('/variante/:id',
  authorize('ADMIN', 'ALMACEN'),
  inactivityGuard,
  validateBody(updateVarianteSchema),
  ctrl.updateVariante
);
router.delete('/:id',
  authorize('ADMIN'),
  inactivityGuard,
  ctrl.deleteMaterial
);

module.exports = router;