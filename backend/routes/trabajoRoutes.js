// backend/routes/trabajoRoutes.js
// ✅ Sprint 17 — DT-07: validación Zod en POST /agendar
//
// NOTA: POST /agendar es un endpoint legacy que inserta directamente
// en pedidos + pedido_detalle con usuario_id hardcodeado.
// La ruta recomendada para nuevos desarrollos es POST /api/proformas/agendar.

const express = require('express');
const router  = express.Router();
const trabajoController      = require('../controllers/trabajoController');
const { validateBody }       = require('../middleware/validateZod');
const { agendarPedidoTrabajoSchema } = require('../validators/trabajo.validators');

// Rutas GET — sin body, no necesitan validateBody
router.get('/',         trabajoController.getTrabajos);
router.get('/colores',  trabajoController.getColores);

// POST /agendar — legacy
// validateBody: total, fecha_entrega e items (min 1) requeridos
router.post('/agendar',
  validateBody(agendarPedidoTrabajoSchema),
  trabajoController.agendarPedido
);

// GET /:id/recetas — sin body
router.get('/:id/recetas', trabajoController.getRecetasPorTrabajo);

module.exports = router;