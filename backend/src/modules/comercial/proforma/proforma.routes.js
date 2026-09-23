// src/modules/comercial/proforma/proforma.routes.js
// 📦 Sprint 20 — Migrado de routes/proformas.js
//                controller → ./proforma.controller
//                Nota: protect + tenantMiddleware se aplican en modules/index.js
//                      filtroRol se aplica en routes/index.js (sin cambios aquí)

'use strict';

const express            = require('express');
const router             = express.Router();
const proformaController = require('./proforma.controller');

// POST /api/proformas/calcular
router.post('/calcular', proformaController.calcularProforma);

// POST /api/proformas/agendar
router.post('/agendar', proformaController.agendarPedido);

// GET /api/proformas
router.get('/', proformaController.getAllProformas);

// GET /api/proformas/buscar/cliente?cliente=texto
// NOTA: debe ir ANTES de /:id para que Express no lo trate como parámetro
router.get('/buscar/cliente', proformaController.searchByCliente);

// GET /api/proformas/:id
router.get('/:id', proformaController.getProformaById);

module.exports = router;