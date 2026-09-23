// src/shared/validators/material.validators.js
// Sprint 17 — PUT /api/materiales/variante/:id

'use strict';

const { z } = require('zod');

// PUT /api/materiales/variante/:id — stock entero no negativo, precio no negativo
const updateVarianteSchema = z.object({
  stock: z
    .number({ required_error: 'El stock es requerido', invalid_type_error: 'El stock debe ser un número' })
    .int({ message: 'El stock debe ser un número entero' })
    .nonnegative({ message: 'El stock no puede ser negativo' }),
  precio: z
    .number({ required_error: 'El precio es requerido', invalid_type_error: 'El precio debe ser un número' })
    .nonnegative({ message: 'El precio no puede ser negativo' }),
});

module.exports = { updateVarianteSchema };