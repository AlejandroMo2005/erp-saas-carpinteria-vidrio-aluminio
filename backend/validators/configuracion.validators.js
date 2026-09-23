// backend/validators/configuracion.validators.js
// Sprint 17 — DT-07 Validación Zod
//
// Schema para la ruta PUT /:clave de configuracionRoutes.js.
// El controller valida adicionalmente la lógica de IVA (0-1),
// pero Zod garantiza que el campo valor siempre llegue presente.

'use strict';

const { z } = require('zod');

// ── PUT /api/configuracion/:clave ──────────────────────────────────────────
// Controller lee: valor (requerido, no puede ser null ni undefined)
//
// El valor se almacena como string en DB pero puede llegar como número
// (ej: 0.15 para IVA). Zod acepta string o number y lo deja pasar tal cual
// para que el controller aplique su validación específica por clave.
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

module.exports = {
  actualizarConfigSchema,
};