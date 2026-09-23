// src/shared/validators/usuario.validators.js
// Sprint 17 — PUT /api/usuarios/me, POST /api/usuarios, PUT /api/usuarios/:id/rol, PUT /api/usuarios/:id/activo

'use strict';

const { z } = require('zod');

const ROLES_VALIDOS = ['ADMIN', 'VENDEDOR', 'ALMACEN', 'CLIENTE'];

// PUT /api/usuarios/me — actualización de perfil propio; si viene password, passwordActual es obligatorio
const updateMeSchema = z
  .object({
    password:        z.string().min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' }).optional(),
    passwordActual:  z.string().min(1, { message: 'Debes proporcionar tu contraseña actual para poder cambiarla' }).optional(),
    email: z
      .string()
      .trim()
      .email({ message: 'El formato del email no es válido' })
      .optional()
      .or(z.literal('')),
    // Cédula (10 dígitos) o RUC (13 dígitos) ecuatoriano
    cedula_ruc: z
      .string()
      .trim()
      .regex(/^\d{10}$|^\d{13}$/, { message: 'cedula_ruc debe ser una cédula (10 dígitos) o RUC (13 dígitos) ecuatoriano' })
      .optional()
      .nullable(),
    nombre:          z.string().trim().max(100).optional(),
    nombre_completo: z.string().trim().max(150).optional(),
    telefono:        z.string().trim().max(20).optional().nullable(),
  })
  .passthrough()
  .refine(
    (data) => !(data.password && !data.passwordActual),
    { message: 'Debes proporcionar tu contraseña actual para poder cambiarla', path: ['passwordActual'] }
  );

// POST /api/usuarios — creación por ADMIN; todos los campos requeridos
const createUsuarioSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(1)
    .max(100),
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .trim()
    .email({ message: 'El formato del email no es válido' })
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  rol: z.enum(ROLES_VALIDOS, {
    required_error: 'El rol es obligatorio',
    errorMap: () => ({ message: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}` }),
  }),
});

// PUT /api/usuarios/:id/rol — cambio de rol por ADMIN
const updateRolSchema = z.object({
  rol: z.enum(ROLES_VALIDOS, {
    required_error: 'El campo rol es obligatorio',
    errorMap: () => ({ message: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}` }),
  }),
});

// PUT /api/usuarios/:id/activo — activar o desactivar usuario
const toggleActivoSchema = z.object({
  activo: z.boolean({
    required_error:    'El campo activo es requerido (true/false)',
    invalid_type_error: 'El campo activo debe ser true o false',
  }),
});

module.exports = { updateMeSchema, createUsuarioSchema, updateRolSchema, toggleActivoSchema };