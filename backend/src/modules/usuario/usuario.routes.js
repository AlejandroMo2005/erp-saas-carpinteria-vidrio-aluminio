// src/modules/usuario/usuario.routes.js
// Sprint 10 — Seguridad: separar registro público de creación por admin
// Sprint 11 — trackActivity + inactivityGuard en rutas sensibles
// Sprint 17 — DT-07: validación Zod en POST y PUT con body
// 📦 Sprint 20 — Migrado a src/modules/usuario/
//                middleware   → ../../shared/middleware/{auth,auditLog,activityTracker,validateZod}
//                validators   → ../../shared/validators/usuario.validators
//                controller   → ./usuario.controller

'use strict';

const express = require('express');
const router  = express.Router();

const { protect, authorize }             = require('../../shared/middleware/auth');
const { auditarOperacion }               = require('../../shared/middleware/auditLog');
const { trackActivity, inactivityGuard } = require('../../shared/middleware/activityTracker');
const { validateBody }                   = require('../../shared/middleware/validateZod');
const {
  updateMeSchema,
  createUsuarioSchema,
  updateRolSchema,
  toggleActivoSchema,
} = require('../../shared/validators/usuario.validators');
const {
  getMe, updateMe, buscarClientes,
  getAllUsuarios, createUsuario, updateRol, toggleActivo,
} = require('./usuario.controller');

// ── Perfil propio ─────────────────────────────────────────────────────────
router.get('/me', protect, trackActivity, getMe);

// updateMe: inactivityGuard (puede cambiar contraseña)
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

router.post('/',
  protect,
  authorize('ADMIN'),
  trackActivity,
  inactivityGuard,
  validateBody(createUsuarioSchema),
  createUsuario
);

router.put('/:id/rol',
  protect,
  authorize('ADMIN'),
  trackActivity,
  inactivityGuard,
  validateBody(updateRolSchema),
  updateRol
);

router.put('/:id/activo',
  protect,
  authorize('ADMIN'),
  trackActivity,
  inactivityGuard,
  validateBody(toggleActivoSchema),
  toggleActivo
);

// Soft delete — handler pendiente de implementar
router.delete('/:id',
  protect,
  authorize('ADMIN'),
  trackActivity,
  inactivityGuard,
  auditarOperacion('usuarios'),
  // TODO: conectar deleteUsuario cuando se implemente soft delete de usuario por admin
);

module.exports = router;