// src/modules/inventario/proveedor/proveedor.routes.js
// Sprint 10 — authorize por rol
// Sprint 11 — trackActivity + inactivityGuard en escritura
// Sprint 17 — DT-07: validación Zod en POST y PUT
// 📦 Sprint 20 — Migrado a src/modules/inventario/proveedor/

'use strict';

const express = require('express');
const router  = express.Router();
const ctrl                               = require('./proveedor.controller');
const { protect, authorize }             = require('../../../shared/middleware/auth');
const { auditarOperacion }               = require('../../../shared/middleware/auditLog');
const { trackActivity, inactivityGuard } = require('../../../shared/middleware/activityTracker');
const { validateBody }                   = require('../../../shared/middleware/validateZod');
const {
  crearProveedorSchema,
  actualizarProveedorSchema,
  generarSolicitudSchema,
} = require('../../../shared/validators/proveedor.validators');

router.use(protect, trackActivity);

router.get('/materiales',          authorize('ADMIN', 'ALMACEN'), ctrl.getMateriales);
router.get('/alertas/stock',       authorize('ADMIN', 'ALMACEN'), ctrl.alertasStock);
router.get('/solicitudes/historial', authorize('ADMIN', 'ALMACEN'), ctrl.historialSolicitudes);
router.get('/',    authorize('ADMIN', 'ALMACEN'), ctrl.listar);
router.get('/:id', authorize('ADMIN', 'ALMACEN'), ctrl.obtener);

router.post('/solicitudes/generar',
  authorize('ADMIN', 'ALMACEN'),
  inactivityGuard,
  validateBody(generarSolicitudSchema),
  ctrl.generarSolicitud
);
router.patch('/solicitudes/:id/enviada',
  authorize('ADMIN', 'ALMACEN'),
  ctrl.marcarEnviada
);
router.post('/',
  authorize('ADMIN', 'ALMACEN'),
  inactivityGuard,
  validateBody(crearProveedorSchema),
  ctrl.crear
);
router.put('/:id',
  authorize('ADMIN', 'ALMACEN'),
  inactivityGuard,
  validateBody(actualizarProveedorSchema),
  ctrl.actualizar
);
router.delete('/:id',
  authorize('ADMIN'),
  inactivityGuard,
  auditarOperacion('proveedores'),
  ctrl.eliminar
);

module.exports = router;