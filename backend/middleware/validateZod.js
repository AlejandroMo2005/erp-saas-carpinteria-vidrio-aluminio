// backend/middleware/validateZod.js
// Sprint 17 — DT-07 Validación Zod
//
// Middleware genérico que recibe un schema Zod y valida req.body.
// Si falla → 400 con lista de errores legibles, sin tocar el controller.
// Si pasa  → next() con req.body reemplazado por el valor parseado
//            (Zod hace coerción y strip de campos extra automáticamente).

'use strict';

const logger       = require('../utils/logger');

/**
 * @param {import('zod').ZodTypeAny} schema
 * @returns {import('express').RequestHandler}
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Formatear errores de Zod en mensajes legibles
      const errors = result.error.errors.map((e) => ({
        campo:   e.path.join('.') || 'body',
        mensaje: e.message,
      }));

      logger.warn('ZOD_VALIDATION_FAIL', {
        event:  'validation.body_fail',
        path:   req.path,
        method: req.method,
        errors,
      });

      return res.status(400).json({
        success: false,
        message: errors[0].mensaje,   // primer error como mensaje principal
        errors,                        // lista completa para el cliente
      });
    }

    // Reemplazar req.body con el valor parseado y saneado por Zod
    req.body = result.data;
    return next();
  };
}

module.exports = { validateBody };