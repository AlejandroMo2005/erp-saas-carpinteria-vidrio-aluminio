import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  calcularFechas,
  formatearMoneda,
  formatearMes,
  luminosidad,
  estiloLinea,
} from '../../../../../../presentation/components/Facturacion/Componentes/Estadisticas/utils';

describe('calcularFechas', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['3m', 3],
    ['6m', 6],
    ['12m', 12],
    ['otro', 6],
  ])('calcula el rango para %s', (periodo, meses) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T12:00:00Z'));

    const resultado = calcularFechas(periodo);

    const esperadoDesde = new Date('2026-10-03T12:00:00Z');
    esperadoDesde.setMonth(esperadoDesde.getMonth() - meses);

    expect(resultado).toEqual({
      fechaDesde: esperadoDesde.toISOString().split('T')[0],
      fechaHasta: '2026-10-03',
    });
  });
});

describe('formatearMoneda', () => {
  it('formatea un valor numérico con dos decimales', () => {
    expect(formatearMoneda(1234.5)).toBe('$1.234,50');
  });

  it('usa cero cuando recibe null o undefined', () => {
    expect(formatearMoneda(null)).toBe('$0,00');
    expect(formatearMoneda(undefined)).toBe('$0,00');
  });

  it('convierte valores numéricos representados como texto', () => {
    expect(formatearMoneda('2500.75')).toBe('$2.500,75');
  });
});

describe('formatearMes', () => {
  it('devuelve cadena vacía cuando no recibe mes', () => {
    expect(formatearMes('')).toBe('');
    expect(formatearMes(null)).toBe('');
  });

  it('formatea año y mes', () => {
    expect(formatearMes('2026-10')).toMatch(/oct/i);
    expect(formatearMes('2026-10')).toContain('26');
  });
});

describe('luminosidad', () => {
  it('devuelve 0.5 para un valor sin formato hexadecimal', () => {
    expect(luminosidad('red')).toBe(0.5);
    expect(luminosidad(null)).toBe(0.5);
  });

  it('calcula luminosidad para hexadecimal de tres dígitos', () => {
    expect(luminosidad('#fff')).toBeCloseTo(1, 5);
  });

  it('calcula luminosidad para hexadecimal de seis dígitos', () => {
    expect(luminosidad('#000000')).toBeCloseTo(0, 5);
    expect(luminosidad('#ffffff')).toBeCloseTo(1, 5);
  });

  it('cubre la rama gamma para valores bajos', () => {
    expect(luminosidad('#000001')).toBeGreaterThan(0);
    expect(luminosidad('#000001')).toBeLessThan(0.001);
  });
});

describe('estiloLinea', () => {
  it('prioriza el filtro de alto contraste', () => {
    const resultado = estiloLinea('#336699', false, true);

    expect(resultado.stroke).toBe('#336699');
    expect(resultado.strokeWidth).toBe(2.5);
    expect(resultado.style.filter).toContain('drop-shadow');
    expect(resultado.dot.fill).toBe('#336699');
    expect(resultado.dot.stroke).toBe('#000000');
    expect(resultado.activeDot.r).toBe(6);
  });

  it('agrega sombra oscura para una línea clara en modo claro', () => {
    const resultado = estiloLinea('#ffffff', false, false);

    expect(resultado.style.filter).toContain('#000000');
    expect(resultado.dot.stroke).toBe('#000000');
  });

  it('agrega sombra clara para una línea oscura en modo oscuro', () => {
    const resultado = estiloLinea('#000000', true, false);

    expect(resultado.style.filter).toContain('#ffffff');
    expect(resultado.dot.stroke).toBe('#ffffff');
  });

  it('no agrega filtro cuando no se necesita contraste adicional', () => {
    const resultado = estiloLinea('#336699', false, false);

    expect(resultado.style).toBeUndefined();
  });

  it('usa borde blanco para líneas oscuras', () => {
    const resultado = estiloLinea('#000000', false, false);

    expect(resultado.dot.stroke).toBe('#ffffff');
  });

  it('usa borde negro para líneas claras', () => {
    const resultado = estiloLinea('#ffffff', false, false);

    expect(resultado.dot.stroke).toBe('#000000');
  });
});
