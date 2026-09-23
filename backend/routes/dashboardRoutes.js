// backend/routes/dashboardRoutes.js
// 🔧 Sprint 11 — trackActivity

const express = require('express');
const router  = express.Router();
const { protect, authorize }         = require('../middleware/auth');
const { trackActivity }              = require('../middleware/activityTracker');
const {
  getResumen, getIngresos, getPedidosRecientes, getUsuariosIngresos,
  getTopProductos, getMaterialesVariantes, getTrabajoStats, getEstados,
} = require('../controllers/dashboardController');

// Dashboard es solo lectura → no necesita inactivityGuard
// trackActivity registra que el admin está activo consultando métricas
router.use(protect, authorize('ADMIN'), trackActivity);

router.get('/resumen',              getResumen);
router.get('/ingresos',             getIngresos);
router.get('/pedidos-recientes',    getPedidosRecientes);
router.get('/usuarios-ingresos',    getUsuariosIngresos);
router.get('/top-productos',        getTopProductos);
router.get('/materiales-variantes', getMaterialesVariantes);
router.get('/trabajos-stats',       getTrabajoStats);
router.get('/estados',              getEstados);

module.exports = router;