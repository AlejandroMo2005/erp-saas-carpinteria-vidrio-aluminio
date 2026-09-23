// backend/controllers/proformaController/index.js
// Barrel — importar desde "../controllers/proformaController" sin cambiar las rutas.

'use strict';

const { getAllProformas, searchByCliente, getProformaById } = require('./getProformas');
const { calcularProforma } = require('./calcularProforma');
const { agendarPedido }    = require('./agendarPedido');

module.exports = {
  getAllProformas,
  searchByCliente,
  getProformaById,
  calcularProforma,
  agendarPedido,
};