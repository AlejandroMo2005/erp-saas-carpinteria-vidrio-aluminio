// backend/validators/proforma.validators.js
// Sprint 17 — DT-07 Validación Zod
//
// Schemas para las rutas POST de proformaRoutes.js.
// El controller acepta dos modos de items:
//   - Recetas:  cada item tiene trabajo_id  (+ ancho, alto, cantidad opcionales)
//   - Legacy:   cada item tiene material_id (+ cantidad, precio_unitario requeridos)
//
// La validación verifica la estructura mínima común y luego el controller
// decide el modo. No sobrevalidamos los campos internos de cada modo
// porque la lógica de negocio (cálculo de precios, stock) vive en el controller.

'use strict';

const { z } = require('zod');

// ── Item modo recetas ──────────────────────────────────────────────────────
const itemRecetaSchema = z.object({
  trabajo_id: z
    .number({ required_error: 'trabajo_id es requerido', invalid_type_error: 'trabajo_id debe ser un número' })
    .int()
    .positive({ message: 'trabajo_id debe ser un entero positivo' }),
  color_id: z.number().int().positive().optional().nullable(),
  ancho:    z.number().positive({ message: 'ancho debe ser mayor a 0' }).optional(),
  alto:     z.number().positive({ message: 'alto debe ser mayor a 0' }).optional(),
  cantidad: z.number().positive({ message: 'cantidad debe ser mayor a 0' }).optional(),
  detalle:  z.string().max(500).optional().nullable(),
});

// ── Item modo legacy ───────────────────────────────────────────────────────
const itemLegacySchema = z.object({
  material_id: z
    .number({ required_error: 'material_id es requerido', invalid_type_error: 'material_id debe ser un número' })
    .int()
    .positive({ message: 'material_id debe ser un entero positivo' }),
  cantidad: z
    .number({ required_error: 'cantidad es requerida', invalid_type_error: 'cantidad debe ser un número' })
    .positive({ message: 'cantidad debe ser mayor a 0' }),
  precio_unitario: z
    .number({ invalid_type_error: 'precio_unitario debe ser un número' })
    .nonnegative({ message: 'precio_unitario no puede ser negativo' })
    .optional(),
  color_id: z.number().int().positive().optional().nullable(),
});

// ── Item union: receta O legacy ────────────────────────────────────────────
// El discriminante natural es la presencia de trabajo_id vs material_id.
const itemSchema = z.union([itemRecetaSchema, itemLegacySchema], {
  errorMap: () => ({
    message: 'Cada item debe tener trabajo_id (modo recetas) o material_id (modo legacy)',
  }),
});

// ── POST /api/proformas/calcular ───────────────────────────────────────────
// Controller lee: items (array requerido, min 1)
const calcularProformaSchema = z.object({
  items: z
    .array(itemSchema, { required_error: 'El campo items es obligatorio' })
    .min(1, { message: 'Debe enviar al menos 1 item para calcular' }),

  // Campos opcionales que el controller usa en modo legacy
  cliente: z.string().trim().max(200).optional(),
  fecha:   z.string().optional(),
});

// ── POST /api/proformas/agendar ────────────────────────────────────────────
// Controller lee: cliente, fecha, total, items, telefono, fecha_agendamiento
const agendarPedidoSchema = z.object({
  items: z
    .array(itemSchema, { required_error: 'El campo items es obligatorio' })
    .min(1, { message: 'Debe enviar al menos 1 item' }),

  // En modo recetas el controller calcula cliente/total desde proformaCalculator.
  // En modo legacy son requeridos — el controller mismo valida esa lógica.
  cliente: z
    .string()
    .trim()
    .max(200, { message: 'El nombre del cliente no puede superar 200 caracteres' })
    .optional(),

  total: z
    .number({ invalid_type_error: 'total debe ser un número' })
    .nonnegative({ message: 'total no puede ser negativo' })
    .optional(),

  telefono: z
    .string()
    .trim()
    .max(20, { message: 'El teléfono no puede superar 20 caracteres' })
    .optional()
    .nullable(),

  fecha: z.string().optional(),

  fecha_agendamiento: z.string().optional().nullable(),
});

module.exports = {
  calcularProformaSchema,
  agendarPedidoSchema,
};