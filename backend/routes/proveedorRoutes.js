// backend/routes/proveedorRoutes.js
// ⭐ Sprint 10 — authorize por rol
// 🔧 Sprint 11 — trackActivity + inactivityGuard en escritura
// ✅ Sprint 17 — DT-07: validación Zod en POST y PUT con body

const express = require('express');
const router  = express.Router();
const ctrl                               = require('../controllers/proveedorController');
const { protect, authorize }             = require('../middleware/auth');
const { auditarOperacion }               = require('../middleware/auditLog');
const { trackActivity, inactivityGuard } = require('../middleware/activityTracker');
const { validateBody }                   = require('../middleware/validateZod');
const {
  crearProveedorSchema,
  actualizarProveedorSchema,
  generarSolicitudSchema,
} = require('../validators/proveedor.validators');

// protect + trackActivity en todas las rutas
router.use(protect, trackActivity);

// ── Lectura ────────────────────────────────────────────────────────────────
router.get('/materiales',
  authorize('ADMIN', 'ALMACEN'),
  ctrl.getMateriales
);

router.get('/alertas/stock',
  authorize('ADMIN', 'ALMACEN'),
  ctrl.alertasStock
);

router.get('/solicitudes/historial',
  authorize('ADMIN', 'ALMACEN'),
  ctrl.historialSolicitudes
);

router.get('/',    authorize('ADMIN', 'ALMACEN'), ctrl.listar);
router.get('/:id', authorize('ADMIN', 'ALMACEN'), ctrl.obtener);

// ── Escritura — inactivityGuard ────────────────────────────────────────────

// validateBody: proveedor_id e items (min 1) requeridos,
//               cada item con nombre_material y cantidad
router.post('/solicitudes/generar',
  authorize('ADMIN', 'ALMACEN'),
  inactivityGuard,
  validateBody(generarSolicitudSchema),
  ctrl.generarSolicitud
);

// marcarEnviada: PATCH sin body relevante — no necesita validateBody
router.patch('/solicitudes/:id/enviada',
  authorize('ADMIN', 'ALMACEN'),
  ctrl.marcarEnviada
);

// validateBody: nombre requerido, resto opcional
router.post('/',
  authorize('ADMIN', 'ALMACEN'),
  inactivityGuard,
  validateBody(crearProveedorSchema),
  ctrl.crear
);

// validateBody: nombre requerido, resto opcional
router.put('/:id',
  authorize('ADMIN', 'ALMACEN'),
  inactivityGuard,
  validateBody(actualizarProveedorSchema),
  ctrl.actualizar
);

// ── Eliminar — solo ADMIN ──────────────────────────────────────────────────
router.delete('/:id',
  authorize('ADMIN'),
  inactivityGuard,
  auditarOperacion('proveedores'),
  ctrl.eliminar
);

module.exports = router;