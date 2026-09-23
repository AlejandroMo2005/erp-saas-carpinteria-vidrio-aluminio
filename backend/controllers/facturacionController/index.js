// backend/controllers/facturacionController/index.js
'use strict';

const { listarFacturas, obtenerFactura, obtenerSiguienteNumero,
        validarPedidoFacturable, getPedidosParaFacturar } = require('./getFacturas');
const { obtenerEstadisticas, obtenerResumenPeriodo }      = require('./estadisticas');
const { crearFacturaManual, crearFacturaDesdePedido }     = require('./crearFactura');
const { actualizarFactura, anularFactura, descargarPDF }  = require('./mutarFactura');

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