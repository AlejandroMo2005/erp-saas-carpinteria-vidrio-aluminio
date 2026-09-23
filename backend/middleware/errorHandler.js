// backend/middleware/errorHandler.js
// ⭐ Sprint 11 — Error handler centralizado
//
// Debe ser el ÚLTIMO middleware registrado en app.js / server.js:
//   app.use(errorHandler);
//
// Captura todos los errores que lleguen via next(err) o throws no capturados.

const logger = require('../utils/logger');

// ── Mapa de errores conocidos → HTTP status ──────────────────────────────
const ERROR_STATUS_MAP = {
  // MySQL
  'ER_DUP_ENTRY':          409,
  'ER_NO_REFERENCED_ROW':  400,
  'ER_ROW_IS_REFERENCED':  409,
  'ER_DATA_TOO_LONG':      400,
  // JWT
  'JsonWebTokenError':     401,
  'TokenExpiredError':     401,
  'NotBeforeError':        401,
  // Validación
  'ValidationError':       422,
  'CastError':             400,
};

// ── Mensajes públicos seguros (no revelar stack en producción) ───────────
const MENSAJES_PUBLICOS = {
  400: 'Datos inválidos en la solicitud.',
  401: 'No autorizado. Verifica tu sesión.',
  403: 'No tienes permisos para esta acción.',
  404: 'Recurso no encontrado.',
  409: 'Conflicto: ya existe un registro similar.',
  422: 'Los datos enviados no son procesables.',
  429: 'Demasiadas peticiones. Intenta en un momento.',
  500: 'Error interno del servidor. Intenta más tarde.',
};

const esProd = process.env.NODE_ENV === 'production';

/**
 * Middleware de errores centralizado.
 * Firma de 4 parámetros requerida por Express.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // ── Determinar status ────────────────────────────────────────────────
  const status =
    err.status ||
    err.statusCode ||
    ERROR_STATUS_MAP[err.code] ||
    ERROR_STATUS_MAP[err.name] ||
    500;

  // ── Logging estructurado ─────────────────────────────────────────────
  const logCtx = {
    status,
    method:    req.method,
    path:      req.path,
    ip:        req.ip,
    userId:    req.user?.id    || null,
    userRol:   req.user?.rol   || null,
    errorCode: err.code        || null,
    errorName: err.name        || null,
  };

  if (status >= 500) {
    logger.error(err.message || 'Error interno', { ...logCtx, stack: err.stack });
  } else if (status >= 400) {
    logger.warn(err.message || 'Error del cliente', logCtx);
  }

  // ── Respuesta al cliente ─────────────────────────────────────────────
  const mensaje = esProd
    ? (MENSAJES_PUBLICOS[status] || MENSAJES_PUBLICOS[500])
    : (err.message || MENSAJES_PUBLICOS[status]);

  // No revelar stack en producción
  const body = {
    success: false,
    message: mensaje,
    ...(esProd ? {} : {
      error: err.message,
      code:  err.code || err.name,
    })
  };

  // Evitar enviar respuesta si ya fue enviada
  if (res.headersSent) return;

  res.status(status).json(body);
};

/**
 * Middleware para capturar rutas no encontradas (404).
 * Registrar ANTES de errorHandler en app.js.
 */
const notFoundHandler = (req, res, next) => {
  const err = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

module.exports = { errorHandler, notFoundHandler };