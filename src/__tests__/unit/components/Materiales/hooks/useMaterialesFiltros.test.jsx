import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useMaterialesFiltros } from '../../../../../presentation/components/Materiales/hooks/useMaterialesFiltros';

const makeItem = (nombre_material, variante_id = 1) => ({
  nombre_material,
  variante_id,
  stock: 10,
  precio: '25.00',
});

describe('useMaterialesFiltros', () => {
  it('agrupa los materiales por nombre', () => {
    const rawData = [
      makeItem('Aluminio', 1),
      makeItem('Aluminio', 2),
      makeItem('Vidrio', 3),
    ];

    const { result } = renderHook(() => useMaterialesFiltros(rawData));

    expect(result.current.grupos).toHaveLength(2);
    expect(result.current.grupos[0][0]).toBe('Aluminio');
    expect(result.current.grupos[0][1]).toHaveLength(2);
    expect(result.current.grupos[1][0]).toBe('Vidrio');
  });

  it('mantiene todos los grupos cuando la búsqueda está vacía', () => {
    const rawData = [
      makeItem('Aluminio'),
      makeItem('Vidrio', 2),
    ];

    const { result } = renderHook(() => useMaterialesFiltros(rawData));

    expect(result.current.gruposFiltrados).toHaveLength(2);
    expect(result.current.gruposPagina).toHaveLength(2);
    expect(result.current.totalPaginas).toBe(1);
  });

  it('filtra por nombre después del debounce', async () => {
    vi.useFakeTimers();

    const rawData = [
      makeItem('Aluminio'),
      makeItem('Vidrio', 2),
      makeItem('Espejo', 3),
    ];

    const { result } = renderHook(() => useMaterialesFiltros(rawData));

    act(() => {
      result.current.setBusqueda('vid');
    });

    expect(result.current.busqueda).toBe('vid');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(280);
    });

    expect(result.current.busquedaDebounced).toBe('vid');

    expect(result.current.gruposFiltrados).toHaveLength(1);
    expect(result.current.gruposFiltrados[0][0]).toBe('Vidrio');

    vi.useRealTimers();
  });

  it('realiza la búsqueda sin distinguir mayúsculas y minúsculas', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useMaterialesFiltros([
        makeItem('Aluminio Negro'),
        makeItem('Vidrio Claro', 2),
      ])
    );

    act(() => {
      result.current.setBusqueda('VIDRIO');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(280);
    });

    expect(result.current.gruposFiltrados).toHaveLength(1);

    expect(result.current.gruposFiltrados[0][0]).toBe('Vidrio Claro');

    vi.useRealTimers();
  });

  it('calcula la paginación con 12 grupos por página', () => {
    const rawData = Array.from({ length: 25 }, (_, i) =>
      makeItem(`Material ${i + 1}`, i + 1)
    );

    const { result } = renderHook(() => useMaterialesFiltros(rawData));

    expect(result.current.totalPaginas).toBe(3);
    expect(result.current.gruposPagina).toHaveLength(12);

    act(() => {
      result.current.setPagina(2);
    });

    expect(result.current.gruposPagina).toHaveLength(12);

    act(() => {
      result.current.setPagina(3);
    });

    expect(result.current.gruposPagina).toHaveLength(1);
  });

  it('mantiene al menos una página cuando no existen resultados', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useMaterialesFiltros([makeItem('Aluminio')])
    );

    act(() => {
      result.current.setBusqueda('inexistente');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(280);
    });

    expect(result.current.gruposFiltrados).toHaveLength(0);

    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.gruposPagina).toHaveLength(0);

    vi.useRealTimers();
  });

  it('reinicia la página a 1 cuando cambia la búsqueda', async () => {
    vi.useFakeTimers();

    const rawData = Array.from({ length: 25 }, (_, i) =>
      makeItem(`Material ${i + 1}`, i + 1)
    );

    const { result } = renderHook(() => useMaterialesFiltros(rawData));

    act(() => {
      result.current.setPagina(2);
    });

    expect(result.current.pagina).toBe(2);

    act(() => {
      result.current.setBusqueda('Material 1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(280);
    });

    expect(result.current.busquedaDebounced).toBe('Material 1');
    expect(result.current.pagina).toBe(1);

    vi.useRealTimers();
  });

  it('cancela el debounce anterior cuando cambia la búsqueda rápidamente', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useMaterialesFiltros([
        makeItem('Aluminio'),
        makeItem('Vidrio', 2),
      ])
    );

    act(() => {
      result.current.setBusqueda('alu');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    act(() => {
      result.current.setBusqueda('vid');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(180);
    });

    expect(result.current.busquedaDebounced).toBe('');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.busquedaDebounced).toBe('vid');

    expect(result.current.gruposFiltrados[0][0]).toBe('Vidrio');

    vi.useRealTimers();
  });
});
