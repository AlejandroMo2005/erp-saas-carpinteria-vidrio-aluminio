import { describe, it, expect } from 'vitest';

const {
  updateMeSchema,
  createUsuarioSchema,
  updateRolSchema,
  toggleActivoSchema,
} = require('../../../src/shared/validators/usuario.validators');

describe('usuario.validators', () => {
  describe('updateMeSchema', () => {
    it('debe aceptar objeto vacío', () => {
      const result = updateMeSchema.safeParse({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('debe rechazar password sin passwordActual', () => {
      const result = updateMeSchema.safeParse({
        password: 'nueva123',
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar cambio de password con passwordActual', () => {
      const result = updateMeSchema.safeParse({
        password: 'nueva123',
        passwordActual: 'actual123',
      });

      expect(result.success).toBe(true);
      expect(result.data.password).toBe('nueva123');
      expect(result.data.passwordActual).toBe('actual123');
    });

    it('debe aceptar passwordActual sin password', () => {
      const result = updateMeSchema.safeParse({
        passwordActual: 'actual123',
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar password con menos de 6 caracteres', () => {
      const result = updateMeSchema.safeParse({
        password: '12345',
        passwordActual: 'actual123',
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar password de exactamente 6 caracteres', () => {
      const result = updateMeSchema.safeParse({
        password: '123456',
        passwordActual: 'actual123',
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar password de tipo no string', () => {
      const result = updateMeSchema.safeParse({
        password: 123456,
        passwordActual: 'actual123',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar passwordActual vacío cuando acompaña a password', () => {
      const result = updateMeSchema.safeParse({
        password: 'nueva123',
        passwordActual: '',
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar email válido', () => {
      const result = updateMeSchema.safeParse({
        email: 'usuario@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('usuario@example.com');
    });

    it('debe normalizar espacios del email', () => {
      const result = updateMeSchema.safeParse({
        email: '  usuario@example.com  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('usuario@example.com');
    });

    it('debe aceptar email vacío', () => {
      const result = updateMeSchema.safeParse({
        email: '',
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('');
    });

    it('debe rechazar email inválido', () => {
      const result = updateMeSchema.safeParse({
        email: 'correo-invalido',
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar email ausente', () => {
      const result = updateMeSchema.safeParse({});

      expect(result.success).toBe(true);
      expect(result.data.email).toBeUndefined();
    });

    it('debe rechazar email de tipo no string', () => {
      const result = updateMeSchema.safeParse({
        email: 123,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar cedula de 10 dígitos', () => {
      const result = updateMeSchema.safeParse({
        cedula_ruc: '1312345678',
      });

      expect(result.success).toBe(true);
      expect(result.data.cedula_ruc).toBe('1312345678');
    });

    it('debe aceptar RUC de 13 dígitos', () => {
      const result = updateMeSchema.safeParse({
        cedula_ruc: '1312345678001',
      });

      expect(result.success).toBe(true);
      expect(result.data.cedula_ruc).toBe('1312345678001');
    });

    it('debe normalizar espacios de cedula_ruc', () => {
      const result = updateMeSchema.safeParse({
        cedula_ruc: '  1312345678  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.cedula_ruc).toBe('1312345678');
    });

    it('debe rechazar cedula_ruc con menos de 10 dígitos', () => {
      const result = updateMeSchema.safeParse({
        cedula_ruc: '123456789',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar cedula_ruc con 11 dígitos', () => {
      const result = updateMeSchema.safeParse({
        cedula_ruc: '12345678901',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar cedula_ruc con 12 dígitos', () => {
      const result = updateMeSchema.safeParse({
        cedula_ruc: '123456789012',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar cedula_ruc con 14 dígitos', () => {
      const result = updateMeSchema.safeParse({
        cedula_ruc: '12345678901234',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar cedula_ruc con letras', () => {
      const result = updateMeSchema.safeParse({
        cedula_ruc: '131234567A',
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar cedula_ruc null', () => {
      const result = updateMeSchema.safeParse({
        cedula_ruc: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.cedula_ruc).toBeNull();
    });

    it('debe rechazar cedula_ruc como número', () => {
      const result = updateMeSchema.safeParse({
        cedula_ruc: 1312345678,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar nombre válido', () => {
      const result = updateMeSchema.safeParse({
        nombre: 'Alejandro',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Alejandro');
    });

    it('debe normalizar espacios del nombre', () => {
      const result = updateMeSchema.safeParse({
        nombre: '  Alejandro  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Alejandro');
    });

    it('debe aceptar nombre de exactamente 100 caracteres', () => {
      const result = updateMeSchema.safeParse({
        nombre: 'a'.repeat(100),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar nombre de más de 100 caracteres', () => {
      const result = updateMeSchema.safeParse({
        nombre: 'a'.repeat(101),
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar nombre con tipo no string', () => {
      const result = updateMeSchema.safeParse({
        nombre: 123,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar nombre_completo válido', () => {
      const result = updateMeSchema.safeParse({
        nombre_completo: 'Juan Pérez',
      });

      expect(result.success).toBe(true);
    });

    it('debe normalizar espacios de nombre_completo', () => {
      const result = updateMeSchema.safeParse({
        nombre_completo: '  Juan Pérez  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre_completo).toBe('Juan Pérez');
    });

    it('debe aceptar nombre_completo de exactamente 150 caracteres', () => {
      const result = updateMeSchema.safeParse({
        nombre_completo: 'a'.repeat(150),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar nombre_completo de más de 150 caracteres', () => {
      const result = updateMeSchema.safeParse({
        nombre_completo: 'a'.repeat(151),
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar nombre_completo con tipo no string', () => {
      const result = updateMeSchema.safeParse({
        nombre_completo: 123,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar telefono válido', () => {
      const result = updateMeSchema.safeParse({
        telefono: '0991234567',
      });

      expect(result.success).toBe(true);
    });

    it('debe normalizar espacios del telefono', () => {
      const result = updateMeSchema.safeParse({
        telefono: ' 0991234567 ',
      });

      expect(result.success).toBe(true);
      expect(result.data.telefono).toBe('0991234567');
    });

    it('debe aceptar telefono vacío', () => {
      const result = updateMeSchema.safeParse({
        telefono: '',
      });

      expect(result.success).toBe(true);
      expect(result.data.telefono).toBe('');
    });

    it('debe aceptar telefono null', () => {
      const result = updateMeSchema.safeParse({
        telefono: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.telefono).toBeNull();
    });

    it('debe aceptar telefono de exactamente 20 caracteres', () => {
      const result = updateMeSchema.safeParse({
        telefono: '1'.repeat(20),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar telefono de más de 20 caracteres', () => {
      const result = updateMeSchema.safeParse({
        telefono: '1'.repeat(21),
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar telefono con tipo no string', () => {
      const result = updateMeSchema.safeParse({
        telefono: 999999999,
      });

      expect(result.success).toBe(false);
    });

    it('debe conservar campos adicionales por passthrough', () => {
      const result = updateMeSchema.safeParse({
        nombre: 'Alejandro',
        campo_extra: 'valor adicional',
        otro_campo: 123,
      });

      expect(result.success).toBe(true);
      expect(result.data.campo_extra).toBe('valor adicional');
      expect(result.data.otro_campo).toBe(123);
    });

    it('debe rechazar cambio de password sin passwordActual', () => {
      const result = updateMeSchema.safeParse({
        password: 'nueva123',
        nombre: 'Alejandro',
      });

      expect(result.success).toBe(false);

      const issue = result.error.issues.find(
        (item) => item.path.includes('passwordActual')
      );

      expect(issue).toBeDefined();
      expect(issue.message).toBe(
        'Debes proporcionar tu contraseña actual para poder cambiarla'
      );
    });

    it('debe aceptar todos los campos válidos simultáneamente', () => {
      const result = updateMeSchema.safeParse({
        password: 'nueva123',
        passwordActual: 'actual123',
        email: '  usuario@example.com  ',
        cedula_ruc: '  1312345678  ',
        nombre: '  Alejandro  ',
        nombre_completo: '  Alejandro Pérez  ',
        telefono: ' 0991234567 ',
        campo_extra: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('usuario@example.com');
      expect(result.data.cedula_ruc).toBe('1312345678');
      expect(result.data.nombre).toBe('Alejandro');
      expect(result.data.nombre_completo).toBe('Alejandro Pérez');
      expect(result.data.telefono).toBe('0991234567');
      expect(result.data.campo_extra).toBe(true);
    });
  });

  describe('createUsuarioSchema', () => {
    const usuarioValido = {
      nombre: 'Alejandro',
      email: 'usuario@example.com',
      password: 'secreto123',
      rol: 'VENDEDOR',
    };

    it('debe aceptar usuario completo', () => {
      const result = createUsuarioSchema.safeParse(usuarioValido);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(usuarioValido);
    });

    it('debe normalizar espacios del nombre', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        nombre: '  Alejandro  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Alejandro');
    });

    it('debe aceptar nombre de exactamente 100 caracteres', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        nombre: 'a'.repeat(100),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar nombre vacío', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        nombre: '',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar nombre de más de 100 caracteres', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        nombre: 'a'.repeat(101),
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar nombre ausente', () => {
      const { nombre, ...sinNombre } = usuarioValido;

      const result = createUsuarioSchema.safeParse(sinNombre);

      expect(result.success).toBe(false);
    });

    it('debe rechazar nombre con tipo no string', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        nombre: 123,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar email válido', () => {
      const result = createUsuarioSchema.safeParse(usuarioValido);

      expect(result.success).toBe(true);
    });

    it('debe convertir email a minúsculas', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        email: 'Usuario@EXAMPLE.COM',
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('usuario@example.com');
    });

    it('debe eliminar espacios del email antes de convertirlo a minúsculas', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        email: '  Usuario@EXAMPLE.COM  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('usuario@example.com');
    });

    it('debe rechazar email inválido', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        email: 'correo-invalido',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar email vacío', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        email: '',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar email ausente', () => {
      const { email, ...sinEmail } = usuarioValido;

      const result = createUsuarioSchema.safeParse(sinEmail);

      expect(result.success).toBe(false);
    });

    it('debe rechazar email con tipo no string', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        email: 123,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar password de exactamente 6 caracteres', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        password: '123456',
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar password de menos de 6 caracteres', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        password: '12345',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar password ausente', () => {
      const { password, ...sinPassword } = usuarioValido;

      const result = createUsuarioSchema.safeParse(sinPassword);

      expect(result.success).toBe(false);
    });

    it('debe rechazar password con tipo no string', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        password: 123456,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar todos los roles válidos', () => {
      for (const rol of ['ADMIN', 'VENDEDOR', 'ALMACEN', 'CLIENTE']) {
        const result = createUsuarioSchema.safeParse({
          ...usuarioValido,
          rol,
        });

        expect(result.success).toBe(true);
        expect(result.data.rol).toBe(rol);
      }
    });

    it('debe rechazar rol inválido', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        rol: 'SUPERADMIN',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar rol ausente', () => {
      const { rol, ...sinRol } = usuarioValido;

      const result = createUsuarioSchema.safeParse(sinRol);

      expect(result.success).toBe(false);
    });

    it('debe rechazar rol con tipo no string', () => {
      const result = createUsuarioSchema.safeParse({
        ...usuarioValido,
        rol: 1,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('updateRolSchema', () => {
    it('debe aceptar rol ADMIN', () => {
      const result = updateRolSchema.safeParse({
        rol: 'ADMIN',
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar rol VENDEDOR', () => {
      const result = updateRolSchema.safeParse({
        rol: 'VENDEDOR',
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar rol ALMACEN', () => {
      const result = updateRolSchema.safeParse({
        rol: 'ALMACEN',
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar rol CLIENTE', () => {
      const result = updateRolSchema.safeParse({
        rol: 'CLIENTE',
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar rol inválido', () => {
      const result = updateRolSchema.safeParse({
        rol: 'GERENTE',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar rol ausente', () => {
      const result = updateRolSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('debe rechazar rol vacío', () => {
      const result = updateRolSchema.safeParse({
        rol: '',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar rol con tipo no string', () => {
      const result = updateRolSchema.safeParse({
        rol: 1,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('toggleActivoSchema', () => {
    it('debe aceptar activo true', () => {
      const result = toggleActivoSchema.safeParse({
        activo: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.activo).toBe(true);
    });

    it('debe aceptar activo false', () => {
      const result = toggleActivoSchema.safeParse({
        activo: false,
      });

      expect(result.success).toBe(true);
      expect(result.data.activo).toBe(false);
    });

    it('debe rechazar activo ausente', () => {
      const result = toggleActivoSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('debe rechazar activo como string true', () => {
      const result = toggleActivoSchema.safeParse({
        activo: 'true',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar activo como string false', () => {
      const result = toggleActivoSchema.safeParse({
        activo: 'false',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar activo como número 1', () => {
      const result = toggleActivoSchema.safeParse({
        activo: 1,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar activo como número 0', () => {
      const result = toggleActivoSchema.safeParse({
        activo: 0,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar activo como null', () => {
      const result = toggleActivoSchema.safeParse({
        activo: null,
      });

      expect(result.success).toBe(false);
    });
  });
});
