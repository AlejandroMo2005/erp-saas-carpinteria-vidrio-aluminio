// src/modules/cliente/cliente.routes.js
// 📦 Sprint 20 — Creado nuevo (routes/clienteRoutes.js no existía)
//                Routes inferidas de clienteController.js
//                protect + tenantMiddleware se aplican en modules/index.js

'use strict';

const express = require('express');
const router  = express.Router();
const ctrl                   = require('./cliente.controller');
const { protect, authorize } = require('../../shared/middleware/auth');

// Búsqueda por nombre O teléfono (ADMIN y VENDEDOR)
router.get('/',
  authorize('ADMIN', 'VENDEDOR'),
  ctrl.listar
);

// Búsqueda legacy por teléfono
router.get('/buscar',
  authorize('ADMIN', 'VENDEDOR'),
  ctrl.buscarPorTelefono
);

// Mis datos — solo CLIENTE (debe ir ANTES de /:id)
router.get('/mis-datos',
  protect,
  authorize('CLIENTE'),
  ctrl.getMisDatos
);
router.put('/mis-datos',
  protect,
  authorize('CLIENTE'),
  ctrl.updateMisDatos
);

// Crear cliente
router.post('/',
  authorize('ADMIN', 'VENDEDOR'),
  ctrl.crear
);

module.exports = router;