// src/modules/configuracion/configuracion.controller.js
// Sprint 20 — logger Winston
// Sprint 21 — empresa_id en todos los métodos, logger → src/shared/utils/logger

'use strict';

const Configuracion = require('./configuracion.repository');
const logger        = require('../../shared/utils/logger');

// GET /api/configuracion — todos los pares clave/valor de la empresa
exports.obtenerTodos = async (req, res) => {
  try {
    const datos = await Configuracion.obtenerTodos(req.empresaId);
    return res.json({ success: true, data: datos });
  } catch (err) {
    logger.error('CONFIG_OBTENER_TODOS', { event: 'configuracion.obtenerTodos_error', message: err.message });
    return res.status(500).json({ success: false, message: 'Error al obtener configuración' });
  }
};

// GET /api/configuracion/:clave — valor de una clave específica
exports.obtenerPorClave = async (req, res) => {
  try {
    const { clave } = req.params;
    if (!clave || typeof clave !== 'string')
      return res.status(400).json({ success: false, message: 'Clave inválida' });

    const valor = await Configuracion.obtenerValor(clave.toUpperCase(), req.empresaId);
    if (valor === null)
      return res.status(404).json({ success: false, message: `Clave '${clave}' no encontrada` });

    return res.json({ success: true, data: { clave: clave.toUpperCase(), valor } });
  } catch (err) {
    logger.error('CONFIG_OBTENER_CLAVE', { event: 'configuracion.obtenerPorClave_error', clave: req.params.clave, message: err.message });
    return res.status(500).json({ success: false, message: 'Error al obtener configuración' });
  }
};

// PUT /api/configuracion/:clave — actualiza o crea un par clave/valor; valida rango para IVA
exports.actualizarValor = async (req, res) => {
  try {
    const { clave } = req.params;
    const { valor } = req.body;

    if (!clave || valor === undefined || valor === null)
      return res.status(400).json({ success: false, message: 'Clave y valor son requeridos' });

    if (clave.toUpperCase() === 'IVA') {
      const tasa = Number.parseFloat(valor);
      if (Number.isNaN(tasa) || tasa < 0 || tasa > 1)
        return res.status(400).json({ success: false, message: 'El IVA debe ser un número entre 0 y 1 (ej: 0.15 para 15%)' });
    }

    await Configuracion.guardarValor(clave.toUpperCase(), valor, req.empresaId);

    logger.info('CONFIG_ACTUALIZADO', { event: 'configuracion.actualizado', clave: clave.toUpperCase(), userId: req.user?.id });
    return res.json({ success: true, message: 'Configuración actualizada', data: { clave: clave.toUpperCase(), valor: String(valor) } });
  } catch (err) {
    logger.error('CONFIG_ACTUALIZAR', { event: 'configuracion.actualizarValor_error', clave: req.params.clave, message: err.message });
    return res.status(500).json({ success: false, message: 'Error al actualizar configuración' });
  }
};

// GET /api/configuracion/iva/tasa — devuelve tasa IVA como decimal y porcentaje legible
exports.obtenerTasaIva = async (req, res) => {
  try {
    const tasa = await Configuracion.obtenerTasaIva(req.empresaId);
    return res.json({
      success: true,
      data: { clave: 'IVA', valor: String(tasa), porcentaje: `${(tasa * 100).toFixed(0)}%` },
    });
  } catch (err) {
    logger.error('CONFIG_TASA_IVA', { event: 'configuracion.obtenerTasaIva_error', message: err.message });
    return res.status(500).json({ success: false, message: 'Error al obtener tasa de IVA' });
  }
};
