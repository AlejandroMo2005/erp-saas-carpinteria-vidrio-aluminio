// src/shared/middleware/validateZod.js
// 📦 Sprint 20 — Movido de middleware/validateZod.js
'use strict';

const { ZodError } = require('zod');
const logger       = require('../../../utils/logger');

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({ campo: e.path.join('.')||'body', mensaje: e.message }));
      logger.warn('ZOD_VALIDATION_FAIL', { event: 'validation.body_fail', path: req.path, method: req.method, errors });
      return res.status(400).json({ success: false, message: errors[0].mensaje, errors });
    }
    req.body = result.data;
    return next();
  };
}

module.exports = { validateBody };