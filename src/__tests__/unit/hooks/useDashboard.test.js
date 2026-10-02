import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock('@/presentation/api/api', () => ({
  default: {
    get: mocks.get,
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocks.useQuery,
}));

import {
  dashboardKeys,
  useDashboardResumen,
} from '@/presentation/hooks/useDashboard';

describe('useDashboard', () => {
  it('genera la key de resumen', () => {
    expect(dashboardKeys.resumen()).toEqual(['dashboard', 'resumen']);
  });

  it('configura useQuery correctamente', () => {
    useDashboardResumen();

    expect(mocks.useQuery).toHaveBeenCalledTimes(1);

    const config = mocks.useQuery.mock.calls[0][0];

    expect(config.queryKey).toEqual(['dashboard', 'resumen']);
    expect(config.staleTime).toBe(2 * 60 * 1000);
    expect(config.refetchOnWindowFocus).toBe(true);
    expect(config.placeholderData).toEqual({
      ingresos_totales: 0,
      total_pedidos: 0,
      pedidos_pendientes: 0,
      pedidos_completados: 0,
      total_proformas: 0,
      proformas_pendientes: 0,
    });
  });

  it('extrae data.data cuando el backend responde con envoltorio', async () => {
    mocks.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          ingresos_totales: 1500,
          total_pedidos: 12,
        },
      },
    });

    useDashboardResumen();

    const config = mocks.useQuery.mock.calls.at(-1)[0];
    const resultado = await config.queryFn();

    expect(mocks.get).toHaveBeenCalledWith('/dashboard/resumen');
    expect(resultado).toEqual({
      ingresos_totales: 1500,
      total_pedidos: 12,
    });
  });

  it('usa directamente data cuando el backend responde sin envoltorio', async () => {
    mocks.get.mockResolvedValueOnce({
      data: {
        ingresos_totales: 2500,
        total_pedidos: 20,
      },
    });

    useDashboardResumen();

    const config = mocks.useQuery.mock.calls.at(-1)[0];
    const resultado = await config.queryFn();

    expect(resultado).toEqual({
      ingresos_totales: 2500,
      total_pedidos: 20,
    });
  });

  it('rechaza una respuesta inválida del servidor', async () => {
    mocks.get.mockResolvedValueOnce({
      data: null,
    });

    useDashboardResumen();

    const config = mocks.useQuery.mock.calls.at(-1)[0];

    await expect(config.queryFn()).rejects.toThrow(
      'Respuesta inesperada del servidor',
    );
  });

  it('rechaza una respuesta primitiva del servidor', async () => {
    mocks.get.mockResolvedValueOnce({
      data: 'respuesta-invalida',
    });

    useDashboardResumen();

    const config = mocks.useQuery.mock.calls.at(-1)[0];

    await expect(config.queryFn()).rejects.toThrow(
      'Respuesta inesperada del servidor',
    );
  });
});
