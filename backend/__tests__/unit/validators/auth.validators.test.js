import { describe, it, expect } from 'vitest';

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
} from '../../../src/shared/validators/auth.validators';

describe('auth.validators', () => {
  describe('loginSchema', () => {
    it('debe aceptar credenciales válidas', () => {
      const result = loginSchema.safeParse({
        email: 'usuario@example.com',
        password: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        email: 'usuario@example.com',
        password: '123456',
      });
    });

    it('debe normalizar espacios y mayúsculas del email', () => {
      const result = loginSchema.safeParse({
        email: '  USUARIO@EXAMPLE.COM  ',
        password: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('usuario@example.com');
    });

    it('debe rechazar un email inválido', () => {
      const result = loginSchema.safeParse({
        email: 'correo-invalido',
        password: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El email no tiene un formato válido'
      );
    });

    it('debe rechazar un email vacío', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: '123456',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar email ausente', () => {
      const result = loginSchema.safeParse({
        password: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    });

    it('debe rechazar contraseña ausente', () => {
      const result = loginSchema.safeParse({
        email: 'usuario@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    });

    it('debe rechazar contraseña vacía', () => {
      const result = loginSchema.safeParse({
        email: 'usuario@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'La contraseña es obligatoria'
      );
    });
  });

  describe('registerSchema', () => {
    it('debe aceptar datos válidos', () => {
      const result = registerSchema.safeParse({
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        password: '123456',
      });

      expect(result.success).toBe(true);
    });

    it('debe normalizar el nombre', () => {
      const result = registerSchema.safeParse({
        nombre: '  Juan Pérez  ',
        email: 'juan@example.com',
        password: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Juan Pérez');
    });

    it('debe rechazar nombre vacío', () => {
      const result = registerSchema.safeParse({
        nombre: '',
        email: 'juan@example.com',
        password: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El nombre es obligatorio'
      );
    });

    it('debe rechazar nombre ausente', () => {
      const result = registerSchema.safeParse({
        email: 'juan@example.com',
        password: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    });

    it('debe rechazar nombre mayor a 100 caracteres', () => {
      const result = registerSchema.safeParse({
        nombre: 'A'.repeat(101),
        email: 'juan@example.com',
        password: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El nombre no puede superar 100 caracteres'
      );
    });

    it('debe rechazar contraseña menor a 6 caracteres', () => {
      const result = registerSchema.safeParse({
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        password: '12345',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'La contraseña debe tener al menos 6 caracteres'
      );
    });

    it('debe rechazar contraseña ausente', () => {
      const result = registerSchema.safeParse({
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    });
  });

  describe('forgotPasswordSchema', () => {
    it('debe aceptar un email válido', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'usuario@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('usuario@example.com');
    });

    it('debe normalizar el email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: '  USUARIO@EXAMPLE.COM ',
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('usuario@example.com');
    });

    it('debe rechazar email inválido', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'correo-invalido',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El email no tiene un formato válido'
      );
    });

    it('debe rechazar email ausente', () => {
      const result = forgotPasswordSchema.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    });
  });

  describe('verifyCodeSchema', () => {
    it('debe aceptar token y código como string', () => {
      const result = verifyCodeSchema.safeParse({
        token: 'abc123',
        code: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.data.code).toBe('123456');
    });

    it('debe aceptar código numérico', () => {
      const result = verifyCodeSchema.safeParse({
        token: 'abc123',
        code: 123456,
      });

      expect(result.success).toBe(true);
      expect(result.data.code).toBe('123456');
    });

    it('debe convertir espacios del código a string limpio', () => {
      const result = verifyCodeSchema.safeParse({
        token: 'abc123',
        code: ' 123456 ',
      });

      expect(result.success).toBe(true);
      expect(result.data.code).toBe('123456');
    });

    it('debe rechazar token vacío', () => {
      const result = verifyCodeSchema.safeParse({
        token: '',
        code: '123456',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar token ausente', () => {
      const result = verifyCodeSchema.safeParse({
        code: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    });

    it('debe rechazar código vacío', () => {
      const result = verifyCodeSchema.safeParse({
        token: 'abc123',
        code: '',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El código es requerido'
      );
    });

    it('debe rechazar código compuesto únicamente por espacios', () => {
      const result = verifyCodeSchema.safeParse({
        token: 'abc123',
        code: '   ',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El código es requerido'
      );
    });
  });

  describe('resetPasswordSchema', () => {
    it('debe aceptar datos válidos', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'abc123',
        code: '123456',
        newPassword: '123456',
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar código numérico', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'abc123',
        code: 123456,
        newPassword: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.data.code).toBe('123456');
    });

    it('debe rechazar token vacío', () => {
      const result = resetPasswordSchema.safeParse({
        token: '',
        code: '123456',
        newPassword: '123456',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar token ausente', () => {
      const result = resetPasswordSchema.safeParse({
        code: '123456',
        newPassword: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    });

    it('debe rechazar código vacío', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'abc123',
        code: '',
        newPassword: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El código es requerido'
      );
    });

    it('debe rechazar código compuesto únicamente por espacios', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'abc123',
        code: '   ',
        newPassword: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El código es requerido'
      );
    });

    it('debe rechazar contraseña menor a 6 caracteres', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'abc123',
        code: '123456',
        newPassword: '12345',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'La contraseña debe tener al menos 6 caracteres'
      );
    });

    it('debe rechazar contraseña ausente', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'abc123',
        code: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    });
  });
});