import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
  generarPlantilla,
  generarUrlWhatsApp,
} = require('../../../src/shared/services/proveedorService');

describe('proveedorService', () => {
  describe('generarPlantilla', () => {
    it('debe generar una plantilla completa con proveedor e items', () => {
      const resultado = generarPlantilla('Aluminios Manabí', [
        {
          nombre_material: 'Perfil de aluminio',
          cantidad: 10,
          unidad: 'metros',
        },
        {
          nombre_material: 'Vidrio templado',
          cantidad: 5,
          unidad: 'm2',
        },
      ]);

      expect(resultado).toBe(
        'Buenos dias Aluminios Manabí,\n' +
        '\n' +
        'Por medio de la presente solicito que me facture los siguientes materiales:\n' +
        '\n' +
        '1. Perfil de aluminio - 10 metros\n' +
        '2. Vidrio templado - 5 m2\n' +
        '\n' +
        'Quedo atento/a a su confirmacion.\n' +
        'Gracias.'
      );
    });

    it('debe usar estimado/a cuando el nombre del proveedor es null', () => {
      const resultado = generarPlantilla(null, [
        {
          nombre_material: 'Perfil',
          cantidad: 2,
          unidad: 'm',
        },
      ]);

      expect(resultado).toContain('Buenos dias estimado/a,');
    });

    it('debe usar estimado/a cuando el nombre del proveedor es undefined', () => {
      const resultado = generarPlantilla(undefined, [
        {
          nombre_material: 'Perfil',
          cantidad: 2,
          unidad: 'm',
        },
      ]);

      expect(resultado).toContain('Buenos dias estimado/a,');
    });

    it('debe usar estimado/a cuando el nombre del proveedor queda vacío después de trim', () => {
      const resultado = generarPlantilla('   ', [
        {
          nombre_material: 'Perfil',
          cantidad: 2,
          unidad: 'm',
        },
      ]);

      expect(resultado).toContain('Buenos dias estimado/a,');
    });

    it('debe convertir a texto y limpiar espacios del nombre del proveedor', () => {
      const resultado = generarPlantilla(
        { toString: () => '  Proveedor ABC  ' },
        []
      );

      expect(resultado).toContain('Buenos dias Proveedor ABC,');
    });

    it('debe tratar items no array como lista vacía', () => {
      const resultado = generarPlantilla('Proveedor', null);

      expect(resultado).toBe(
        'Buenos dias Proveedor,\n' +
        '\n' +
        'No se especificaron materiales.\n' +
        '\n' +
        'Quedo atento/a a su confirmacion.\n' +
        'Gracias.'
      );
    });

    it('debe generar mensaje sin materiales cuando items es undefined', () => {
      const resultado = generarPlantilla('Proveedor', undefined);

      expect(resultado).toContain('No se especificaron materiales.');
    });

    it('debe generar mensaje sin materiales cuando el array está vacío', () => {
      const resultado = generarPlantilla('Proveedor', []);

      expect(resultado).toContain('No se especificaron materiales.');
    });

    it('debe usar Material sin nombre cuando falta nombre_material', () => {
      const resultado = generarPlantilla('Proveedor', [
        {
          cantidad: 3,
          unidad: 'unidades',
        },
      ]);

      expect(resultado).toContain(
        '1. Material sin nombre - 3 unidades'
      );
    });

    it('debe usar Material sin nombre cuando nombre_material es null', () => {
      const resultado = generarPlantilla('Proveedor', [
        {
          nombre_material: null,
          cantidad: 3,
        },
      ]);

      expect(resultado).toContain(
        '1. Material sin nombre - 3'
      );
    });

    it('debe limpiar espacios del nombre del material', () => {
      const resultado = generarPlantilla('Proveedor', [
        {
          nombre_material: '  Vidrio  ',
          cantidad: 2,
          unidad: ' m2 ',
        },
      ]);

      expect(resultado).toContain('1. Vidrio - 2 m2');
    });

    it('debe convertir cantidad numérica correctamente', () => {
      const resultado = generarPlantilla('Proveedor', [
        {
          nombre_material: 'Perfil',
          cantidad: '12.5',
          unidad: 'm',
        },
      ]);

      expect(resultado).toContain('1. Perfil - 12.5 m');
    });

    it('debe usar cantidad 0 cuando cantidad es null', () => {
      const resultado = generarPlantilla('Proveedor', [
        {
          nombre_material: 'Perfil',
          cantidad: null,
          unidad: 'm',
        },
      ]);

      expect(resultado).toContain('1. Perfil - 0 m');
    });

    it('debe usar cantidad 0 cuando cantidad es undefined', () => {
      const resultado = generarPlantilla('Proveedor', [
        {
          nombre_material: 'Perfil',
          unidad: 'm',
        },
      ]);

      expect(resultado).toContain('1. Perfil - 0 m');
    });

    it('debe omitir la unidad cuando está vacía', () => {
      const resultado = generarPlantilla('Proveedor', [
        {
          nombre_material: 'Perfil',
          cantidad: 4,
          unidad: '   ',
        },
      ]);

      expect(resultado).toContain('1. Perfil - 4');
      expect(resultado).not.toContain('1. Perfil - 4 ');
    });

    it('debe omitir la unidad cuando no existe', () => {
      const resultado = generarPlantilla('Proveedor', [
        {
          nombre_material: 'Perfil',
          cantidad: 4,
        },
      ]);

      expect(resultado).toContain('1. Perfil - 4');
    });

    it('debe soportar items null mediante optional chaining', () => {
      const resultado = generarPlantilla('Proveedor', [null]);

      expect(resultado).toContain(
        '1. Material sin nombre - 0'
      );
    });

    it('debe soportar items undefined mediante optional chaining', () => {
      const resultado = generarPlantilla('Proveedor', [undefined]);

      expect(resultado).toContain(
        '1. Material sin nombre - 0'
      );
    });

    it('debe enumerar correctamente múltiples materiales', () => {
      const resultado = generarPlantilla('Proveedor', [
        { nombre_material: 'A', cantidad: 1 },
        { nombre_material: 'B', cantidad: 2 },
        { nombre_material: 'C', cantidad: 3 },
      ]);

      expect(resultado).toContain('1. A - 1');
      expect(resultado).toContain('2. B - 2');
      expect(resultado).toContain('3. C - 3');
    });
  });

  describe('generarUrlWhatsApp', () => {
    it('debe retornar null cuando no existe teléfono', () => {
      expect(generarUrlWhatsApp(null, 'Hola')).toBeNull();
    });

    it('debe retornar null cuando el teléfono es undefined', () => {
      expect(generarUrlWhatsApp(undefined, 'Hola')).toBeNull();
    });

    it('debe retornar null cuando el teléfono es una cadena vacía', () => {
      expect(generarUrlWhatsApp('', 'Hola')).toBeNull();
    });

    it('debe retornar null cuando el teléfono tiene menos de 7 dígitos', () => {
      expect(generarUrlWhatsApp('123456', 'Hola')).toBeNull();
    });

    it('debe eliminar caracteres no numéricos del teléfono', () => {
      const resultado = generarUrlWhatsApp(
        '+593 99-123-4567',
        'Hola proveedor'
      );

      expect(resultado).toBe(
        'https://api.whatsapp.com/send?phone=593991234567&text=Hola%20proveedor'
      );
    });

    it('debe codificar correctamente el texto del mensaje', () => {
      const resultado = generarUrlWhatsApp(
        '0991234567',
        'Hola & gracias / confirmar?'
      );

      expect(resultado).toBe(
        'https://api.whatsapp.com/send?phone=0991234567&text=Hola%20%26%20gracias%20%2F%20confirmar%3F'
      );
    });

    it('debe usar texto vacío cuando el mensaje es null', () => {
      const resultado = generarUrlWhatsApp('0991234567', null);

      expect(resultado).toBe(
        'https://api.whatsapp.com/send?phone=0991234567&text='
      );
    });

    it('debe usar texto vacío cuando el mensaje es undefined', () => {
      const resultado = generarUrlWhatsApp('0991234567', undefined);

      expect(resultado).toBe(
        'https://api.whatsapp.com/send?phone=0991234567&text='
      );
    });

    it('debe aceptar un teléfono numérico', () => {
      const resultado = generarUrlWhatsApp(593991234567, 'Hola');

      expect(resultado).toBe(
        'https://api.whatsapp.com/send?phone=593991234567&text=Hola'
      );
    });

    it('debe retornar null cuando después de limpiar no quedan suficientes dígitos', () => {
      expect(generarUrlWhatsApp('abc-12-def', 'Hola')).toBeNull();
    });
  });
});
