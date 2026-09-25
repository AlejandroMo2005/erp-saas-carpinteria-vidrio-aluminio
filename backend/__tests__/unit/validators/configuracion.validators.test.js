import { actualizarConfigSchema } from '../../../src/shared/validators/configuracion.validators';

describe('actualizarConfigSchema', () => {
  describe('valores válidos', () => {
    test('debe aceptar un valor de tipo string', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: '0.15',
      });

      expect(result.success).toBe(true);
      expect(result.data.valor).toBe('0.15');
    });

    test('debe aceptar un valor de tipo number', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: 0.15,
      });

      expect(result.success).toBe(true);
      expect(result.data.valor).toBe(0.15);
    });

    test('debe aceptar el número cero', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: 0,
      });

      expect(result.success).toBe(true);
      expect(result.data.valor).toBe(0);
    });

    test('debe aceptar números negativos porque el esquema no establece un mínimo', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: -10,
      });

      expect(result.success).toBe(true);
      expect(result.data.valor).toBe(-10);
    });

    test('debe aceptar una cadena de un solo carácter', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: '1',
      });

      expect(result.success).toBe(true);
      expect(result.data.valor).toBe('1');
    });
  });

  describe('valores inválidos', () => {
    test('debe rechazar una cadena vacía', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: '',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El valor no puede estar vacío'
      );
    });

    test('debe rechazar el campo valor ausente', () => {
      const result = actualizarConfigSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    test('debe rechazar un booleano', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: true,
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar null', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: null,
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar un objeto', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: {},
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar un arreglo', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: [],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('comportamiento del objeto', () => {
    test('debe conservar el campo valor cuando es válido', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: 'configuracion',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        valor: 'configuracion',
      });
    });

    test('debe eliminar campos adicionales no definidos por el esquema', () => {
      const result = actualizarConfigSchema.safeParse({
        valor: 0.15,
        campoExtra: 'no permitido explícitamente',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        valor: 0.15,
      });
    });
  });
});
