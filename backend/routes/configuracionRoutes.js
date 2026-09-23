// backend/routes/configuracionRoutes.js
// ✅ Sprint 17 — DT-07: validación Zod en PUT /:clave

const express                = require('express');
const router                 = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateBody }       = require('../middleware/validateZod');
const { actualizarConfigSchema } = require('../validators/configuracion.validators');
const {
  obtenerTodos,
  obtenerPorClave,
  actualizarValor,
  obtenerTasaIva,
} = require('../controllers/configuracionController');

// ─────────────────────────────────────────────────────────────────────────
// IMPORTANTE: la ruta estática /iva/tasa debe ir ANTES de /:clave
// o Express la interceptaría como si "tasa" fuera el parámetro :clave
// ─────────────────────────────────────────────────────────────────────────

// GET /api/configuracion/iva/tasa  → sin auth, lo consume el frontend
router.get('/iva/tasa', obtenerTasaIva);

// GET /api/configuracion
router.get('/', protect, authorize('ADMIN', 'VENDEDOR'), obtenerTodos);

// GET /api/configuracion/:clave
router.get('/:clave', protect, authorize('ADMIN', 'VENDEDOR'), obtenerPorClave);

// PUT /api/configuracion/:clave  → solo ADMIN
// validateBody: valor requerido (string o número)
// La validación específica por clave (ej: IVA entre 0 y 1) la sigue
// haciendo el controller, que conoce la lógica de negocio de cada clave.
router.put('/:clave',
  protect,
  authorize('ADMIN'),
  validateBody(actualizarConfigSchema),
  actualizarValor
);

module.exports = router;