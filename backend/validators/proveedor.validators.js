// backend/validators/proveedor.validators.js
// Sprint 17 — DT-07 Validación Zod
//
// Schemas para las rutas POST y PUT de proveedorRoutes.js.
// Los campos coinciden exactamente con lo que lee proveedorController.js.

'use strict';

const { z } = require('zod');

// ── Schema compartido para crear y actualizar proveedor ───────────────────
// Controller lee: nombre (req), ciudad, telefono_whatsapp, email, notas,
//                 material_ids (array opcional)
const proveedorBaseSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es requerido' })
    .trim()
    .min(1, { message: 'El nombre es requerido' })
    .max(150, { message: 'El nombre no puede superar 150 caracteres' }),

  ciudad: z
    .string()
    .trim()
    .max(100, { message: 'La ciudad no puede superar 100 caracteres' })
    .optional()
    .nullable(),

  telefono_whatsapp: z
    .string()
    .trim()
    .max(20, { message: 'El teléfono no puede superar 20 caracteres' })
    .optional()
    .nullable(),

  email: z
    .string()
    .trim()
    .email({ message: 'El email del proveedor no es válido' })
    .optional()
    .nullable(),

  notas: z
    .string()
    .trim()
    .max(1000, { message: 'Las notas no pueden superar 1000 caracteres' })
    .optional()
    .nullable(),

  material_ids: z
    .array(
      z.number({ invalid_type_error: 'Cada material_id debe ser un número entero' })
        .int()
        .positive({ message: 'Los material_id deben ser enteros positivos' })
    )
    .optional()
    .default([]),
});

// ── POST /api/proveedores ──────────────────────────────────────────────────
const crearProveedorSchema = proveedorBaseSchema;

// ── PUT /api/proveedores/:id ───────────────────────────────────────────────
const actualizarProveedorSchema = proveedorBaseSchema;

// ── Item de solicitud ──────────────────────────────────────────────────────
const itemSolicitudSchema = z.object({
  nombre_material: z
    .string({ required_error: 'nombre_material es requerido en cada item' })
    .trim()
    .min(1, { message: 'nombre_material es requerido en cada item' })
    .max(200),

  cantidad: z
    .number({ required_error: 'cantidad es requerida', invalid_type_error: 'cantidad debe ser un número' })
    .positive({ message: 'cantidad debe ser mayor a 0' }),

  material_id: z.number().int().positive().optional().nullable(),
  variante_id: z.number().int().positive().optional().nullable(),
  color:       z.string().trim().max(100).optional().nullable(),
  unidad:      z.string().trim().max(30).optional().default('unidad'),
});

// ── POST /api/proveedores/solicitudes/generar ─────────────────────────────
// Controller lee: proveedor_id (req), items (array req, min 1)
const generarSolicitudSchema = z.object({
  proveedor_id: z
    .number({
      required_error:    'El proveedor_id es requerido',
      invalid_type_error: 'El proveedor_id debe ser un número entero',
    })
    .int()
    .positive({ message: 'El proveedor_id debe ser un entero positivo' }),

  items: z
    .array(itemSolicitudSchema, { required_error: 'Los items son requeridos' })
    .min(1, { message: 'Debe incluir al menos un item en la solicitud' }),
});

module.exports = {
  crearProveedorSchema,
  actualizarProveedorSchema,
  generarSolicitudSchema,
};