// src/modules/comercial/pedido/pedido.routes.js
// Sprint 10 — Seguridad + filtrado por rol
// Sprint 11 — trackActivity + inactivityGuard en rutas sensibles
// Sprint 17 — DT-07: validación Zod en POST y PUT/PATCH con body
// 📦 Sprint 20 — Migrado a src/modules/comercial/pedido/
//                controller   → ./pedido.controller
//                middleware   → ../../../shared/middleware/{auth,auditLog,filtroRol,activityTracker,validateZod}
//                validators   → ../../../shared/validators/pedido.validators

'use strict';

const express = require('express');
const router  = express.Router();

const { protect, authorize }             = require('../../../shared/middleware/auth');
const { auditarOperacion }               = require('../../../shared/middleware/auditLog');
const { filtroCliente }                  = require('../../../shared/middleware/filtroRol');
const { trackActivity, inactivityGuard } = require('../../../shared/middleware/activityTracker');
const { validateBody }                   = require('../../../shared/middleware/validateZod');
const { createPedidoSchema, updateEstadoSchema } = require('../../../shared/validators/pedido.validators');
const pedidoController                   = require('./pedido.controller');

// protect + trackActivity en todas las rutas del módulo
router.use(protect, trackActivity);

// ── Rutas estáticas PRIMERO ──────────────────────────────────────────────
router.get('/estado/:estado',
  authorize('ADMIN', 'VENDEDOR', 'ALMACEN'),
  pedidoController.getPedidosByEstado
);

// ── Colección ────────────────────────────────────────────────────────────
router.get('/',
  authorize('ADMIN', 'VENDEDOR', 'ALMACEN', 'CLIENTE'),
  filtroCliente,
  pedidoController.getAllPedidos
);

// ── Crear ─────────────────────────────────────────────────────────────────
router.post('/',
  authorize('ADMIN', 'VENDEDOR', 'CLIENTE'),
  validateBody(createPedidoSchema),
  pedidoController.createPedido
);

// ── Cambio de estado — sensible: inactivityGuard ──────────────────────────
router.put('/:id/estado',
  authorize('ADMIN', 'VENDEDOR', 'ALMACEN'),
  inactivityGuard,
  validateBody(updateEstadoSchema),
  pedidoController.updateEstado
);
router.patch('/:id/estado',
  authorize('ADMIN', 'VENDEDOR', 'ALMACEN'),
  inactivityGuard,
  validateBody(updateEstadoSchema),
  pedidoController.updateEstado
);

// ── Ver pedido individual ────────────────────────────────────────────────
router.get('/:id',
  authorize('ADMIN', 'VENDEDOR', 'ALMACEN', 'CLIENTE'),
  filtroCliente,
  pedidoController.getPedidoById
);

// ── Eliminar — solo ADMIN + inactivityGuard ──────────────────────────────
router.delete('/:id',
  authorize('ADMIN'),
  inactivityGuard,
  auditarOperacion('pedidos'),
  pedidoController.deletePedido
);

module.exports = router;