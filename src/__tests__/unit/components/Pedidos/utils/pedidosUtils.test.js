import { describe, expect, it } from 'vitest';
import { mensajeError, sanitizeForDisplay } from '../../../../../presentation/components/Pedidos/utils/pedidosUtils';

describe('sanitizeForDisplay', () => {
  it('devuelve el texto por defecto cuando recibe texto vacío', () => {
    expect(sanitizeForDisplay('')).toBe('Sin detalles especificados');
  });

  it('devuelve el texto por defecto cuando recibe null o undefined', () => {
    expect(sanitizeForDisplay(null)).toBe('Sin detalles especificados');
    expect(sanitizeForDisplay(undefined)).toBe('Sin detalles especificados');
  });

  it('decodifica entidades HTML permitidas antes de limpiar caracteres peligrosos', () => {
    expect(
      sanitizeForDisplay('&lt;div&gt; &quot;detalle&quot; &#x27;prueba&#x27; &#x2F; &amp; adicional')
    ).toBe('div detalle prueba / & adicional');
  });

  it('elimina etiquetas y caracteres potencialmente peligrosos', () => {
    expect(sanitizeForDisplay('<script>alert("x")</script>`detalle`')).toBe(
      'scriptalert(x)/scriptdetalle'
    );
  });

  it('devuelve el texto por defecto cuando después de limpiar queda vacío', () => {
    expect(sanitizeForDisplay('<>"\'`')).toBe('Sin detalles especificados');
  });

  it('convierte valores no string a texto', () => {
    expect(sanitizeForDisplay(12345)).toBe('12345');
  });

  it('recorta espacios al inicio y al final', () => {
    expect(sanitizeForDisplay('   detalle del pedido   ')).toBe('detalle del pedido');
  });
});

describe('mensajeError', () => {
  it('prioriza el mensaje enviado por el servidor', () => {
    expect(
      mensajeError({
        response: {
          status: 500,
          data: { message: 'Error específico del servidor' },
        },
      })
    ).toBe('Error específico del servidor');
  });

  it('maneja error 400', () => {
    expect(mensajeError({ response: { status: 400 } })).toBe(
      'Solicitud inválida.'
    );
  });

  it('maneja error 401', () => {
    expect(mensajeError({ response: { status: 401 } })).toBe(
      'Sesión expirada. Vuelve a iniciar sesión.'
    );
  });

  it('maneja error 403', () => {
    expect(mensajeError({ response: { status: 403 } })).toBe(
      'Sin permisos para esta acción.'
    );
  });

  it('maneja error 404', () => {
    expect(mensajeError({ response: { status: 404 } })).toBe(
      'Pedido no encontrado.'
    );
  });

  it('maneja error 409', () => {
    expect(mensajeError({ response: { status: 409 } })).toBe(
      'El pedido ya fue modificado por otro usuario.'
    );
  });

  it('maneja errores 5xx', () => {
    expect(mensajeError({ response: { status: 500 } })).toBe(
      'Error del servidor. Intenta más tarde.'
    );
  });

  it('usa el mensaje del error cuando no existe respuesta HTTP', () => {
    expect(mensajeError({ message: 'Error de conexión' })).toBe(
      'Error de conexión'
    );
  });

  it('usa el mensaje genérico como último recurso', () => {
    expect(mensajeError({})).toBe('Error inesperado.');
  });

  it('maneja errores sin objeto de respuesta', () => {
    expect(mensajeError({ response: undefined })).toBe('Error inesperado.');
  });
});
