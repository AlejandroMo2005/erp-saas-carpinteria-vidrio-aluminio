'use strict';

const { z } = require('zod');

const ESTADOS_VALIDOS = [
  'PENDIENTE',
  'PROCESADO',
  'ENTREGADO',
  'CANCELADO',
];

const mensajeEstadoInvalido =
  'Estado inválido. Use: PENDIENTE, PROCESADO, ENTREGADO o CANCELADO';

const createPedidoSchema = z.object({
  total: z
    .number({
      error: 'El total debe ser un número',
    })
    .positive({
      message: 'El total debe ser mayor a 0',
    }),

  fecha: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined),

  estado: z
    .enum(ESTADOS_VALIDOS, {
      error: mensajeEstadoInvalido,
    })
    .optional(),

  proforma_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),

  observaciones: z
    .string()
    .max(500)
    .optional()
    .nullable(),

  detalles: z
    .array(z.any())
    .optional(),
});

const updateEstadoSchema = z.object({
  estado: z
    .string({
      error: 'El campo estado es obligatorio',
    })
    .trim()
    .toUpperCase()
    .refine(
      (v) => ESTADOS_VALIDOS.includes(v),
      {
        message: mensajeEstadoInvalido,
      }
    ),
});

module.exports = {
  createPedidoSchema,
  updateEstadoSchema,
};
