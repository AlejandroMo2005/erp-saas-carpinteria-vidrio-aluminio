// src/shared/validators/auth.validators.js
// Sprint 17 — POST /api/auth/*

'use strict';

const { z } = require('zod');

// Email normalizado y obligatorio
const emailField = z
  .string({ required_error: 'El email es obligatorio' })
  .trim()
  .email({ message: 'El email no tiene un formato válido' })
  .toLowerCase();

// Contraseña con mensaje de error configurable
const passwordField = (minMsg = 'La contraseña es obligatoria') =>
  z.string({ required_error: minMsg }).min(1, { message: minMsg });

// Contraseña con mínimo 6 caracteres
const passwordMin6 = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' });

// POST /api/auth/login
const loginSchema = z.object({
  email:    emailField,
  password: passwordField('La contraseña es obligatoria'),
});

// POST /api/auth/register
const registerSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(100, { message: 'El nombre no puede superar 100 caracteres' }),
  email:    emailField,
  password: passwordMin6,
});

// POST /api/auth/forgot-password
const forgotPasswordSchema = z.object({
  email: emailField,
});

// POST /api/auth/verify-code
const verifyCodeSchema = z.object({
  token: z.string({ required_error: 'El token es requerido' }).min(1),
  code: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .refine((v) => v.length > 0, { message: 'El código es requerido' }),
});

// POST /api/auth/reset-password
const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'El token es requerido' }).min(1),
  code: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim())
    .refine((v) => v.length > 0, { message: 'El código es requerido' }),
  newPassword: passwordMin6,
});

module.exports = {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
};