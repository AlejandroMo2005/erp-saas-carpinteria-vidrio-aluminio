// backend/routes/clienteRoutes.js
// ⭐ Sprint 10 — Seguridad + filtrado por rol
// 🐛 Sprint 13 — GET / con búsqueda (nombre o teléfono) para SelectorCliente
// ✅ Sprint 17 — DT-07: validación Zod en POST y PUT con body
//
// ROLES:
//   GET /          → ADMIN, VENDEDOR — autocomplete por nombre O teléfono
//   GET /buscar    → ADMIN, VENDEDOR — legacy, búsqueda solo por teléfono
//   POST /         → ADMIN, VENDEDOR — crear cliente
//   GET /mis-datos → CLIENTE         — su propio perfil
//   PUT /mis-datos → CLIENTE         — actualizar sus propios campos

const express = require('express');
const router  = express.Router();
const c                      = require('../controllers/clienteController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody }       = require('../middleware/validateZod');
const { crearClienteSchema, updateMisDatosSchema } = require('../validators/cliente.validators');

router.use(protect);

// ── GET /api/clientes?busqueda=XXX&limite=8 ──────────────────────────────
// Sprint 13: usado por SelectorCliente.jsx — busca por nombre O teléfono
router.get('/',
  authorize('ADMIN', 'VENDEDOR'),
  c.listar
);

// ── GET /api/clientes/buscar?telefono=XXX ────────────────────────────────
// Legacy — se mantiene por compatibilidad con Proformas
// IMPORTANTE: debe ir ANTES de /mis-datos para que Express no confunda rutas
router.get('/buscar',
  authorize('ADMIN', 'VENDEDOR'),
  c.buscarPorTelefono
);

// ── Perfil propio del cliente — GET antes de POST para orden correcto ─────
router.get('/mis-datos',
  authorize('CLIENTE'),
  c.getMisDatos
);

// ── PUT /api/clientes/mis-datos ───────────────────────────────────────────
// validateBody: al menos nombre o teléfono requerido
router.put('/mis-datos',
  authorize('CLIENTE'),
  validateBody(updateMisDatosSchema),
  c.updateMisDatos
);

// ── POST /api/clientes ────────────────────────────────────────────────────
// validateBody: nombre y telefono requeridos
router.post('/',
  authorize('ADMIN', 'VENDEDOR'),
  validateBody(crearClienteSchema),
  c.crear
);

module.exports = router;