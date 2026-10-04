import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useToasts from '../../../../../../presentation/components/Facturacion/Componentes/ListaFacturas/useToasts';

describe('useToasts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('inicia sin toasts', () => {
    const { result } = renderHook(() => useToasts());

    expect(result.current.toasts).toEqual([]);
  });

  it('agrega un toast de error', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.error('Error de prueba');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      msg: 'Error de prueba',
      tipo: 'error',
    });
  });

  it('agrega un toast de éxito', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.success('Operación correcta');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      msg: 'Operación correcta',
      tipo: 'success',
    });
  });

  it('agrega un toast de advertencia', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.warning('Advertencia de prueba');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      msg: 'Advertencia de prueba',
      tipo: 'warning',
    });
  });

  it('elimina un toast mediante remove', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.error('Primer toast');
      result.current.success('Segundo toast');
    });

    const id = result.current.toasts[0].id;

    act(() => {
      result.current.remove(id);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].msg).toBe('Segundo toast');
  });

  it('elimina automáticamente el toast después de 5 segundos', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.success('Toast temporal');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
