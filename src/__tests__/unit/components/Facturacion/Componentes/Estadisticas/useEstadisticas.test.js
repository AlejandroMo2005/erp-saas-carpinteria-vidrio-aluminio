import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock(
  '../../../../../../presentation/api/api',
  () => ({
    default: {
      get: vi.fn(),
    },
  })
);

vi.mock(
  '../../../../../../presentation/components/Facturacion/Componentes/Estadisticas/utils',
  () => ({
    calcularFechas: vi.fn(() => ({
      fechaDesde: '2026-04-01',
      fechaHasta: '2026-10-01',
    })),
  })
);

import api from '../../../../../../presentation/api/api';
import { calcularFechas } from '../../../../../../presentation/components/Facturacion/Componentes/Estadisticas/utils';
import useEstadisticas from '../../../../../../presentation/components/Facturacion/Componentes/Estadisticas/useEstadisticas';

describe('useEstadisticas', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    api.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { total: 10, ventas: 500 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { facturas: 5, total: 500 },
        },
      });
  });

  it('carga estadísticas y resumen al iniciar', async () => {
    const { result } = renderHook(() => useEstadisticas());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.periodo).toBe('6m');
    expect(result.current.error).toBeNull();
    expect(result.current.datos).toEqual({
      total: 10,
      ventas: 500,
    });
    expect(result.current.resumen).toEqual({
      facturas: 5,
      total: 500,
    });

    expect(calcularFechas).toHaveBeenCalledWith('6m');
    expect(api.get).toHaveBeenNthCalledWith(
      1,
      '/facturacion/estadisticas?fechaDesde=2026-04-01&fechaHasta=2026-10-01'
    );
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      '/facturacion/resumen-periodo?fechaDesde=2026-04-01&fechaHasta=2026-10-01'
    );
  });

  it('actualiza el periodo y recarga los datos', async () => {
    const { result } = renderHook(() => useEstadisticas());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    api.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { total: 20, ventas: 900 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { facturas: 8, total: 900 },
        },
      });

    await act(async () => {
      result.current.setPeriodo('1m');
    });

    await waitFor(() => {
      expect(result.current.datos).toEqual({
        total: 20,
        ventas: 900,
      });
    });

    expect(calcularFechas).toHaveBeenLastCalledWith('1m');
    expect(api.get).toHaveBeenCalledTimes(4);
  });

  it('no actualiza datos cuando estadísticas responde success false', async () => {
    api.get
      .mockReset()
      .mockResolvedValueOnce({
        data: {
          success: false,
          data: { total: 99 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { facturas: 3 },
        },
      });

    const { result } = renderHook(() => useEstadisticas());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.datos).toBeNull();
    expect(result.current.resumen).toEqual({ facturas: 3 });
    expect(result.current.error).toBeNull();
  });

  it('no actualiza resumen cuando responde success false', async () => {
    api.get
      .mockReset()
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { total: 15 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: false,
          data: { facturas: 99 },
        },
      });

    const { result } = renderHook(() => useEstadisticas());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.datos).toEqual({ total: 15 });
    expect(result.current.resumen).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('muestra el mensaje del backend cuando falla la carga', async () => {
    api.get
      .mockReset()
      .mockRejectedValueOnce({
        response: {
          data: {
            message: 'No autorizado',
          },
        },
      });

    const { result } = renderHook(() => useEstadisticas());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('No autorizado');
    expect(result.current.datos).toBeNull();
    expect(result.current.resumen).toBeNull();
  });

  it('usa el mensaje genérico cuando el error no contiene mensaje del backend', async () => {
    api.get
      .mockReset()
      .mockRejectedValueOnce(new Error('Network Error'));

    const { result } = renderHook(() => useEstadisticas());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Error al cargar estadísticas');
  });

  it('permite recargar manualmente mediante cargarDatos', async () => {
    const { result } = renderHook(() => useEstadisticas());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    api.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { total: 30 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
        data: { facturas: 12 },
        },
      });

    await act(async () => {
      await result.current.cargarDatos();
    });

    expect(result.current.datos).toEqual({ total: 30 });
    expect(result.current.resumen).toEqual({ facturas: 12 });
    expect(api.get).toHaveBeenCalledTimes(4);
  });
});
