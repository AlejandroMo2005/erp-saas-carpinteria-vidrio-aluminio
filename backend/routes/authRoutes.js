// backend/routes/authRoutes.js
// ⭐ Sprint 10 — Security Hardening
// Cambios vs versión anterior:
//   • authLimiter (10 req/min) en todas las rutas de auth
//   • timingNormalize(300ms) en login y forgot-password (anti-timing attack)
//   • Nuevas rutas: POST /refresh, POST /logout
// 🍪 Sprint 12.5 — Sin cambios en rutas. Los cambios de cookie están en
//                  authController.js (login/refresh/logout/register)
// ✅ Sprint 17   — DT-07: validación Zod en todas las rutas POST con body

const express    = require('express');
const router     = express.Router();
const authController = require('../controllers/authController');
const { protect }    = require('../middleware/auth');
const { authLimiter, timingNormalize } = require('../middleware/security');
const { validateBody }                 = require('../middleware/validateZod');
const {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
} = require('../validators/auth.validators');

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
      login:         'POST /api/auth/login',
      register:      'POST /api/auth/register',
      refresh:       'POST /api/auth/refresh',
      logout:        'POST /api/auth/logout',
      forgotPassword:'POST /api/auth/forgot-password',
      verifyCode:    'POST /api/auth/verify-code',
      resetPassword: 'POST /api/auth/reset-password',
      profile:       'GET  /api/auth/profile'
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// timingNormalize(300): respuesta mínima de 300ms (anti-timing attack)
// validateBody: email requerido y con formato válido, password requerido
// ─────────────────────────────────────────────────────────────────────────
router.post('/login',
  timingNormalize(300),
  validateBody(loginSchema),
  authController.login
);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// validateBody: nombre, email y password (min 6) requeridos
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
// No tiene body validable — lee refreshToken desde cookie httpOnly
// ─────────────────────────────────────────────────────────────────────────
router.post('/logout', protect, authController.logout);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// timingNormalize(300): respuesta siempre igual en tiempo
// validateBody: email requerido y con formato válido
// ─────────────────────────────────────────────────────────────────────────
router.post('/forgot-password',
  timingNormalize(300),
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-code
// validateBody: token y code requeridos
// ─────────────────────────────────────────────────────────────────────────
router.post('/verify-code',
  validateBody(verifyCodeSchema),
  authController.verifyResetCode
);

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// validateBody: token, code y newPassword (min 6) requeridos
// ─────────────────────────────────────────────────────────────────────────
router.post('/reset-password',
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// ─────────────────────────────────────────────────────────────────────────
// GET /api/auth/profile  — Ruta protegida
// ─────────────────────────────────────────────────────────────────────────
router.get('/profile', protect, authController.getProfile);

module.exports = router;