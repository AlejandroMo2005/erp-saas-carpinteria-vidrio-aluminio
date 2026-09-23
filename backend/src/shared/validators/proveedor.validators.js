// src/shared/validators/proveedor.validators.js
// Sprint 17 — POST /api/proveedores, PUT /api/proveedores/:id, POST /api/proveedores/solicitudes/generar

'use strict';

const { z } = require('zod');

// Campos comunes a crear y actualizar proveedor
const proveedorBaseSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es requerido' })
    .trim()
    .min(1)
    .max(150),
  ciudad:            z.string().trim().max(100).optional().nullable(),
  telefono_whatsapp: z.string().trim().max(20).optional().nullable(),
  email:             z.string().trim().email({ message: 'El email del proveedor no es válido' }).optional().nullable(),
  notas:             z.string().trim().max(1000).optional().nullable(),
  // IDs de materiales asociados al proveedor
  material_ids: z
    .array(z.number().int().positive({ message: 'Los material_id deben ser enteros positivos' }))
    .optional()
    .default([]),
});

// POST /api/proveedores
const crearProveedorSchema = proveedorBaseSchema;

// PUT /api/proveedores/:id
const actualizarProveedorSchema = proveedorBaseSchema;

// Un ítem dentro de una solicitud de compra
const itemSolicitudSchema = z.object({
  nombre_material: z.string({ required_error: 'nombre_material es requerido en cada item' }).trim().min(1).max(200),
  cantidad: z
    .number({ required_error: 'cantidad es requerida', invalid_type_error: 'cantidad debe ser un número' })
    .positive(),
  material_id: z.number().int().positive().optional().nullable(),
  variante_id: z.number().int().positive().optional().nullable(),
  color:       z.string().trim().max(100).optional().nullable(),
  unidad:      z.string().trim().max(30).optional().default('unidad'),
});

// POST /api/proveedores/solicitudes/generar
const generarSolicitudSchema = z.object({
  proveedor_id: z
    .number({ required_error: 'El proveedor_id es requerido', invalid_type_error: 'El proveedor_id debe ser un número entero' })
    .int()
    .positive(),
  items: z
    .array(itemSolicitudSchema, { required_error: 'Los items son requeridos' })
    .min(1, { message: 'Debe incluir al menos un item en la solicitud' }),
});

module.exports = { crearProveedorSchema, actualizarProveedorSchema, generarSolicitudSchema };