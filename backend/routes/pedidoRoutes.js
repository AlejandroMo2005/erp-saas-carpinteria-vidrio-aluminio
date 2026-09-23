// backend/routes/pedidoRoutes.js
// ⭐ Sprint 10 — Seguridad + filtrado por rol
// 🔧 Sprint 11 — trackActivity + inactivityGuard en rutas sensibles
// ✅ Sprint 17 — DT-07: validación Zod en POST y PUT/PATCH con body

const express = require('express');
const router  = express.Router();
const pedidoController                   = require('../controllers/pedidoController');
const { protect, authorize }             = require('../middleware/auth');
const { auditarOperacion }               = require('../middleware/auditLog');
const { filtroCliente }                  = require('../middleware/filtroRol');
const { trackActivity, inactivityGuard } = require('../middleware/activityTracker');
const { validateBody }                   = require('../middleware/validateZod');
const { createPedidoSchema, updateEstadoSchema } = require('../validators/pedido.validators');

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
// validateBody: total requerido y positivo, estado opcional y en enum válido
router.post('/',
  authorize('ADMIN', 'VENDEDOR', 'CLIENTE'),
  validateBody(createPedidoSchema),
  pedidoController.createPedido
);

// ── Cambio de estado — sensible: inactivityGuard ──────────────────────────
// validateBody: estado requerido y en enum válido
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