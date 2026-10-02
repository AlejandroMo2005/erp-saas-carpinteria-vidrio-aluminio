import { describe, expect, it } from 'vitest';
import {
  sanitizar,
  normalizarTelefono,
  mensajeError,
  extraerColor,
  generarMensajeWA,
  esColorClaro,
} from '@/presentation/components/Proformas/utils/proformaUtils';

describe('proformaUtils', () => {
  describe('sanitizar', () => {
    it('elimina caracteres HTML peligrosos, limita longitud y recorta espacios', () => {
      const entrada = `  <script>"hola" 'mundo' \`test\` </script>  `;

      expect(sanitizar(entrada)).toBe('scripthola mundo test /script');
    });

    it('maneja null y undefined', () => {
      expect(sanitizar(null)).toBe('');
      expect(sanitizar(undefined)).toBe('');
    });

    it('convierte valores a string', () => {
      expect(sanitizar(12345)).toBe('12345');
    });

    it('limita el texto a TEXTO_MAX caracteres', () => {
      expect(sanitizar('a'.repeat(250))).toHaveLength(200);
    });
  });

  describe('normalizarTelefono', () => {
    it('convierte un celular ecuatoriano de 10 dígitos a formato internacional', () => {
      expect(normalizarTelefono('0999999999')).toBe('593999999999');
    });

    it('convierte un celular de 9 dígitos que inicia en 9', () => {
      expect(normalizarTelefono('999999999')).toBe('593999999999');
    });

    it('elimina caracteres no numéricos', () => {
      expect(normalizarTelefono('+593 99-999-9999')).toBe('593999999999');
    });

    it('mantiene números que no cumplen las reglas de conversión', () => {
      expect(normalizarTelefono('12345678')).toBe('12345678');
    });
  });

  describe('mensajeError', () => {
    it('detecta stock insuficiente y extrae el color mencionado', () => {
      const error = {
        response: {
          status: 422,
          data: {
            message: 'Stock insuficiente para material (Negro Mate)',
          },
        },
      };

      expect(mensajeError(error)).toContain('Negro Mate');
    });

    it('maneja stock insuficiente sin color', () => {
      const error = {
        response: {
          status: 422,
          data: {
            message: 'Stock insuficiente',
          },
        },
      };

      expect(mensajeError(error)).toBe(
        'Material insuficiente para este color. Intenta con otro color o indícalo en el campo Detalle y nos pondremos en contacto.'
      );
    });

    it('prioriza el mensaje enviado por el servidor', () => {
      expect(
        mensajeError({
          response: {
            status: 400,
            data: { message: 'Campo cliente inválido' },
          },
        })
      ).toBe('Campo cliente inválido');
    });

    it('usa el error del servidor cuando viene en data.error', () => {
      expect(
        mensajeError({
          response: {
            status: 400,
            data: { error: 'Error de validación' },
          },
        })
      ).toBe('Error de validación');
    });

    it('devuelve mensajes específicos según el código HTTP', () => {
      expect(mensajeError({ response: { status: 400 } })).toBe(
        'Datos inválidos. Revisa los campos del formulario.'
      );
      expect(mensajeError({ response: { status: 401 } })).toBe(
        'Sesión expirada. Vuelve a iniciar sesión.'
      );
      expect(mensajeError({ response: { status: 403 } })).toBe(
        'Sin permisos para realizar esta acción.'
      );
      expect(mensajeError({ response: { status: 404 } })).toBe(
        'Recurso no encontrado en el servidor.'
      );
      expect(mensajeError({ response: { status: 409 } })).toBe(
        'Conflicto: ya existe un registro similar.'
      );
      expect(mensajeError({ response: { status: 500 } })).toBe(
        'Error interno del servidor. Intenta más tarde.'
      );
    });

    it('usa el mensaje del error cuando no existe respuesta HTTP', () => {
      expect(mensajeError({ message: 'Fallo de conexión' })).toBe(
        'Fallo de conexión'
      );
    });

    it('usa el mensaje genérico cuando no hay información del error', () => {
      expect(mensajeError({})).toBe('Error inesperado. Intenta de nuevo.');
    });
  });

  describe('extraerColor', () => {
    it('prioriza los campos conocidos', () => {
      expect(
        extraerColor({
          valor: ' #ffffff ',
          hex: '#000000',
        })
      ).toBe('#ffffff');
    });

    it('busca un color hexadecimal entre los valores del objeto', () => {
      expect(
        extraerColor({
          nombre: 'Blanco',
          descripcion: ' #abc123 ',
        })
      ).toBe('#abc123');
    });

    it('detecta colores rgb y rgba', () => {
      expect(extraerColor({ valor: 'rgb(255, 0, 0)' })).toBe(
        'rgb(255, 0, 0)'
      );
      expect(extraerColor({ descripcion: 'rgba(0, 0, 0, 0.5)' })).toBe(
        'rgba(0, 0, 0, 0.5)'
      );
    });

    it('detecta colores hsl', () => {
      expect(extraerColor({ descripcion: 'hsl(120, 100%, 50%)' })).toBe(
        'hsl(120, 100%, 50%)'
      );
    });

    it('ignora valores que no son strings', () => {
      expect(
        extraerColor({
          numero: 123,
          activo: true,
          objeto: {},
          descripcion: '#123456',
        })
      ).toBe('#123456');
    });

    it('devuelve cadena vacía si no encuentra un color', () => {
      expect(extraerColor(null)).toBe('');
      expect(extraerColor({ nombre: 'Rojo' })).toBe('');
    });
  });

  describe('generarMensajeWA', () => {
    it('genera el mensaje completo de WhatsApp', () => {
      const cliente = 'Juan Pérez';
      const items = [
        {
          nombre_trabajo: 'Ventana',
          nombre_color: 'Negro',
          ancho: 1.2,
          alto: 2,
          cantidad: 2,
          subtotal: 120,
        },
        {
          nombre_trabajo: '',
          nombre_color: 'Sin usar',
          ancho: 1,
          alto: 1,
          cantidad: 1,
          subtotal: 50,
        },
        {
          nombre_trabajo: 'Puerta',
          nombre_color: '',
          ancho: 2,
          alto: 2.5,
          cantidad: 1,
          subtotal: 0,
        },
      ];

      const resumen = {
        subtotal: 120,
        iva: 18,
        total: 138,
        iva_valor: 0.15,
      };

      expect(generarMensajeWA(cliente, items, resumen)).toBe(
        'Hola Juan Pérez, su proforma:\n\n' +
        '1. Ventana — Negro (1.2×2, x2) $120.00\n' +
        '2. Puerta (2×2.5, x1)' +
        '\n\nSubtotal: $120.00' +
        '\nIVA 15%: $18.00' +
        '\n*TOTAL: $138.00*'
      );
    });

    it('usa saludo genérico cuando el cliente está vacío', () => {
      const mensaje = generarMensajeWA(
        '   ',
        [],
        { subtotal: 0, iva: 0, total: 0, iva_valor: 0.15 }
      );

      expect(mensaje).toContain('Hola estimado/a, su proforma:');
      expect(mensaje).toContain('Subtotal: $0.00');
      expect(mensaje).toContain('IVA 15%: $0.00');
      expect(mensaje).toContain('*TOTAL: $0.00*');
    });
  });

  describe('esColorClaro', () => {
    it('considera claro un rgba con transparencia alta', () => {
      expect(esColorClaro('rgba(0, 0, 0, 0.4)')).toBe(true);
    });

    it('evalúa luminosidad en RGB', () => {
      expect(esColorClaro('rgb(255, 255, 255)')).toBe(true);
      expect(esColorClaro('rgb(0, 0, 0)')).toBe(false);
    });

    it('considera claro un hex de 3 caracteres', () => {
      expect(esColorClaro('#fff')).toBe(true);
      expect(esColorClaro('#000')).toBe(false);
    });

    it('evalúa un hex de 6 caracteres', () => {
      expect(esColorClaro('#eeeeee')).toBe(true);
      expect(esColorClaro('#111111')).toBe(false);
    });

    it('devuelve false para colores inválidos o vacíos', () => {
      expect(esColorClaro('')).toBe(false);
      expect(esColorClaro(null)).toBe(false);
      expect(esColorClaro('not-a-color')).toBe(false);
    });

    it('considera alpha ausente como 1', () => {
      expect(esColorClaro('rgba(255, 255, 255)')).toBe(true);
    });
  });
});
