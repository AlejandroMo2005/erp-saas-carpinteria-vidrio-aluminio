// src/shared/validators/pedido.validators.js
// Sprint 17 — POST /api/pedidos, PUT|PATCH /api/pedidos/:id/estado

'use strict';

const { z } = require('zod');

const ESTADOS_VALIDOS = ['PENDIENTE', 'PROCESADO', 'ENTREGADO', 'CANCELADO'];

// POST /api/pedidos — total obligatorio; el resto es opcional
const createPedidoSchema = z.object({
  total: z
    .number({ required_error: 'El total es obligatorio', invalid_type_error: 'El total debe ser un número' })
    .positive({ message: 'El total debe ser mayor a 0' }),
  fecha: z.string().optional().transform((v) => v?.trim() || undefined),
  estado: z
    .enum(ESTADOS_VALIDOS, {
      errorMap: () => ({ message: 'Estado inválido. Use: PENDIENTE, PROCESADO, ENTREGADO o CANCELADO' }),
    })
    .optional(),
  proforma_id:  z.number().int().positive().optional().nullable(),
  observaciones: z.string().max(500).optional().nullable(),
  detalles:     z.array(z.any()).optional(),
});

// PUT|PATCH /api/pedidos/:id/estado — estado en enum, se normaliza a mayúsculas
const updateEstadoSchema = z.object({
  estado: z
    .string({ required_error: 'El campo estado es obligatorio' })
    .trim()
    .toUpperCase()
    .refine((v) => ESTADOS_VALIDOS.includes(v), {
      message: 'Estado inválido. Use: PENDIENTE, PROCESADO, ENTREGADO o CANCELADO',
    }),
});

module.exports = { createPedidoSchema, updateEstadoSchema };