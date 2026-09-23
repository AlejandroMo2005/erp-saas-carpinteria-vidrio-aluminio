// backend/routes/proformaRoutes.js
// ⭐ Sprint 10 — Seguridad + filtrado por rol
// 🔧 Sprint 11 — trackActivity + inactivityGuard + quitar console.log
// ✅ Sprint 17 — DT-07: validación Zod en rutas POST con body

const express = require('express');
const router  = express.Router();
const proformaController                 = require('../controllers/proformaController');
const { protect, authorize }             = require('../middleware/auth');
const { filtroCliente }                  = require('../middleware/filtroRol');
const { trackActivity, inactivityGuard } = require('../middleware/activityTracker');
const { validateBody }                   = require('../middleware/validateZod');
const { calcularProformaSchema, agendarPedidoSchema } = require('../validators/proforma.validators');

// protect + trackActivity en todas las rutas
router.use(protect, trackActivity);

// ── Rutas estáticas PRIMERO ──────────────────────────────────────────────
router.get('/search',
  authorize('ADMIN', 'VENDEDOR'),
  proformaController.searchByCliente
);

// ── Agendar ───────────────────────────────────────────────────────────────
// validateBody: items requerido (min 1), cada item con trabajo_id o material_id
// inactivityGuard: crea proforma + pedido en transacción → operación sensible
router.post('/agendar',
  authorize('ADMIN', 'VENDEDOR', 'CLIENTE'),
  inactivityGuard,
  validateBody(agendarPedidoSchema),
  proformaController.agendarPedido
);

// ── Calcular ──────────────────────────────────────────────────────────────
// validateBody: items requerido (min 1), cada item con trabajo_id o material_id
router.post('/calcular',
  authorize('ADMIN', 'VENDEDOR', 'CLIENTE'),
  validateBody(calcularProformaSchema),
  proformaController.calcularProforma
);

// ── Colección ────────────────────────────────────────────────────────────
router.get('/',
  authorize('ADMIN', 'VENDEDOR', 'CLIENTE'),
  filtroCliente,
  proformaController.getAllProformas
);

// ── Por ID ───────────────────────────────────────────────────────────────
router.get('/:id',
  authorize('ADMIN', 'VENDEDOR', 'CLIENTE'),
  filtroCliente,
  proformaController.getProformaById
);

module.exports = router;