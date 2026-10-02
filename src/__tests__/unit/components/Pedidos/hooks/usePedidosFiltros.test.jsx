import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePedidosFiltros } from '../../../../../presentation/components/Pedidos/hooks/usePedidosFiltros';

const pedidos = [
  {
    id: 1,
    estado: 'PENDIENTE',
    fecha: '2026-09-20T12:00:00.000Z',
  },
  {
    id: 2,
    estado: 'ENTREGADO',
    fecha: '2026-09-22T12:00:00.000Z',
  },
  {
    id: 3,
    estado: 'CANCELADO',
    fecha: '2026-09-23T12:00:00.000Z',
  },
  {
    id: 4,
    estado: 'ENTREGADO',
    fecha: '2026-08-01T12:00:00.000Z',
  },
];

describe('usePedidosFiltros', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-25T12:00:00.000Z'));
  });

  it('inicia con activos y periodo mensual', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, true, false)
    );

    expect(result.current.filtroEstado).toBe('activos');
    expect(result.current.filtroPeriodo).toBe('mes');
  });

  it('filtra pedidos del periodo para administradores', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, true, false)
    );

    expect(result.current.pedidosFiltrados.map((p) => p.id)).toEqual([1, 2]);
  });

  it('permite cambiar el filtro de estado', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, true, false)
    );

    act(() => {
      result.current.setFiltroEstado('entregados');
    });

    expect(result.current.pedidosFiltrados.map((p) => p.id)).toEqual([2]);
  });

  it('permite cambiar el periodo', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, true, false)
    );

    act(() => {
      result.current.setFiltroPeriodo('historico');
    });

    expect(result.current.filtroPeriodo).toBe('historico');
    expect(result.current.pedidosFiltrados.map((p) => p.id)).toEqual([1, 2]);
  });

  it('no aplica periodo temporal cuando no es administrador', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, false, false)
    );

    expect(result.current.pedidosFiltrados.map((p) => p.id)).toEqual([1, 2]);
  });

  it('permite ver todos los pedidos del periodo', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, true, false)
    );

    act(() => {
      result.current.setFiltroEstado('todos');
    });

    expect(result.current.pedidosFiltrados.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it('calcula contadores sobre la lista base del periodo', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, true, false)
    );

    expect(result.current.contadores).toEqual({
      activos: 2,
      pendientes: 1,
      entregados: 1,
      cancelados: 1,
      todos: 3,
    });
  });

  it('muestra mensaje específico para clientes', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, false, true)
    );

    expect(result.current.mensajeVacio).toBe(
      'Aún no tienes pedidos. Ve a "Mis Proformas" para solicitar un presupuesto.'
    );
  });

  it('muestra mensaje con estado y periodo para administradores', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, true, false)
    );

    expect(result.current.mensajeVacio).toBe(
      'No hay pedidos activos en "este mes".'
    );

    act(() => {
      result.current.setFiltroEstado('cancelados');
      result.current.setFiltroPeriodo('semana');
    });

    expect(result.current.mensajeVacio).toBe(
      'No hay pedidos cancelados en "esta semana".'
    );
  });

  it('muestra mensaje con estado para usuarios no administradores', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, false, false)
    );

    act(() => {
      result.current.setFiltroEstado('pendientes');
    });

    expect(result.current.mensajeVacio).toBe('No hay pedidos pendientes.');
  });

  it('con histórico mantiene todos los pedidos para el administrador', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, true, false)
    );

    act(() => {
      result.current.setFiltroPeriodo('historico');
      result.current.setFiltroEstado('todos');
    });

    expect(result.current.pedidosFiltrados).toHaveLength(4);
  });

  it('mantiene la lista cuando se selecciona un periodo desconocido', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, true, false)
    );

    act(() => {
      result.current.setFiltroPeriodo('periodo-inexistente');
      result.current.setFiltroEstado('todos');
    });

    expect(result.current.pedidosFiltrados).toHaveLength(4);
  });

  it('mantiene la lista cuando se selecciona un estado desconocido', () => {
    const { result } = renderHook(() =>
      usePedidosFiltros(pedidos, false, false)
    );

    act(() => {
      result.current.setFiltroEstado('estado-inexistente');
    });

    expect(result.current.pedidosFiltrados.map((p) => p.id)).toEqual([1, 2, 3, 4]);
  });
});
