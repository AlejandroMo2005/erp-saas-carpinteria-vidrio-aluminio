// src/modules/comercial/proforma/handlers/calcularProforma.js
// Sprint 20 — Extraído de controllers/proformaController.js
//                Lógica de negocio delegada a ../proforma.service

'use strict';

const database = require('../../../../config/database.js');
const logger   = require('../../../../shared/utils/logger');
const {
  isRecipeItems,
  calcularPorRecetas,
  buildWhatsAppText,
} = require('../proforma.service');

// POST /api/proformas/calcular
exports.calcularProforma = async (req, res) => {
  const connection = await database.getConnection();

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe enviar al menos 1 item para calcular',
      });
    }

    if (!isRecipeItems(items)) {
      return res.status(400).json({
        success: false,
        message: 'Payload invalido: cada item debe incluir trabajo_id',
      });
    }

    if (!calcularPorRecetas || !buildWhatsAppText) {
      return res.status(500).json({
        success: false,
        message: 'Calculador de proformas no disponible',
      });
    }

    const calc = await calcularPorRecetas(connection, req.body, req.empresaId);
    const whatsapp_text = buildWhatsAppText(calc);

    return res.status(200).json({
      success: true,
      data: { ...calc, whatsapp_text },
    });
  } catch (error) {
    logger.error('PROFORMA_CALCULAR', {
      event: 'proforma.calcular_error',
      message: error.message,
      userId: req.user?.id,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    connection.release();
  }
};
