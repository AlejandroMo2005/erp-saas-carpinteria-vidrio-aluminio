// src/modules/configuracion/configuracion.routes.js
// Sprint 20 — migrado
// Sprint 21 — tenantMiddleware agregado explícitamente como seguridad defensiva.
//             Aunque modules/index.js lo aplica globalmente, tenerlo aquí garantiza
//             que req.empresaId siempre exista sin depender del orden de registro.

'use strict';

const express = require('express');
const router  = express.Router();

const ctrl                        = require('./configuracion.controller');
const { protect, authorize }      = require('../../shared/middleware/auth');
const { tenantMiddleware }        = require('../../shared/middleware/tenant');

// GET /api/configuracion/iva/tasa — antes de /:clave para evitar que "iva" se lea como clave
router.get('/iva/tasa', protect, tenantMiddleware, authorize('ADMIN'), ctrl.obtenerTasaIva);

router.get('/',       protect, tenantMiddleware, authorize('ADMIN'), ctrl.obtenerTodos);
router.get('/:clave', protect, tenantMiddleware, authorize('ADMIN'), ctrl.obtenerPorClave);
router.put('/:clave', protect, tenantMiddleware, authorize('ADMIN'), ctrl.actualizarValor);

module.exports = router;