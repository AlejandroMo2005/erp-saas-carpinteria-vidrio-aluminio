// backend/validators/ia.validators.js
// Sprint 17 — DT-07: inpaintSchema (sin cambios)
// Sprint 17 — DT-IA: visualizarSchema (nuevo)
// Sprint 17 — DT-IA fix: visualizarSchema acepta modo libre (trabajo_id=0)
//                         y color_id=0 (opcional en modo libre)
//
// DISEÑO:
//   inpaintSchema    → valida body JSON de POST /inpaint
//   visualizarSchema → valida los campos de texto del multipart de POST /visualizar
//                      (los archivos los valida multer en iaRoutes.js)
//
// MODOS DE visualizarSchema:
//   CATÁLOGO → trabajo_id > 0, color_id > 0, prompt_libre ausente/vacío
//   LIBRE    → trabajo_id = 0, color_id = 0 o cualquier número (opcional),
//              prompt_libre requerido (mín. 5 chars)

'use strict';

const { z } = require('zod');

const PROMPT_MAX = 500;

// ── POST /api/ia/inpaint ─────────────────────────────────────────────────────
// Sin cambios respecto a Sprint 17 DT-07

const inpaintSchema = z.object({
  imagen: z
    .string({ required_error: 'El campo imagen es requerido' })
    .min(1, { message: 'El campo imagen no puede estar vacío' }),

  mascara: z
    .string({ required_error: 'El campo mascara es requerido' })
    .min(1, { message: 'El campo mascara no puede estar vacío' }),

  prompt: z
    .string({ required_error: 'El campo prompt es requerido' })
    .trim()
    .min(1,          { message: 'El prompt no puede estar vacío' })
    .max(PROMPT_MAX, { message: `El prompt no puede superar ${PROMPT_MAX} caracteres` }),

  prompt_negativo: z.string().trim().max(PROMPT_MAX).optional().default(''),
  trabajo:         z.string().trim().max(100).optional().nullable(),
  color_marco:     z.string().trim().max(20).optional().nullable(),
  color_vidrio:    z.string().trim().max(20).optional().nullable(),
});

// ── POST /api/ia/visualizar ──────────────────────────────────────────────────
// Valida solo los campos de texto del multipart.
// Los archivos (imagen, mascara) los valida multer en iaRoutes.js.
//
// Flujo de validación:
//   1. Parsear trabajo_id y color_id como enteros ≥ 0.
//   2. Si trabajo_id === 0  → modo libre:
//        - prompt_libre obligatorio (mín. 5 chars, máx. PROMPT_MAX)
//        - color_id puede ser 0 (no seleccionado) o un entero válido (opcional)
//   3. Si trabajo_id > 0    → modo catálogo:
//        - color_id debe ser > 0
//        - prompt_libre ignorado (el controller lo descarta igualmente)

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

    prompt_libre: z
      .string()
      .trim()
      .max(PROMPT_MAX, { message: `El prompt no puede superar ${PROMPT_MAX} caracteres` })
      .optional()
      .default(''),
  })
  // Validación cruzada entre campos
  .superRefine((data, ctx) => {
    const esModoLibre = data.trabajo_id === 0;

    if (esModoLibre) {
      // Modo libre: prompt obligatorio
      if (!data.prompt_libre || data.prompt_libre.length < 5) {
        ctx.addIssue({
          code:    z.ZodIssueCode.custom,
          path:    ['prompt_libre'],
          message: 'El prompt libre es requerido en modo descripción libre (mín. 5 caracteres)',
        });
      }
      // color_id en modo libre puede ser 0 (sin color) o un entero positivo (opcional)
      // — no añadimos restricción aquí; el controller lo consulta si > 0
    } else {
      // Modo catálogo: color_id obligatorio (> 0)
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