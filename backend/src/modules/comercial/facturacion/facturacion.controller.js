// src/modules/comercial/facturacion/facturacion.controller.js
// 📦 Sprint 20 — Barrel del módulo facturacion
//                Equivalente al anterior controllers/facturacionController/index.js

'use strict';

const { listarFacturas, obtenerFactura, obtenerSiguienteNumero,
        validarPedidoFacturable, getPedidosParaFacturar } = require('./handlers/getFacturas');
const { obtenerEstadisticas, obtenerResumenPeriodo }      = require('./handlers/estadisticas');
const { crearFacturaManual, crearFacturaDesdePedido }     = require('./handlers/crearFactura');
const { actualizarFactura, anularFactura, descargarPDF }  = require('./handlers/mutarFactura');

module.exports = {
  listarFacturas,
  obtenerFactura,
  obtenerSiguienteNumero,
  validarPedidoFacturable,
  getPedidosParaFacturar,
  obtenerEstadisticas,
  obtenerResumenPeriodo,
  crearFacturaManual,
  crearFacturaDesdePedido,
  actualizarFactura,
  anularFactura,
  descargarPDF,
};