// src/modules/comercial/facturacion/facturacion.routes.js
// Sprint 11 — trackActivity + inactivityGuard + auditarOperacion en anular
// Sprint 13 — GET /pedidos-cliente/:clienteId
// Sprint 17 — DT-07: validación Zod en POST y PUT con body
// 📦 Sprint 20 — Migrado a src/modules/comercial/facturacion/
//                controller → ./facturacion.controller
//                middleware → ../../../shared/middleware/{auth,auditLog,activityTracker,validateZod}
//                validators → ../../../shared/validators/facturacion.validators

'use strict';

const express = require('express');
const router  = express.Router();
const ctrl                               = require('./facturacion.controller');
const { protect, authorize }             = require('../../../shared/middleware/auth');
const { auditarOperacion }               = require('../../../shared/middleware/auditLog');
const { trackActivity, inactivityGuard } = require('../../../shared/middleware/activityTracker');
const { validateBody }                   = require('../../../shared/middleware/validateZod');
const {
  crearFacturaManualSchema,
  crearDesdePedidoSchema,
  actualizarFacturaSchema,
  anularFacturaSchema,
} = require('../../../shared/validators/facturacion.validators');

// protect + trackActivity en todas las rutas
router.use(protect, trackActivity);

// ── Rutas estáticas (deben ir ANTES de /:id) ─────────────────────────────

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

// Sprint 13 — ANTES de /:id para que Express no interprete "pedidos-cliente" como ID
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
router.post('/',
  authorize('ADMIN', 'VENDEDOR'),
  inactivityGuard,
  validateBody(crearFacturaManualSchema),
  ctrl.crearFacturaManual
);

// Crear desde pedido — inactivityGuard
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

// Anular — irreversible: inactivityGuard + auditarOperacion
router.put('/:id/anular',
  authorize('ADMIN'),
  inactivityGuard,
  auditarOperacion('facturas'),
  validateBody(anularFacturaSchema),
  ctrl.anularFactura
);

// Actualización parcial
router.put('/:id',
  authorize('ADMIN'),
  inactivityGuard,
  validateBody(actualizarFacturaSchema),
  ctrl.actualizarFactura
);

module.exports = router;