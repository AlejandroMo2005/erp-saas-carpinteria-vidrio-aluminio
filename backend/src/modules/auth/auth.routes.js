// src/modules/auth/auth.routes.js
// ⭐ Sprint 10 — Security Hardening
// ✅ Sprint 17 — DT-07: validación Zod en todas las rutas POST con body
// 📦 Sprint 20 — Migrado a src/modules/auth/
//                controller  → ./auth.controller
//                middleware  → ../../shared/middleware/{auth,security,validateZod}
//                validators  → ../../shared/validators/auth.validators

'use strict';

const express        = require('express');
const router         = express.Router();
const authController = require('./auth.controller');
const { protect }    = require('../../shared/middleware/auth');
const { authLimiter, timingNormalize } = require('../../shared/middleware/security');
const { validateBody }                 = require('../../shared/middleware/validateZod');
const {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
} = require('../../shared/validators/auth.validators');

// ── Aplicar rate limit estricto a TODAS las rutas de este router ──────────
// 10 req/min por IP — protege contra fuerza bruta en login y reset
router.use(authLimiter);

// ─────────────────────────────────────────────────────────────────────────
// GET /api/auth  — Info del módulo
// ─────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth module activo',
    endpoints: {
      login:          'POST /api/auth/login',
      register:       'POST /api/auth/register',
      refresh:        'POST /api/auth/refresh',
      logout:         'POST /api/auth/logout',
      forgotPassword: 'POST /api/auth/forgot-password',
      verifyCode:     'POST /api/auth/verify-code',
      resetPassword:  'POST /api/auth/reset-password',
      profile:        'GET  /api/auth/profile',
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// timingNormalize(300): respuesta mínima de 300ms (anti-timing attack)
// ─────────────────────────────────────────────────────────────────────────
router.post('/login',
  timingNormalize(300),
  validateBody(loginSchema),
  authController.login
);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────
router.post('/register',
  validateBody(registerSchema),
  authController.register
);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// No tiene body validable — lee refreshToken desde cookie httpOnly
// ─────────────────────────────────────────────────────────────────────────
router.post('/refresh', authController.refresh);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────
router.post('/logout', protect, authController.logout);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// timingNormalize(300): respuesta siempre igual en tiempo
// ─────────────────────────────────────────────────────────────────────────
router.post('/forgot-password',
  timingNormalize(300),
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-code
// ─────────────────────────────────────────────────────────────────────────
router.post('/verify-code',
  validateBody(verifyCodeSchema),
  authController.verifyResetCode
);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────
router.post('/reset-password',
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// ─────────────────────────────────────────────────────────────────────────
// GET /api/auth/profile — Ruta protegida
// ─────────────────────────────────────────────────────────────────────────
router.get('/profile', protect, authController.getProfile);

module.exports = router;