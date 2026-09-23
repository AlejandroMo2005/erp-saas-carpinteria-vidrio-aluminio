// src/modules/inventario/color/color.routes.js
// 📦 Sprint 20 — Migrado de routes/colorRoutes.js
//                La ruta original era inline (sin controller).
//                Ahora usa color.controller.js (empresa_id + Winston logging).

'use strict';

const express = require('express');
const router  = express.Router();
const { getColores } = require('./color.controller');

router.get('/', getColores);

module.exports = router;