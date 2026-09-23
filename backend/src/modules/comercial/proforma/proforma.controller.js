// src/modules/comercial/proforma/proforma.controller.js
// 📦 Sprint 20 — Barrel del módulo proforma
//                Equivalente al anterior controllers/proformaController.js (monolítico)
//                Handlers descompuestos en ./handlers/

'use strict';

const { getAllProformas, searchByCliente, getProformaById } = require('./handlers/getProformas');
const { calcularProforma }                                   = require('./handlers/calcularProforma');
const { agendarPedido }                                      = require('./handlers/agendarPedido');

module.exports = {
  getAllProformas,
  searchByCliente,
  getProformaById,
  calcularProforma,
  agendarPedido,
};