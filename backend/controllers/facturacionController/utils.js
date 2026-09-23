// backend/controllers/facturacionController/utils.js
'use strict';

const logger = require('../../utils/logger');

const successResponse = (res, data, message = 'Operación exitosa', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const errorResponse = (res, message, statusCode = 500, error = null) => {
  logger.error('FACTURACION_ERROR', {
    event:       'facturacion.error',
    message:     error?.message ?? message,
    statusCode,
    httpMessage: message,
  });
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' && error ? error.message : undefined,
  });
};

module.exports = { successResponse, errorResponse };