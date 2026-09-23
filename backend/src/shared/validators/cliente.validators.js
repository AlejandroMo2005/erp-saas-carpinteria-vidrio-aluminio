// src/shared/validators/cliente.validators.js
// Sprint 17 — POST /api/clientes, PUT /api/clientes/mis-datos

'use strict';

const { z } = require('zod');

// Nombre obligatorio, máx 150 chars
const nombreField = z
  .string({ required_error: 'El nombre es requerido' })
  .trim()
  .min(1, { message: 'El nombre es requerido' })
  .max(150, { message: 'El nombre no puede superar 150 caracteres' });

// Teléfono obligatorio, máx 20 chars
const telefonoField = z
  .string({ required_error: 'El teléfono es requerido' })
  .trim()
  .min(1, { message: 'El teléfono es requerido' })
  .max(20, { message: 'El teléfono no puede superar 20 caracteres' });

// POST /api/clientes — nombre y teléfono requeridos
const crearClienteSchema = z.object({
  nombre:   nombreField,
  telefono: telefonoField,
});

// PUT /api/clientes/mis-datos — al menos uno de los dos campos debe estar presente
const updateMisDatosSchema = z
  .object({
    nombre:   z.string().trim().max(150).optional(),
    telefono: z.string().trim().max(20).optional(),
  })
  .refine(
    (data) => !!data.nombre?.trim() || !!data.telefono?.trim(),
    { message: 'Debes enviar al menos nombre o teléfono para actualizar' }
  );

module.exports = { crearClienteSchema, updateMisDatosSchema };