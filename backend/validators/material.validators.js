// backend/validators/material.validators.js
// Sprint 17 — DT-07 Validación Zod
//
// Schema para PUT /variante/:id de materialRoutes.js.
// Controller lee: stock, precio

'use strict';

const { z } = require('zod');

// ── PUT /api/materiales/variante/:id ──────────────────────────────────────
// Controller lee: stock (requerido), precio (requerido)
// Material.updateVarianteInfo(id, stock, precio) — ambos son numéricos
const updateVarianteSchema = z.object({
  stock: z
    .number({
      required_error:    'El stock es requerido',
      invalid_type_error: 'El stock debe ser un número',
    })
    .int({ message: 'El stock debe ser un número entero' })
    .nonnegative({ message: 'El stock no puede ser negativo' }),

  precio: z
    .number({
      required_error:    'El precio es requerido',
      invalid_type_error: 'El precio debe ser un número',
    })
    .nonnegative({ message: 'El precio no puede ser negativo' }),
});

module.exports = { updateVarianteSchema };