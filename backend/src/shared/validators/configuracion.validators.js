// src/shared/validators/configuracion.validators.js
// Sprint 17 — PUT /api/configuracion/:clave

'use strict';

const { z } = require('zod');

// PUT /api/configuracion/:clave — acepta string o número; el controller valida lógica por clave (ej. IVA 0-1)
const actualizarConfigSchema = z.object({
  valor: z.union(
    [
      z.string({ invalid_type_error: 'El valor debe ser un texto o número' })
        .min(1, { message: 'El valor no puede estar vacío' }),
      z.number({ invalid_type_error: 'El valor debe ser un texto o número' }),
    ],
    { required_error: 'El valor es requerido' }
  ),
});

module.exports = { actualizarConfigSchema };