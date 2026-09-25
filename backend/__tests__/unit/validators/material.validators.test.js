import { describe, it, expect } from 'vitest';

const { updateVarianteSchema } = require('../../../src/shared/validators/material.validators');

describe('updateVarianteSchema', () => {
  describe('casos válidos', () => {
    it('debe aceptar stock entero positivo y precio positivo', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 10,
        precio: 25.50,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        stock: 10,
        precio: 25.50,
      });
    });

    it('debe aceptar stock igual a cero', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 0,
        precio: 25,
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar precio igual a cero', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 10,
        precio: 0,
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar stock y precio iguales a cero', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 0,
        precio: 0,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('validación de stock', () => {
    it('debe rechazar stock decimal', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 10.5,
        precio: 25,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar stock negativo', () => {
      const result = updateVarianteSchema.safeParse({
        stock: -1,
        precio: 25,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar stock ausente', () => {
      const result = updateVarianteSchema.safeParse({
        precio: 25,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar stock con tipo string', () => {
      const result = updateVarianteSchema.safeParse({
        stock: '10',
        precio: 25,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar stock con tipo null', () => {
      const result = updateVarianteSchema.safeParse({
        stock: null,
        precio: 25,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validación de precio', () => {
    it('debe rechazar precio negativo', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 10,
        precio: -0.01,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar precio ausente', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 10,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar precio con tipo string', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 10,
        precio: '25',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar precio con tipo null', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 10,
        precio: null,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar precio booleano', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 10,
        precio: true,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validaciones combinadas', () => {
    it('debe rechazar stock y precio cuando ambos son inválidos', () => {
      const result = updateVarianteSchema.safeParse({
        stock: -5,
        precio: -10,
      });

      expect(result.success).toBe(false);
      expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
    });

    it('debe rechazar ambos campos cuando están ausentes', () => {
      const result = updateVarianteSchema.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error.issues.length).toBe(2);
    });

    it('debe rechazar un stock decimal aunque el precio sea válido', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 5.25,
        precio: 100,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar valores numéricos válidos con precio decimal', () => {
      const result = updateVarianteSchema.safeParse({
        stock: 100,
        precio: 12.75,
      });

      expect(result.success).toBe(true);
    });
  });
});
