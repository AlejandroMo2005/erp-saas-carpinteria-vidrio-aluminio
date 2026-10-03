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
router.get('/',            ctrl.getTrabajos);
router.get('/colores',     ctrl.getColores);
router.get('/:id/recetas', ctrl.getRecetasPorTrabajo);


module.exports = router;