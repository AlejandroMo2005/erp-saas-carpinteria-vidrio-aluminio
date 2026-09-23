// backend/routes/facturacionRoutes.js
// 🔧 Sprint 11 — trackActivity + inactivityGuard + auditarOperacion en anular
// ✦  Sprint 13 — GET /pedidos-cliente/:clienteId (precarga ítems en FormularioFactura)
// ✅ Sprint 17 — DT-07: validación Zod en POST y PUT con body

const express = require('express');
const router  = express.Router();
const ctrl                               = require('../controllers/facturacionController');
const { protect, authorize }             = require('../middleware/auth');
const { auditarOperacion }               = require('../middleware/auditLog');
const { trackActivity, inactivityGuard } = require('../middleware/activityTracker');
const { validateBody }                   = require('../middleware/validateZod');
const {
  crearFacturaManualSchema,
  crearDesdePedidoSchema,
  actualizarFacturaSchema,
  anularFacturaSchema,
} = require('../validators/facturacion.validators');

// protect + trackActivity en todas las rutas
router.use(protect, trackActivity);

// ── Rutas estáticas ──────────────────────────────────────────────────────

router.get('/estadisticas',
  authorize('ADMIN', 'VENDEDOR'),
  ctrl.obtenerEstadisticas
);

router.get('/resumen-periodo',
  authorize('ADMIN', 'VENDEDOR'),
  ctrl.obtenerResumenPeriodo
);

router.get('/siguiente-numero',
  authorize('ADMIN', 'VENDEDOR'),
  ctrl.obtenerSiguienteNumero
);

router.get('/validar-pedido/:pedidoId',
  authorize('ADMIN', 'VENDEDOR'),
  ctrl.validarPedidoFacturable
);

// ✦ Sprint 13 — Pedidos ENTREGADO del cliente sin factura vigente.
//   Debe declararse ANTES de la ruta genérica /:id para que Express
//   no interprete "pedidos-cliente" como un ID numérico.
router.get('/pedidos-cliente/:clienteId',
  authorize('ADMIN', 'VENDEDOR'),
  ctrl.getPedidosParaFacturar
);

// ── Colección ────────────────────────────────────────────────────────────

router.get('/',
  authorize('ADMIN', 'VENDEDOR'),
  ctrl.listarFacturas
);

// Crear factura manual — inactivityGuard (operación financiera crítica)
// validateBody: cliente_nombre e items (min 1) requeridos
router.post('/',
  authorize('ADMIN', 'VENDEDOR'),
  inactivityGuard,
  validateBody(crearFacturaManualSchema),
  ctrl.crearFacturaManual
);

// Crear desde pedido — inactivityGuard
// validateBody: pedidoId requerido y entero positivo
router.post('/desde-pedido',
  authorize('ADMIN', 'VENDEDOR'),
  inactivityGuard,
  validateBody(crearDesdePedidoSchema),
  ctrl.crearFacturaDesdePedido
);

// ── Rutas con parámetro :id ──────────────────────────────────────────────

router.get('/:id/pdf',
  authorize('ADMIN', 'VENDEDOR'),
  ctrl.descargarPDF
);

router.get('/:id',
  authorize('ADMIN', 'VENDEDOR'),
  ctrl.obtenerFactura
);

// Anular — operación irreversible: inactivityGuard + auditarOperacion
// validateBody: motivo requerido (min 10 chars)
router.put('/:id/anular',
  authorize('ADMIN'),
  inactivityGuard,
  auditarOperacion('facturas'),
  validateBody(anularFacturaSchema),
  ctrl.anularFactura
);

// Actualización parcial — validateBody permite campos conocidos
// y deja pasar los desconocidos (passthrough) para no romper el modelo
router.put('/:id',
  authorize('ADMIN'),
  inactivityGuard,
  validateBody(actualizarFacturaSchema),
  ctrl.actualizarFactura
);

module.exports = router;