import { describe, it, expect } from 'vitest';

const {
  createPedidoSchema,
  updateEstadoSchema,
} = require('../../../src/shared/validators/pedido.validators');

describe('createPedidoSchema', () => {
  describe('casos válidos', () => {
    it('debe aceptar un pedido con solo total', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(100);
    });

    it('debe aceptar todos los campos válidos', () => {
      const result = createPedidoSchema.safeParse({
        total: 250.75,
        fecha: '2026-09-23',
        estado: 'PENDIENTE',
        proforma_id: 15,
        observaciones: 'Pedido de prueba',
        detalles: [
          { descripcion: 'Ventana', cantidad: 2 },
          { descripcion: 'Puerta', cantidad: 1 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        total: 250.75,
        fecha: '2026-09-23',
        estado: 'PENDIENTE',
        proforma_id: 15,
        observaciones: 'Pedido de prueba',
        detalles: [
          { descripcion: 'Ventana', cantidad: 2 },
          { descripcion: 'Puerta', cantidad: 1 },
        ],
      });
    });

    it('debe aceptar total con valor decimal positivo', () => {
      const result = createPedidoSchema.safeParse({
        total: 0.01,
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar todos los estados válidos', () => {
      const estados = [
        'PENDIENTE',
        'PROCESADO',
        'ENTREGADO',
        'CANCELADO',
      ];

      for (const estado of estados) {
        const result = createPedidoSchema.safeParse({
          total: 100,
          estado,
        });

        expect(result.success).toBe(true);
      }
    });

    it('debe aceptar proforma_id entero positivo', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        proforma_id: 1,
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar proforma_id como null', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        proforma_id: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.proforma_id).toBeNull();
    });

    it('debe aceptar observaciones como null', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        observaciones: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.observaciones).toBeNull();
    });

    it('debe aceptar detalles como arreglo vacío', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        detalles: [],
      });

      expect(result.success).toBe(true);
      expect(result.data.detalles).toEqual([]);
    });

    it('debe aceptar detalles con cualquier contenido', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        detalles: [
          'texto',
          123,
          null,
          true,
          { material: 'aluminio' },
          ['anidado'],
        ],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('transformación de fecha', () => {
    it('debe eliminar espacios al inicio y al final de fecha', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        fecha: '  2026-09-23  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.fecha).toBe('2026-09-23');
    });

    it('debe transformar fecha vacía en undefined', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        fecha: '',
      });

      expect(result.success).toBe(true);
      expect(result.data.fecha).toBeUndefined();
    });

    it('debe transformar fecha con solo espacios en undefined', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        fecha: '     ',
      });

      expect(result.success).toBe(true);
      expect(result.data.fecha).toBeUndefined();
    });

    it('debe aceptar fecha omitida', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data.fecha).toBeUndefined();
    });

    it('debe rechazar fecha con tipo no string', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        fecha: 20260923,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar fecha null como inválida porque el campo no es nullable', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        fecha: null,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validación de total', () => {
    it('debe rechazar total igual a cero', () => {
      const result = createPedidoSchema.safeParse({
        total: 0,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar total negativo', () => {
      const result = createPedidoSchema.safeParse({
        total: -1,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar total ausente', () => {
      const result = createPedidoSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('debe rechazar total como string', () => {
      const result = createPedidoSchema.safeParse({
        total: '100',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar total como null', () => {
      const result = createPedidoSchema.safeParse({
        total: null,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validación de estado', () => {
    it('debe aceptar estado omitido', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data.estado).toBeUndefined();
    });

    it('debe rechazar estado inválido', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        estado: 'EN_PROCESO',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar estado vacío', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        estado: '',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar estado con tipo no string', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        estado: 1,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validación de proforma_id', () => {
    it('debe rechazar proforma_id igual a cero', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        proforma_id: 0,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar proforma_id negativo', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        proforma_id: -1,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar proforma_id decimal', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        proforma_id: 1.5,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar proforma_id como string', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        proforma_id: '1',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validación de observaciones', () => {
    it('debe aceptar observaciones vacías', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        observaciones: '',
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar observaciones de exactamente 500 caracteres', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        observaciones: 'a'.repeat(500),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar observaciones de más de 500 caracteres', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        observaciones: 'a'.repeat(501),
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar observaciones con tipo no string', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        observaciones: 123,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validación de detalles', () => {
    it('debe aceptar detalles omitidos', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data.detalles).toBeUndefined();
    });

    it('debe rechazar detalles cuando no es un arreglo', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        detalles: {},
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar detalles cuando es un string', () => {
      const result = createPedidoSchema.safeParse({
        total: 100,
        detalles: 'detalle',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('updateEstadoSchema', () => {
  describe('casos válidos', () => {
    it('debe aceptar estado en mayúsculas', () => {
      const result = updateEstadoSchema.safeParse({
        estado: 'PENDIENTE',
      });

      expect(result.success).toBe(true);
      expect(result.data.estado).toBe('PENDIENTE');
    });

    it('debe normalizar estado en minúsculas a mayúsculas', () => {
      const result = updateEstadoSchema.safeParse({
        estado: 'pendiente',
      });

      expect(result.success).toBe(true);
      expect(result.data.estado).toBe('PENDIENTE');
    });

    it('debe normalizar estado mixto a mayúsculas', () => {
      const result = updateEstadoSchema.safeParse({
        estado: 'ProCeSaDo',
      });

      expect(result.success).toBe(true);
      expect(result.data.estado).toBe('PROCESADO');
    });

    it('debe eliminar espacios antes de validar', () => {
      const result = updateEstadoSchema.safeParse({
        estado: '  entregado  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.estado).toBe('ENTREGADO');
    });

    it('debe aceptar todos los estados válidos', () => {
      const estados = [
        'PENDIENTE',
        'PROCESADO',
        'ENTREGADO',
        'CANCELADO',
      ];

      for (const estado of estados) {
        const result = updateEstadoSchema.safeParse({ estado });

        expect(result.success).toBe(true);
        expect(result.data.estado).toBe(estado);
      }
    });
  });

  describe('validación de estado', () => {
    it('debe rechazar estado ausente', () => {
      const result = updateEstadoSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('debe rechazar estado vacío', () => {
      const result = updateEstadoSchema.safeParse({
        estado: '',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar estado con solo espacios', () => {
      const result = updateEstadoSchema.safeParse({
        estado: '     ',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar estado inválido', () => {
      const result = updateEstadoSchema.safeParse({
        estado: 'EN_PROCESO',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar estado numérico', () => {
      const result = updateEstadoSchema.safeParse({
        estado: 1,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar estado booleano', () => {
      const result = updateEstadoSchema.safeParse({
        estado: true,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar estado null', () => {
      const result = updateEstadoSchema.safeParse({
        estado: null,
      });

      expect(result.success).toBe(false);
    });
  });
});