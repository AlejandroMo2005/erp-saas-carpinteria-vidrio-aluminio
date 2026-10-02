// src/shared/middleware/errorHandler.js
// 📦 Sprint 20 — Movido de middleware/errorHandler.js
'use strict';

const logger = require('../utils/logger');

const ERROR_STATUS_MAP = { 'ER_DUP_ENTRY':409,'ER_NO_REFERENCED_ROW':400,'ER_ROW_IS_REFERENCED':409,'ER_DATA_TOO_LONG':400,'JsonWebTokenError':401,'TokenExpiredError':401,'NotBeforeError':401,'ValidationError':422,'CastError':400 };
const MENSAJES_PUBLICOS = { 400:'Datos inválidos en la solicitud.',401:'No autorizado. Verifica tu sesión.',403:'No tienes permisos para esta acción.',404:'Recurso no encontrado.',409:'Conflicto: ya existe un registro similar.',422:'Los datos enviados no son procesables.',429:'Demasiadas peticiones. Intenta en un momento.',500:'Error interno del servidor. Intenta más tarde.' };
const esProd = () => process.env.NODE_ENV === 'production';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || ERROR_STATUS_MAP[err.code] || ERROR_STATUS_MAP[err.name] || 500;
  const logCtx = { status, method: req.method, path: req.path, ip: req.ip, userId: req.user?.id||null, userRol: req.user?.rol||null, errorCode: err.code||null, errorName: err.name||null };
  if (status >= 500) logger.error(err.message||'Error interno', { ...logCtx, stack: err.stack });
  else if (status >= 400) logger.warn(err.message||'Error del cliente', logCtx);
  const mensaje = esProd() ? (MENSAJES_PUBLICOS[status]||MENSAJES_PUBLICOS[500]) : (err.message||MENSAJES_PUBLICOS[status]);
  const body = { success: false, message: mensaje, ...(esProd() ? {} : { error: err.message, code: err.code||err.name }) };
  if (res.headersSent) return;
  res.status(status).json(body);
};

function notFoundHandler(req, res, next) {
  const err = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  return next(err);
}

module.exports = { errorHandler, notFoundHandler };