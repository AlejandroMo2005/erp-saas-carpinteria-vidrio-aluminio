// backend/validators/usuario.validators.js
// Sprint 17 — DT-07 Validación Zod
//
// Schemas para las rutas POST y PUT de usuarioRoutes.js.
// Los campos coinciden exactamente con lo que lee usuarioController.js.

'use strict';

const { z } = require('zod');

const ROLES_VALIDOS = ['ADMIN', 'VENDEDOR', 'ALMACEN', 'CLIENTE'];

// ── PUT /api/usuarios/me ───────────────────────────────────────────────────
// Controller lee: password, passwordActual, cedula_ruc, email, ...resto
// Reglas de negocio que Zod puede cubrir antes del controller:
//   - Si viene password, passwordActual también debe venir
//   - password min 6 si está presente
//   - email con formato válido si está presente
//   - cedula_ruc: 10 o 13 dígitos (la lógica completa queda en el controller)
const updateMeSchema = z
  .object({
    // Campos de contraseña — opcionales, validados en conjunto
    password: z
      .string()
      .min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
      .optional(),

    passwordActual: z
      .string()
      .min(1, { message: 'Debes proporcionar tu contraseña actual para poder cambiarla' })
      .optional(),

    // Datos de perfil opcionales
    email: z
      .string()
      .trim()
      .email({ message: 'El formato del email no es válido' })
      .optional()
      .or(z.literal('')), // permite string vacío (para borrar el email)

    cedula_ruc: z
      .string()
      .trim()
      .regex(/^\d{10}$|^\d{13}$/, {
        message: 'cedula_ruc debe ser una cédula (10 dígitos) o RUC (13 dígitos) ecuatoriano',
      })
      .optional()
      .nullable(),

    nombre:         z.string().trim().max(100).optional(),
    nombre_completo: z.string().trim().max(150).optional(),
    telefono:       z.string().trim().max(20).optional().nullable(),
  })
  .passthrough() // ...resto: el controller hace spread de los campos desconocidos
  .refine(
    (data) => {
      // Si viene password, passwordActual es obligatorio
      if (data.password && !data.passwordActual) return false;
      return true;
    },
    {
      message: 'Debes proporcionar tu contraseña actual para poder cambiarla',
      path: ['passwordActual'],
    }
  );

// ── POST /api/usuarios — crear usuario (solo ADMIN) ───────────────────────
// Controller lee: nombre, email, password, rol — todos requeridos
const createUsuarioSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(100, { message: 'El nombre no puede superar 100 caracteres' }),

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
    errorMap: () => ({
      message: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}`,
    }),
  }),
});

// ── PUT /api/usuarios/:id/rol ─────────────────────────────────────────────
// Controller lee: rol (requerido, en enum ROLES_VALIDOS)
const updateRolSchema = z.object({
  rol: z.enum(ROLES_VALIDOS, {
    required_error: 'El campo rol es obligatorio',
    errorMap: () => ({
      message: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}`,
    }),
  }),
});

// ── PUT /api/usuarios/:id/activo ──────────────────────────────────────────
// Controller lee: activo (boolean requerido)
const toggleActivoSchema = z.object({
  activo: z.boolean({
    required_error:    'El campo activo es requerido (true/false)',
    invalid_type_error: 'El campo activo debe ser true o false',
  }),
});

module.exports = {
  updateMeSchema,
  createUsuarioSchema,
  updateRolSchema,
  toggleActivoSchema,
};