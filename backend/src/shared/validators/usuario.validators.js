'use strict';

const { z } = require('zod');

const ROLES_VALIDOS = ['ADMIN', 'VENDEDOR', 'ALMACEN', 'CLIENTE'];

const mensajeRolInvalido = `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}`;

const updateMeSchema = z
  .object({
    password: z
      .string()
      .min(6, {
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
      })
      .optional(),

    passwordActual: z
      .string()
      .min(1, {
        message:
          'Debes proporcionar tu contraseña actual para poder cambiarla',
      })
      .optional(),

    email: z
      .string()
      .trim()
      .email({
        message: 'El formato del email no es válido',
      })
      .optional()
      .or(z.literal('')),

    cedula_ruc: z
      .string()
      .trim()
      .regex(/^\d{10}$|^\d{13}$/, {
        message:
          'cedula_ruc debe ser una cédula (10 dígitos) o RUC (13 dígitos) ecuatoriano',
      })
      .optional()
      .nullable(),

    nombre: z
      .string()
      .trim()
      .max(100)
      .optional(),

    nombre_completo: z
      .string()
      .trim()
      .max(150)
      .optional(),

    telefono: z
      .string()
      .trim()
      .max(20)
      .optional()
      .nullable(),
  })
  .passthrough()
  .refine(
    (data) => !(data.password && !data.passwordActual),
    {
      message:
        'Debes proporcionar tu contraseña actual para poder cambiarla',
      path: ['passwordActual'],
    }
  );

const createUsuarioSchema = z.object({
  nombre: z
    .string({
      error: 'El nombre es obligatorio',
    })
    .trim()
    .min(1)
    .max(100),

  email: z
    .string({
      error: 'El email es obligatorio',
    })
    .trim()
    .email({
      message: 'El formato del email no es válido',
    })
    .toLowerCase(),

  password: z
    .string({
      error: 'La contraseña es obligatoria',
    })
    .min(6, {
      message: 'La contraseña debe tener al menos 6 caracteres',
    }),

  rol: z.enum(ROLES_VALIDOS, {
    error: mensajeRolInvalido,
  }),
});

// PUT /api/usuarios/:id/rol — cambio de rol por ADMIN
const updateRolSchema = z.object({
  rol: z.enum(ROLES_VALIDOS, {
    error: mensajeRolInvalido,
  }),
});

// PUT /api/usuarios/:id/activo — activar o desactivar usuario
const toggleActivoSchema = z.object({
  activo: z.boolean({
    error: 'El campo activo debe ser true o false',
  }),
});

module.exports = {
  updateMeSchema,
  createUsuarioSchema,
  updateRolSchema,
  toggleActivoSchema,
};
