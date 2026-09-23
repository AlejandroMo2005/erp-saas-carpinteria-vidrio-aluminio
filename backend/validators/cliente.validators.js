// backend/validators/cliente.validators.js
// Sprint 17 — DT-07 Validación Zod
//
// Schemas para las rutas POST y PUT de clienteRoutes.js.
// Los campos coinciden exactamente con lo que lee clienteController.js.

'use strict';

const { z } = require('zod');

// ── Reutilizables ──────────────────────────────────────────────────────────
const nombreField = z
  .string({ required_error: 'El nombre es requerido' })
  .trim()
  .min(1, { message: 'El nombre es requerido' })
  .max(150, { message: 'El nombre no puede superar 150 caracteres' });

const telefonoField = z
  .string({ required_error: 'El teléfono es requerido' })
  .trim()
  .min(1, { message: 'El teléfono es requerido' })
  .max(20, { message: 'El teléfono no puede superar 20 caracteres' });

// ── POST /api/clientes ─────────────────────────────────────────────────────
// Controller lee: nombre (requerido), telefono (requerido)
const crearClienteSchema = z.object({
  nombre:   nombreField,
  telefono: telefonoField,
});

// ── PUT /api/clientes/mis-datos ────────────────────────────────────────────
// Controller lee: nombre (opcional), telefono (opcional)
// Regla de negocio: al menos uno de los dos debe estar presente.
const updateMisDatosSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .max(150, { message: 'El nombre no puede superar 150 caracteres' })
      .optional(),
    telefono: z
      .string()
      .trim()
      .max(20, { message: 'El teléfono no puede superar 20 caracteres' })
      .optional(),
  })
  .refine(
    (data) => !!data.nombre?.trim() || !!data.telefono?.trim(),
    { message: 'Debes enviar al menos nombre o teléfono para actualizar' }
  );

module.exports = {
  crearClienteSchema,
  updateMisDatosSchema,
};