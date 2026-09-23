// backend/validators/trabajo.validators.js
// Sprint 17 — DT-07 Validación Zod
//
// Schema para POST /agendar de trabajoRoutes.js.
// Este es un endpoint legacy — trabaja con material_id directo
// (distinto del modo recetas de proformaRoutes).

'use strict';

const { z } = require('zod');

// ── Item de pedido legacy ──────────────────────────────────────────────────
const itemPedidoLegacySchema = z.object({
  material_id: z
    .number({ required_error: 'material_id es requerido', invalid_type_error: 'material_id debe ser un número' })
    .int()
    .positive({ message: 'material_id debe ser un entero positivo' }),

  cantidad: z
    .number({ required_error: 'cantidad es requerida', invalid_type_error: 'cantidad debe ser un número' })
    .positive({ message: 'cantidad debe ser mayor a 0' }),

  total: z
    .number({ required_error: 'total es requerido', invalid_type_error: 'total debe ser un número' })
    .nonnegative({ message: 'total no puede ser negativo' }),
});

// ── POST /api/trabajos/agendar ─────────────────────────────────────────────
// Controller lee: cliente, total, fecha_entrega, items
const agendarPedidoTrabajoSchema = z.object({
  total: z
    .number({ required_error: 'El total es requerido', invalid_type_error: 'El total debe ser un número' })
    .positive({ message: 'El total debe ser mayor a 0' }),

  fecha_entrega: z
    .string({ required_error: 'La fecha de entrega es requerida' })
    .min(1, { message: 'La fecha de entrega es requerida' }),

  items: z
    .array(itemPedidoLegacySchema, { required_error: 'Los items son requeridos' })
    .min(1, { message: 'Debe incluir al menos un item' }),

  // cliente es opcional en el controller (solo se usa en la respuesta, no en DB)
  cliente: z.string().trim().max(200).optional(),
});

module.exports = { agendarPedidoTrabajoSchema };