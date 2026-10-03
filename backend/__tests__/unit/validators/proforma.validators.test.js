import { describe, it, expect } from 'vitest';

const {
  calcularProformaSchema,
  agendarPedidoSchema,
} = require('../../../src/shared/validators/proforma.validators');

describe('proforma.validators', () => {
  const itemRecetaValido = {
    trabajo_id: 1,
    color_id: 2,
    ancho: 1.5,
    alto: 2,
    cantidad: 3,
    detalle: 'Ventana corrediza',
  };



  describe('itemRecetaSchema mediante calcularProformaSchema', () => {
    it('debe aceptar un item de receta completo', () => {
      const result = calcularProformaSchema.safeParse({
        items: [itemRecetaValido],
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar un item de receta con solo trabajo_id', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1 }],
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar color_id null', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1, color_id: null }],
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar dimensiones y cantidad positivas', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{
          trabajo_id: 1,
          ancho: 0.01,
          alto: 0.01,
          cantidad: 0.01,
        }],
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar detalle null', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{
          trabajo_id: 1,
          detalle: null,
        }],
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar detalle de exactamente 500 caracteres', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{
          trabajo_id: 1,
          detalle: 'a'.repeat(500),
        }],
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar trabajo_id ausente', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ ancho: 1, alto: 2 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar trabajo_id cero', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 0 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar trabajo_id negativo', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: -1 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar trabajo_id decimal', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1.5 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar trabajo_id como string', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: '1' }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar color_id cero', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1, color_id: 0 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar color_id negativo', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1, color_id: -1 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar color_id decimal', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1, color_id: 1.5 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar ancho cero', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1, ancho: 0 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar ancho negativo', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1, ancho: -1 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar alto cero', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1, alto: 0 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar alto negativo', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1, alto: -1 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar cantidad cero', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1, cantidad: 0 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar cantidad negativa', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1, cantidad: -1 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar detalle de más de 500 caracteres', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{
          trabajo_id: 1,
          detalle: 'a'.repeat(501),
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar detalle con tipo no string', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{
          trabajo_id: 1,
          detalle: 123,
        }],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('itemSchema y discriminación entre modos', () => {
    it('debe rechazar un item vacío', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{}],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar item con campos insuficientes para ambos modos', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ cantidad: 2 }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar item que solo tenga un campo no relacionado', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ descripcion: 'Ventana' }],
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar un item de receta aunque tenga campos adicionales del modo legacy', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{
          trabajo_id: 1,
          material_id: 2,
          cantidad: 3,
        }],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('calcularProformaSchema', () => {
    it('debe aceptar múltiples items de receta', () => {
      const result = calcularProformaSchema.safeParse({
        items: [
          { trabajo_id: 1 },
          { trabajo_id: 2, cantidad: 3 },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar items ausentes', () => {
      const result = calcularProformaSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('debe rechazar items vacío', () => {
      const result = calcularProformaSchema.safeParse({
        items: [],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar items que no sean un arreglo', () => {
      const result = calcularProformaSchema.safeParse({
        items: {},
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar cliente con espacios y normalizarlo', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        cliente: '  Juan Pérez  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.cliente).toBe('Juan Pérez');
    });

    it('debe aceptar cliente vacío', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        cliente: '',
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar cliente de exactamente 200 caracteres', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        cliente: 'a'.repeat(200),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar cliente de más de 200 caracteres', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        cliente: 'a'.repeat(201),
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar cliente con tipo no string', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        cliente: 123,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar fecha opcional', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        fecha: '2026-09-23',
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar fecha omitida', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1 }],
      });

      expect(result.success).toBe(true);
      expect(result.data.fecha).toBeUndefined();
    });

    it('debe aceptar fecha vacía porque solo es string opcional', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        fecha: '',
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar fecha con tipo no string', () => {
      const result = calcularProformaSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        fecha: 20260923,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('agendarPedidoSchema', () => {
    it('debe aceptar un pedido de receta mínimo', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar un pedido completo', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [
          itemRecetaValido,
          { trabajo_id: 2, cantidad: 2 },
        ],
        cliente: 'Juan Pérez',
        total: 350.75,
        telefono: '0999999999',
        fecha: '2026-09-23',
        fecha_agendamiento: '2026-09-25',
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar total igual a cero', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        total: 0,
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar total decimal positivo', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        total: 0.01,
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar total negativo', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        total: -1,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar total con tipo no numérico', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        total: '100',
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar telefono null', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        telefono: null,
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar telefono con espacios y normalizarlo', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        telefono: ' 0999999999 ',
      });

      expect(result.success).toBe(true);
      expect(result.data.telefono).toBe('0999999999');
    });

    it('debe aceptar telefono de exactamente 20 caracteres', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        telefono: '1'.repeat(20),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar telefono de más de 20 caracteres', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        telefono: '1'.repeat(21),
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar telefono con tipo no string', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        telefono: 999999999,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar fecha_agendamiento null', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        fecha_agendamiento: null,
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar fecha_agendamiento como string', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        fecha_agendamiento: '2026-09-25',
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar fecha_agendamiento vacío', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        fecha_agendamiento: '',
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar fecha_agendamiento con tipo no string ni null', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        fecha_agendamiento: 20260925,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar cliente omitido', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
      });

      expect(result.success).toBe(true);
      expect(result.data.cliente).toBeUndefined();
    });

    it('debe rechazar cliente de más de 200 caracteres', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        cliente: 'a'.repeat(201),
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar items ausentes', () => {
      const result = agendarPedidoSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('debe rechazar items vacío', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [],
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar fecha omitida', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
      });

      expect(result.success).toBe(true);
      expect(result.data.fecha).toBeUndefined();
    });

    it('debe rechazar fecha con tipo no string', () => {
      const result = agendarPedidoSchema.safeParse({
        items: [{ trabajo_id: 1 }],
        fecha: 20260923,
      });

      expect(result.success).toBe(false);
    });
  });
});
