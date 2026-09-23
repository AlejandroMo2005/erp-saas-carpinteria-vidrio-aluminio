// backend/routes/usuarioRoutes.js
// ⭐ Sprint 10 — Seguridad: separar registro público de creación por admin
// 🔧 Sprint 11 — trackActivity + inactivityGuard en rutas sensibles
// ✅ Sprint 17 — DT-07: validación Zod en POST y PUT con body

const express = require('express');
const router  = express.Router();
const { protect, authorize }             = require('../middleware/auth');
const { auditarOperacion }               = require('../middleware/auditLog');
const { trackActivity, inactivityGuard } = require('../middleware/activityTracker');
const { validateBody }                   = require('../middleware/validateZod');
const {
  updateMeSchema,
  createUsuarioSchema,
  updateRolSchema,
  toggleActivoSchema,
} = require('../validators/usuario.validators');
const {
  getMe, updateMe, buscarClientes,
  getAllUsuarios, createUsuario, updateRol, toggleActivo,
} = require('../controllers/usuarioController');

// ── Perfil propio ─────────────────────────────────────────────────────────
router.get('/me', protect, trackActivity, getMe);

// updateMe: inactivityGuard (puede cambiar contraseña)
// validateBody: password min 6, passwordActual requerido si viene password,
//               email con formato válido, cedula_ruc 10/13 dígitos
router.put('/me',
  protect,
  trackActivity,
  inactivityGuard,
  validateBody(updateMeSchema),
  updateMe
);

// ── Búsqueda de clientes ──────────────────────────────────────────────────
router.get('/buscar',
  protect,
  authorize('ADMIN', 'VENDEDOR'),
  trackActivity,
  buscarClientes
);

// ── Administración — solo ADMIN ───────────────────────────────────────────
router.get('/',
  protect,
  authorize('ADMIN'),
  trackActivity,
  getAllUsuarios
);

// validateBody: nombre, email, password (min 6) y rol requeridos
router.post('/',
  protect,
  authorize('ADMIN'),
  trackActivity,
  inactivityGuard,
  validateBody(createUsuarioSchema),
  createUsuario
);

// validateBody: rol requerido y en enum válido
router.put('/:id/rol',
  protect,
  authorize('ADMIN'),
  trackActivity,
  inactivityGuard,
  validateBody(updateRolSchema),
  updateRol
);

// validateBody: activo requerido como boolean
router.put('/:id/activo',
  protect,
  authorize('ADMIN'),
  trackActivity,
  inactivityGuard,
  validateBody(toggleActivoSchema),
  toggleActivo
);

router.delete('/:id',
  protect,
  authorize('ADMIN'),
  trackActivity,
  inactivityGuard,
  auditarOperacion('usuarios'),
  // deleteUsuario — conectar cuando se implemente soft delete de usuario por admin
);

module.exports = router;