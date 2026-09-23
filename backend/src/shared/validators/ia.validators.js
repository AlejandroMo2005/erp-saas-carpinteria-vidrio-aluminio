// src/shared/validators/ia.validators.js
// Sprint 17 — POST /api/ia/inpaint, POST /api/ia/visualizar

'use strict';

const { z } = require('zod');

const PROMPT_MAX = 500;

// POST /api/ia/inpaint — imagen y máscara en base64, prompt obligatorio
const inpaintSchema = z.object({
  imagen:  z.string({ required_error: 'El campo imagen es requerido' }).min(1),
  mascara: z.string({ required_error: 'El campo mascara es requerido' }).min(1),
  prompt: z
    .string({ required_error: 'El campo prompt es requerido' })
    .trim()
    .min(1)
    .max(PROMPT_MAX, { message: `El prompt no puede superar ${PROMPT_MAX} caracteres` }),
  prompt_negativo: z.string().trim().max(PROMPT_MAX).optional().default(''),
  trabajo:         z.string().trim().max(100).optional().nullable(),
  color_marco:     z.string().trim().max(20).optional().nullable(),
  color_vidrio:    z.string().trim().max(20).optional().nullable(),
});

// POST /api/ia/visualizar — valida campos de texto del multipart (archivos los valida multer)
// Modos:
//   CATÁLOGO → trabajo_id > 0, color_id > 0
//   LIBRE    → trabajo_id = 0, prompt_libre requerido (mín. 5 chars)
const visualizarSchema = z
  .object({
    trabajo_id: z
      .string({ required_error: 'trabajo_id es requerido' })
      .regex(/^\d+$/, { message: 'trabajo_id debe ser un número entero' })
      .transform(Number),
    color_id: z
      .string({ required_error: 'color_id es requerido' })
      .regex(/^\d+$/, { message: 'color_id debe ser un número entero' })
      .transform(Number),
    prompt_libre: z.string().trim().max(PROMPT_MAX).optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.trabajo_id === 0) {
      // Modo libre: prompt obligatorio
      if (!data.prompt_libre || data.prompt_libre.length < 5) {
        ctx.addIssue({
          code:    z.ZodIssueCode.custom,
          path:    ['prompt_libre'],
          message: 'El prompt libre es requerido en modo descripción libre (mín. 5 caracteres)',
        });
      }
    } else {
      // Modo catálogo: color_id obligatorio
      if (data.color_id === 0) {
        ctx.addIssue({
          code:    z.ZodIssueCode.custom,
          path:    ['color_id'],
          message: 'color_id es requerido en modo catálogo',
        });
      }
    }
  });

module.exports = { inpaintSchema, visualizarSchema };