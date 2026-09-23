// backend/routes/proformas.js
const express = require("express");
const router = express.Router();

// Controlador único y centralizado
const proformaController = require("../controllers/proformaController");

/**
 * POST /proformas/calcular
 * Calcula proforma (modo recetas o legacy)
 */
router.post("/calcular", proformaController.calcularProforma);

/**
 * POST /proformas/agendar
 * Agenda proforma + pedido (modo recetas o legacy)
 */
router.post("/agendar", proformaController.agendarPedido);

/**
 * GET /proformas
 */
router.get("/", proformaController.getAllProformas);

/**
 * GET /proformas/:id
 */
router.get("/:id", proformaController.getProformaById);

/**
 * GET /proformas/buscar?cliente=
 */
router.get("/buscar/cliente", proformaController.searchByCliente);

module.exports = router;
