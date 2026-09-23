// src/modules/comercial/trabajo/trabajo.routes.js
// Sprint 17 — DT-07: validación Zod en POST /agendar
// 📦 Sprint 20 — Migrado a src/modules/comercial/trabajo/
//
// NOTA: protect + tenantMiddleware se aplican en modules/index.js
// NOTA: GET /colores y POST /agendar — ver TODOs en trabajo.controller.js

'use strict';

const express = require('express');
const router  = express.Router();
const ctrl                     = require('./trabajo.controller');
const { validateBody }         = require('../../../shared/middleware/validateZod');
const { agendarPedidoTrabajoSchema } = require('../../../shared/validators/trabajo.validators');

router.get('/',            ctrl.getTrabajos);
router.get('/colores',     ctrl.getColores);
router.get('/:id/recetas', ctrl.getRecetasPorTrabajo);

// POST /agendar — legacy (ver TODO en controller)
router.post('/agendar',
  validateBody(agendarPedidoTrabajoSchema),
  ctrl.agendarPedido
);

module.exports = router;