import { describe, expect, it } from 'vitest';
import { normalizarColor } from '../../../../../presentation/components/Pedidos/VisualizadorModal/utils';

describe('normalizarColor', () => {
  it('devuelve gris por defecto cuando el valor es vacío', () => {
    expect(normalizarColor('')).toBe('#808080');
    expect(normalizarColor(null)).toBe('#808080');
    expect(normalizarColor(undefined)).toBe('#808080');
  });

  it('conserva un valor hexadecimal directo', () => {
    expect(normalizarColor('#123456')).toBe('#123456');
  });

  it('convierte un nombre conocido mediante HEX_COLORES', () => {
    expect(normalizarColor('Blanco')).toBe('#FFFFFF');
    expect(normalizarColor('Negro')).toBe('#1A1A1A');
    expect(normalizarColor('Vidrio Azul')).toBe('#6eb5ff');
  });

  it('usa gris cuando el nombre no existe', () => {
    expect(normalizarColor('Color inexistente')).toBe('#808080');
  });
});
