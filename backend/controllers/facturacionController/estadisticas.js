// backend/controllers/facturacionController/estadisticas.js
// Sprint 19 — empresaId a todos los métodos del modelo
'use strict';

const Facturacion = require('../../models/Facturacion');
const { successResponse, errorResponse } = require('./utils');

const defaultFechaDesde = () => new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
const defaultFechaHasta = () => new Date().toISOString().split('T')[0];

exports.obtenerEstadisticas = async (req, res) => {
  try {
    const fechaDesde = req.query.fechaDesde || defaultFechaDesde();
    const fechaHasta = req.query.fechaHasta || defaultFechaHasta();
    const empresaId  = req.empresaId;

    const [[], [estadosRows], [topClientesRows], [mensualRows]] = await Promise.all([
      Facturacion.obtenerResumenFacturacion(fechaDesde, fechaHasta, empresaId),
      Facturacion.obtenerFacturasPorEstado(fechaDesde, fechaHasta, empresaId),
      Facturacion.obtenerTopClientes(fechaDesde, fechaHasta, 10, empresaId),
      Facturacion.obtenerFacturacionMensual(fechaDesde, fechaHasta, empresaId),
    ]);

    return successResponse(res, {
      facturacionMensual:  mensualRows,
      distribucionEstados: estadosRows.map(e => ({ estado: e.estado, cantidad: e.cantidad, total: e.total })),
      topClientes:         topClientesRows,
      periodo:             { desde: fechaDesde, hasta: fechaHasta },
    });
  } catch (error) {
    return errorResponse(res, 'Error al obtener estadísticas', 500, error);
  }
};

exports.obtenerResumenPeriodo = async (req, res) => {
  try {
    const fechaDesde = req.query.fechaDesde || defaultFechaDesde();
    const fechaHasta = req.query.fechaHasta || defaultFechaHasta();
    const empresaId  = req.empresaId;

    const [[resumenRows], [mesAntRows]] = await Promise.all([
      Facturacion.obtenerResumenFacturacion(fechaDesde, fechaHasta, empresaId),
      Facturacion.obtenerResumenMesAnterior(empresaId),
    ]);

    const actual      = resumenRows[0] ?? {};
    const mesAnterior = mesAntRows[0]  ?? {};

    const calcVariacion = (a, b) => {
      const va = parseFloat(a ?? 0);
      const vb = parseFloat(b ?? 0);
      if (!vb) return null;
      return Math.round(((va - vb) / vb) * 100);
    };

    return successResponse(res, {
      totalFacturado:         parseFloat(actual.total_facturado ?? 0),
      totalFacturas:          parseInt(actual.total_facturas    ?? 0),
      ticketPromedio:         parseFloat(actual.ticket_promedio ?? 0),
      clientesUnicos:         parseInt(actual.clientes_unicos   ?? 0),
      variacionVsMesAnterior: calcVariacion(actual.total_facturado, mesAnterior.total_facturado),
      variacionFacturas:      calcVariacion(actual.total_facturas,  mesAnterior.total_facturas),
      periodo: { desde: fechaDesde, hasta: fechaHasta },
    });
  } catch (error) {
    return errorResponse(res, 'Error al obtener resumen', 500, error);
  }
};