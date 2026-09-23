// src/shared/validators/facturacion.validators.js
// Sprint 17 — POST /api/facturacion, PUT /api/facturacion/:id, PUT /api/facturacion/:id/anular

'use strict';

const { z } = require('zod');

const TIPOS_IDENTIFICACION = ['CONSUMIDOR_FINAL', 'CEDULA', 'RUC', 'PASAPORTE'];

// Un ítem dentro de una factura
const itemFacturaSchema = z.object({
  descripcion: z
    .string({ required_error: 'La descripción del item es requerida' })
    .trim()
    .min(1)
    .max(300),
  cantidad: z
    .number({ required_error: 'La cantidad es requerida', invalid_type_error: 'La cantidad debe ser un número' })
    .positive({ message: 'La cantidad debe ser mayor a 0' }),
  precio_unitario:      z.number().nonnegative().optional().default(0),
  descuento:            z.number().nonnegative().optional().default(0),
  porcentaje_iva:       z.number().nonnegative().optional(),
  material_id:          z.number().int().positive().optional().nullable(),
  detalles_adicionales: z.string().max(500).optional().nullable(),
});

// POST /api/facturacion — factura manual con cliente libre (sin cliente_id obligatorio)
const crearFacturaManualSchema = z.object({
  cliente_nombre: z
    .string({ required_error: 'El nombre del cliente es requerido' })
    .trim()
    .min(1)
    .max(200),
  items: z
    .array(itemFacturaSchema, { required_error: 'Los items son requeridos' })
    .min(1, { message: 'Debe incluir al menos un item' }),
  cliente_id:                  z.number().int().positive().optional().nullable(),
  cliente_identificacion:      z.string().trim().max(20).optional().nullable(),
  cliente_tipo_identificacion: z
    .enum(TIPOS_IDENTIFICACION, {
      errorMap: () => ({ message: `Tipo de identificación inválido. Use: ${TIPOS_IDENTIFICACION.join(', ')}` }),
    })
    .optional()
    .default('CONSUMIDOR_FINAL'),
  cliente_direccion: z.string().trim().max(300).optional().nullable(),
  cliente_telefono:  z.string().trim().max(20).optional().nullable(),
  cliente_email:     z.string().trim().email().optional().nullable(),
  pedido_id:         z.number().int().positive().optional().nullable(),
  observaciones:     z.string().trim().max(500).optional().nullable(),
});

// POST /api/facturacion/desde-pedido — genera factura a partir de un pedido existente
const crearDesdePedidoSchema = z.object({
  pedidoId: z
    .number({ required_error: 'El pedidoId es requerido', invalid_type_error: 'El pedidoId debe ser un número entero' })
    .int()
    .positive(),
  datosAdicionales: z.record(z.any()).optional().default({}),
});

// PUT /api/facturacion/:id — actualización parcial; passthrough para campos futuros
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
  .passthrough();

// PUT /api/facturacion/:id/anular — motivo obligatorio con descripción mínima
const anularFacturaSchema = z.object({
  motivo: z
    .string({ required_error: 'El motivo es requerido' })
    .trim()
    .min(10, { message: 'El motivo debe tener al menos 10 caracteres' })
    .max(500),
});

module.exports = {
  crearFacturaManualSchema,
  crearDesdePedidoSchema,
  actualizarFacturaSchema,
  anularFacturaSchema,
};