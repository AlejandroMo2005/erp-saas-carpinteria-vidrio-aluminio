'use strict';

const { z } = require('zod');

const itemRecetaSchema = z.object({
  trabajo_id: z
    .number({
      required_error: 'trabajo_id es requerido',
      invalid_type_error: 'trabajo_id debe ser un número',
    })
    .int()
    .positive(),

  color_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),

  ancho: z
    .number()
    .positive()
    .optional(),

  alto: z
    .number()
    .positive()
    .optional(),

  cantidad: z
    .number()
    .positive()
    .optional(),

  detalle: z
    .string()
    .max(500)
    .optional()
    .nullable(),
});

const itemLegacySchema = z.object({
  material_id: z
    .number({
      required_error: 'material_id es requerido',
      invalid_type_error: 'material_id debe ser un número',
    })
    .int()
    .positive(),

  cantidad: z
    .number({
      required_error: 'cantidad es requerida',
      invalid_type_error: 'cantidad debe ser un número',
    })
    .positive(),

  precio_unitario: z
    .number()
    .nonnegative()
    .optional(),

  color_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
});

// Discriminante: presencia de trabajo_id (receta) vs material_id (legacy)
const itemSchema = z.union(
  [itemRecetaSchema, itemLegacySchema],
  {
    error:
      'Cada item debe tener trabajo_id (modo recetas) o material_id (modo legacy)',
  }
);

// POST /api/proformas/calcular — calcula precios sin guardar
const calcularProformaSchema = z.object({
  items: z
    .array(itemSchema, {
      required_error: 'El campo items es obligatorio',
    })
    .min(1),

  cliente: z
    .string()
    .trim()
    .max(200)
    .optional(),

  fecha: z
    .string()
    .optional(),
});

// POST /api/proformas/agendar — crea pedido a partir de una proforma
const agendarPedidoSchema = z.object({
  items: z
    .array(itemSchema, {
      required_error: 'El campo items es obligatorio',
    })
    .min(1),

  cliente: z
    .string()
    .trim()
    .max(200)
    .optional(),

  total: z
    .number()
    .nonnegative()
    .optional(),

  telefono: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable(),

  fecha: z
    .string()
    .optional(),

  fecha_agendamiento: z
    .string()
    .optional()
    .nullable(),
});

module.exports = {
  calcularProformaSchema,
  agendarPedidoSchema,
};
