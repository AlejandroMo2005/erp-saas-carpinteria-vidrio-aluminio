import { describe, it, expect } from 'vitest';

import {
  crearClienteSchema,
  updateMisDatosSchema,
} from '../../../src/shared/validators/cliente.validators';

describe('cliente.validators', () => {
  describe('crearClienteSchema', () => {
    it('debe aceptar datos válidos', () => {
      const result = crearClienteSchema.safeParse({
        nombre: 'Juan Pérez',
        telefono: '0999999999',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        nombre: 'Juan Pérez',
        telefono: '0999999999',
      });
    });

    it('debe eliminar espacios al inicio y final del nombre', () => {
      const result = crearClienteSchema.safeParse({
        nombre: '  Juan Pérez  ',
        telefono: '0999999999',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Juan Pérez');
    });

    it('debe eliminar espacios al inicio y final del teléfono', () => {
      const result = crearClienteSchema.safeParse({
        nombre: 'Juan Pérez',
        telefono: ' 0999999999  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.telefono).toBe('0999999999');
    });

    it('debe rechazar nombre vacío', () => {
      const result = crearClienteSchema.safeParse({
        nombre: '',
        telefono: '0999999999',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El nombre es requerido'
      );
    });

    it('debe rechazar nombre compuesto únicamente por espacios', () => {
      const result = crearClienteSchema.safeParse({
        nombre: '   ',
        telefono: '0999999999',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El nombre es requerido'
      );
    });

    it('debe rechazar nombre ausente', () => {
      const result = crearClienteSchema.safeParse({
        telefono: '0999999999',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    });

    it('debe rechazar nombre mayor a 150 caracteres', () => {
      const result = crearClienteSchema.safeParse({
        nombre: 'A'.repeat(151),
        telefono: '0999999999',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El nombre no puede superar 150 caracteres'
      );
    });

    it('debe rechazar teléfono vacío', () => {
      const result = crearClienteSchema.safeParse({
        nombre: 'Juan Pérez',
        telefono: '',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El teléfono es requerido'
      );
    });

    it('debe rechazar teléfono compuesto únicamente por espacios', () => {
      const result = crearClienteSchema.safeParse({
        nombre: 'Juan Pérez',
        telefono: '   ',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El teléfono es requerido'
      );
    });

    it('debe rechazar teléfono ausente', () => {
      const result = crearClienteSchema.safeParse({
        nombre: 'Juan Pérez',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    });

    it('debe rechazar teléfono mayor a 20 caracteres', () => {
      const result = crearClienteSchema.safeParse({
        nombre: 'Juan Pérez',
        telefono: '1'.repeat(21),
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El teléfono no puede superar 20 caracteres'
      );
    });
  });

  describe('updateMisDatosSchema', () => {
    it('debe aceptar únicamente nombre', () => {
      const result = updateMisDatosSchema.safeParse({
        nombre: 'Juan Pérez',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Juan Pérez');
    });

    it('debe aceptar únicamente teléfono', () => {
      const result = updateMisDatosSchema.safeParse({
        telefono: '0999999999',
      });

      expect(result.success).toBe(true);
      expect(result.data.telefono).toBe('0999999999');
    });

    it('debe aceptar nombre y teléfono', () => {
      const result = updateMisDatosSchema.safeParse({
        nombre: 'Juan Pérez',
        telefono: '0999999999',
      });

      expect(result.success).toBe(true);
    });

    it('debe normalizar espacios del nombre', () => {
      const result = updateMisDatosSchema.safeParse({
        nombre: '  Juan Pérez  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Juan Pérez');
    });

    it('debe normalizar espacios del teléfono', () => {
      const result = updateMisDatosSchema.safeParse({
        telefono: ' 0999999999 ',
      });

      expect(result.success).toBe(true);
      expect(result.data.telefono).toBe('0999999999');
    });

    it('debe rechazar objeto vacío', () => {
      const result = updateMisDatosSchema.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Debes enviar al menos nombre o teléfono para actualizar'
      );
    });

    it('debe rechazar nombre vacío y teléfono ausente', () => {
      const result = updateMisDatosSchema.safeParse({
        nombre: '',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Debes enviar al menos nombre o teléfono para actualizar'
      );
    });

    it('debe rechazar teléfono vacío y nombre ausente', () => {
      const result = updateMisDatosSchema.safeParse({
        telefono: '',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Debes enviar al menos nombre o teléfono para actualizar'
      );
    });

    it('debe rechazar ambos campos compuestos únicamente por espacios', () => {
      const result = updateMisDatosSchema.safeParse({
        nombre: '   ',
        telefono: '   ',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Debes enviar al menos nombre o teléfono para actualizar'
      );
    });

    it('debe aceptar nombre dentro del límite de 150 caracteres', () => {
      const result = updateMisDatosSchema.safeParse({
        nombre: 'A'.repeat(150),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar nombre mayor a 150 caracteres', () => {
      const result = updateMisDatosSchema.safeParse({
        nombre: 'A'.repeat(151),
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar teléfono dentro del límite de 20 caracteres', () => {
      const result = updateMisDatosSchema.safeParse({
        telefono: '1'.repeat(20),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar teléfono mayor a 20 caracteres', () => {
      const result = updateMisDatosSchema.safeParse({
        telefono: '1'.repeat(21),
      });

      expect(result.success).toBe(false);
    });
  });
});