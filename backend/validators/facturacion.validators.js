// backend/validators/facturacion.validators.js
// Sprint 17 — DT-07 Validación Zod
//
// Schemas para las rutas POST y PUT de facturacionRoutes.js.
// Los campos coinciden exactamente con lo que lee facturacionController.js.

'use strict';

const { z } = require('zod');

// ── Tipos de identificación válidos (misma lógica que validacionService) ──
const TIPOS_IDENTIFICACION = [
  'CONSUMIDOR_FINAL',
  'CEDULA',
  'RUC',
  'PASAPORTE',
];

// ── Item de factura ────────────────────────────────────────────────────────
// Controller valida: descripcion (requerida), cantidad > 0, precio >= 0
const itemFacturaSchema = z.object({
  descripcion: z
    .string({ required_error: 'La descripción del item es requerida' })
    .trim()
    .min(1, { message: 'La descripción del item es requerida' })
    .max(300, { message: 'La descripción no puede superar 300 caracteres' }),

  cantidad: z
    .number({ required_error: 'La cantidad es requerida', invalid_type_error: 'La cantidad debe ser un número' })
    .positive({ message: 'La cantidad debe ser mayor a 0' }),

  precio_unitario: z
    .number({ invalid_type_error: 'El precio unitario debe ser un número' })
    .nonnegative({ message: 'El precio unitario no puede ser negativo' })
    .optional()
    .default(0),

  descuento: z
    .number({ invalid_type_error: 'El descuento debe ser un número' })
    .nonnegative({ message: 'El descuento no puede ser negativo' })
    .optional()
    .default(0),

  porcentaje_iva: z
    .number({ invalid_type_error: 'El porcentaje de IVA debe ser un número' })
    .nonnegative({ message: 'El porcentaje de IVA no puede ser negativo' })
    .optional(),

  material_id: z.number().int().positive().optional().nullable(),

  detalles_adicionales: z.string().max(500).optional().nullable(),
});

// ── POST /api/facturacion — Factura manual ────────────────────────────────
// Controller lee: cliente_nombre (req), items (req, min 1),
//   cliente_id, cliente_identificacion, cliente_tipo_identificacion,
//   cliente_direccion, cliente_telefono, cliente_email,
//   pedido_id, observaciones
const crearFacturaManualSchema = z.object({
  cliente_nombre: z
    .string({ required_error: 'El nombre del cliente es requerido' })
    .trim()
    .min(1, { message: 'El nombre del cliente es requerido' })
    .max(200, { message: 'El nombre del cliente no puede superar 200 caracteres' }),

  items: z
    .array(itemFacturaSchema, { required_error: 'Los items son requeridos' })
    .min(1, { message: 'Debe incluir al menos un item' }),

  cliente_id: z.number().int().positive().optional().nullable(),

  cliente_identificacion: z
    .string()
    .trim()
    .max(20, { message: 'La identificación no puede superar 20 caracteres' })
    .optional()
    .nullable(),

  cliente_tipo_identificacion: z
    .enum(TIPOS_IDENTIFICACION, {
      errorMap: () => ({ message: `Tipo de identificación inválido. Use: ${TIPOS_IDENTIFICACION.join(', ')}` }),
    })
    .optional()
    .default('CONSUMIDOR_FINAL'),

  cliente_direccion: z.string().trim().max(300).optional().nullable(),
  cliente_telefono:  z.string().trim().max(20).optional().nullable(),
  cliente_email:     z.string().trim().email({ message: 'El email del cliente no es válido' }).optional().nullable(),

  pedido_id: z.number().int().positive().optional().nullable(),

  observaciones: z
    .string()
    .trim()
    .max(500, { message: 'Las observaciones no pueden superar 500 caracteres' })
    .optional()
    .nullable(),
});

// ── POST /api/facturacion/desde-pedido ────────────────────────────────────
// Controller lee: pedidoId (requerido), datosAdicionales (opcional)
const crearDesdePedidoSchema = z.object({
  pedidoId: z
    .number({
      required_error:    'El pedidoId es requerido',
      invalid_type_error: 'El pedidoId debe ser un número entero',
    })
    .int()
    .positive({ message: 'El pedidoId debe ser un entero positivo' }),

  datosAdicionales: z
    .record(z.any())
    .optional()
    .default({}),
});

// ── PUT /api/facturacion/:id — actualización parcial ─────────────────────
// Controller pasa req.body directamente al modelo (actualización libre).
// Zod garantiza que los campos conocidos tengan tipos correctos.
// Campos desconocidos se pasan tal cual (passthrough) para no romper
// campos de negocio que se agreguen en el futuro.
const actualizarFacturaSchema = z
  .object({
    cliente_nombre:               z.string().trim().max(200).optional(),
    cliente_identificacion:       z.string().trim().max(20).optional().nullable(),
    cliente_tipo_identificacion:  z.enum(TIPOS_IDENTIFICACION).optional(),
    cliente_direccion:            z.string().trim().max(300).optional().nullable(),
    cliente_telefono:             z.string().trim().max(20).optional().nullable(),
    cliente_email:                z.string().trim().email().optional().nullable(),
    observaciones:                z.string().trim().max(500).optional().nullable(),
    estado:                       z.string().trim().optional(),
    estado_sri:                   z.string().trim().optional(),
  })
  .passthrough(); // permite campos adicionales que el modelo pueda necesitar

// ── PUT /api/facturacion/:id/anular ───────────────────────────────────────
// Controller lee: motivo (requerido, min 10 caracteres)
const anularFacturaSchema = z.object({
  motivo: z
    .string({ required_error: 'El motivo es requerido' })
    .trim()
    .min(10, { message: 'El motivo debe tener al menos 10 caracteres' })
    .max(500, { message: 'El motivo no puede superar 500 caracteres' }),
});

module.exports = {
  crearFacturaManualSchema,
  crearDesdePedidoSchema,
  actualizarFacturaSchema,
  anularFacturaSchema,
};