import { describe, it, expect } from 'vitest';
import {
  formatearFecha,
  formatearFechaHora,
  formatearMoneda,
} from '../../../../../../presentation/components/Facturacion/Componentes/DetalleFactura/utils';

describe('DetalleFactura utils', () => {
  describe('formatearFecha', () => {
    it('formatea una fecha correctamente', () => {
      expect(formatearFecha('2026-09-15T12:00:00')).toMatch(
        /^\d{2}\/\d{2}\/2026$/
      );
    });

    it('devuelve guion cuando no recibe fecha', () => {
      expect(formatearFecha()).toBe('—');
    });
  });

  describe('formatearFechaHora', () => {
    it('formatea fecha y hora correctamente', () => {
      const resultado = formatearFechaHora('2026-09-15T12:30:00');

      expect(resultado).toMatch(/^\d{2}\/\d{2}\/2026/);
      expect(resultado).toMatch(/\d{2}:\d{2}/);
    });

    it('devuelve guion cuando no recibe fecha', () => {
      expect(formatearFechaHora()).toBe('—');
    });
  });

  describe('formatearMoneda', () => {
    it('formatea un número con dos decimales', () => {
      expect(formatearMoneda(125.5)).toBe('$125.50');
    });

    it('convierte un valor numérico en texto y lo formatea', () => {
      expect(formatearMoneda('42.7')).toBe('$42.70');
    });

    it('usa cero cuando recibe null o undefined', () => {
      expect(formatearMoneda(null)).toBe('$0.00');
      expect(formatearMoneda()).toBe('$0.00');
    });
  });
});
