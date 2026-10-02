import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  esColorClaro,
  normalizarColor,
  sanitizarTexto,
  useDebounce,
  validarNumero,
} from '@/presentation/components/Materiales/utils/materialesUtils';

import { COLOR_FALLBACK } from '@/presentation/components/Materiales/constants/materialesConstants';

describe('materialesUtils', () => {
  describe('sanitizarTexto', () => {
    it('elimina caracteres peligrosos y espacios', () => {
      expect(sanitizarTexto(`  <script>"Hola"'  `)).toBe('scriptHola');
    });

    it('maneja valores nulos', () => {
      expect(sanitizarTexto(null)).toBe('');
      expect(sanitizarTexto(undefined)).toBe('');
    });
  });

  describe('validarNumero', () => {
    it('devuelve el mínimo para valores inválidos o menores', () => {
      expect(validarNumero('abc')).toBe(0);
      expect(validarNumero(-10)).toBe(0);
    });

    it('limita valores superiores', () => {
      expect(validarNumero(999, 0, 100)).toBe(100);
    });

    it('devuelve valores válidos', () => {
      expect(validarNumero('25.5', 0, 100)).toBe(25.5);
    });

    it('respeta mínimo y máximo personalizados', () => {
      expect(validarNumero(5, 10, 20)).toBe(10);
      expect(validarNumero(25, 10, 20)).toBe(20);
    });
  });

  describe('normalizarColor', () => {
    it('usa fallback para valores inválidos', () => {
      expect(normalizarColor(null)).toBe(COLOR_FALLBACK);
      expect(normalizarColor(123)).toBe(COLOR_FALLBACK);
      expect(normalizarColor('')).toBe(COLOR_FALLBACK);
      expect(normalizarColor('rojo')).toBe(COLOR_FALLBACK);
    });

    it('acepta hexadecimal', () => {
      expect(normalizarColor('#fff')).toBe('#fff');
      expect(normalizarColor('#AABBCC')).toBe('#AABBCC');
    });

    it('normaliza rgb', () => {
      expect(normalizarColor('rgb(10, 20, 30)')).toBe('rgb(10, 20, 30)');
    });

    it('normaliza rgba y limita valores', () => {
      expect(normalizarColor('rgba(300, 0, 100, 2)'))
        .toBe('rgba(255, 0, 100, 1)');
    });

    it('limita valores rgb fuera de rango', () => {
      expect(normalizarColor('rgb(300, 0, 260)'))
        .toBe('rgb(255, 0, 255)');
    });
  });

  describe('esColorClaro', () => {
    it('devuelve false para valores inválidos', () => {
      expect(esColorClaro(null)).toBe(false);
      expect(esColorClaro('red')).toBe(false);
      expect(esColorClaro('#fff')).toBe(false);
    });

    it('detecta colores claros', () => {
      expect(esColorClaro('#ffffff')).toBe(true);
    });

    it('detecta colores oscuros', () => {
      expect(esColorClaro('#000000')).toBe(false);
    });
  });

  describe('useDebounce', () => {
    afterEach(() => vi.useRealTimers());

    it('actualiza después del tiempo indicado', () => {
      vi.useFakeTimers();

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'inicial' } },
      );

      expect(result.current).toBe('inicial');

      rerender({ value: 'nuevo' });

      act(() => {
        vi.advanceTimersByTime(299);
      });

      expect(result.current).toBe('inicial');

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current).toBe('nuevo');
    });

    it('cancela el temporizador anterior', () => {
      vi.useFakeTimers();

      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'uno' } },
      );

      rerender({ value: 'dos' });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      rerender({ value: 'tres' });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current).toBe('uno');

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current).toBe('tres');
    });
  });
});
