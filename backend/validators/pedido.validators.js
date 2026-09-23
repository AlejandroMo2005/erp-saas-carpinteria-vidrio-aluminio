// backend/validators/pedido.validators.js
// Sprint 17 — DT-07 Validación Zod
//
// Schemas para las rutas POST/PUT/PATCH de pedidoRoutes.js.
// Los campos coinciden exactamente con lo que lee pedidoController.js.

'use strict';

const { z } = require('zod');

// Estados válidos — misma lista que ESTADOS_VALIDOS en el controller
const ESTADOS_VALIDOS = ['PENDIENTE', 'PROCESADO', 'ENTREGADO', 'CANCELADO'];

// ── POST /api/pedidos ──────────────────────────────────────────────────────
// Controller lee: fecha, estado, total, proforma_id, observaciones, detalles
const createPedidoSchema = z.object({
  total: z
    .number({ required_error: 'El total es obligatorio', invalid_type_error: 'El total debe ser un número' })
    .positive({ message: 'El total debe ser mayor a 0' }),

  fecha: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined),

  estado: z
    .enum(ESTADOS_VALIDOS, {
      errorMap: () => ({ message: 'Estado inválido. Use: PENDIENTE, PROCESADO, ENTREGADO o CANCELADO' }),
    })
    .optional(),

  proforma_id: z
    .number({ invalid_type_error: 'proforma_id debe ser un número entero' })
    .int()
    .positive()
    .optional()
    .nullable(),

  observaciones: z
    .string()
    .max(500, { message: 'Las observaciones no pueden superar 500 caracteres' })
    .optional()
    .nullable(),

  detalles: z
    .array(z.any())
    .optional(),
});

// ── PUT|PATCH /api/pedidos/:id/estado ─────────────────────────────────────
// Controller lee: estado (del body, lo convierte a .toUpperCase() después)
const updateEstadoSchema = z.object({
  estado: z
    .string({ required_error: 'El campo estado es obligatorio' })
    .trim()
    .toUpperCase()
    .refine((v) => ESTADOS_VALIDOS.includes(v), {
      message: 'Estado inválido. Use: PENDIENTE, PROCESADO, ENTREGADO o CANCELADO',
    }),
});

module.exports = {
  createPedidoSchema,
  updateEstadoSchema,
};