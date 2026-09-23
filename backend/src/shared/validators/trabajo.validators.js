// src/shared/validators/trabajo.validators.js
// Sprint 17 — POST /api/trabajos/agendar (endpoint legacy)

'use strict';

const { z } = require('zod');

// Ítem de pedido legacy: material directo con cantidad y total precalculado
const itemPedidoLegacySchema = z.object({
  material_id: z
    .number({ required_error: 'material_id es requerido', invalid_type_error: 'material_id debe ser un número' })
    .int()
    .positive(),
  cantidad: z
    .number({ required_error: 'cantidad es requerida', invalid_type_error: 'cantidad debe ser un número' })
    .positive(),
  total: z
    .number({ required_error: 'total es requerido', invalid_type_error: 'total debe ser un número' })
    .nonnegative(),
});

// POST /api/trabajos/agendar — endpoint legacy; preferir POST /api/proformas/agendar
const agendarPedidoTrabajoSchema = z.object({
  total: z
    .number({ required_error: 'El total es requerido', invalid_type_error: 'El total debe ser un número' })
    .positive(),
  fecha_entrega: z
    .string({ required_error: 'La fecha de entrega es requerida' })
    .min(1),
  items:   z.array(itemPedidoLegacySchema, { required_error: 'Los items son requeridos' }).min(1),
  cliente: z.string().trim().max(200).optional(),
});

module.exports = { agendarPedidoTrabajoSchema };