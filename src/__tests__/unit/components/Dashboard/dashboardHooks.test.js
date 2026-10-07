import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/presentation/api/api', () => ({
  default: {
    get: mocks.get,
  },
}));

vi.spyOn(console, 'error').mockImplementation(mocks.error);

import useEstado from '@/presentation/components/Dashboard/Estado/useEstado';
import useIngresos from '@/presentation/components/Dashboard/Ingresos/useIngresos';
import useProductos, {
  generarDatosGrafico,
} from '@/presentation/components/Dashboard/Productos/useProductos';
import useTicket from '@/presentation/components/Dashboard/Ticket/useTicket';
import useUsuarios from '@/presentation/components/Dashboard/Usuarios/useUsuarios';

describe('Dashboard hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useEstado', () => {
    it('carga estados y calcula el total', async () => {
      mocks.get.mockResolvedValueOnce({
        data: {
          data: [
            { estado: 'PENDIENTE', cantidad: '3' },
            { estado: 'ENTREGADO', cantidad: '2' },
          ],
        },
      });

      const { result } = renderHook(() => useEstado());

      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mocks.get).toHaveBeenCalledWith('/dashboard/estados');
      expect(result.current.data).toHaveLength(2);
      expect(result.current.total).toBe(5);
    });

    it('finaliza la carga cuando la API falla', async () => {
      const error = new Error('API error');
      mocks.get.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useEstado());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toEqual([]);
      expect(result.current.total).toBe(0);
    });
  });

  describe('useIngresos', () => {
    it('carga ingresos con el periodo inicial', async () => {
      mocks.get.mockResolvedValueOnce({
        data: {
          data: [{ periodo: 'Ene', ingresos: 1000 }],
        },
      });

      const { result } = renderHook(() => useIngresos());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.periodo).toBe('mes');
      expect(mocks.get).toHaveBeenCalledWith(
        '/dashboard/ingresos?periodo=mes',
      );
      expect(result.current.data).toEqual([
        { periodo: 'Ene', ingresos: 1000 },
      ]);
    });

    it('recarga cuando cambia el periodo', async () => {
      mocks.get
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({
          data: { data: [{ periodo: 'Ene', ingresos: 2000 }] },
        });

      const { result } = renderHook(() => useIngresos());

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.setPeriodo('anio');
      });

      await waitFor(() =>
        expect(mocks.get).toHaveBeenLastCalledWith(
          '/dashboard/ingresos?periodo=anio',
        ),
      );
    });

    it('finaliza la carga cuando la API falla', async () => {
      const error = new Error('API error');
      mocks.get.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useIngresos());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useProductos', () => {
    it('carga materiales y permite seleccionar y deseleccionar', async () => {
      const data = [
        { material_id: 1, nombre: 'Aluminio' },
        { material_id: 2, nombre: 'Vidrio' },
      ];

      mocks.get.mockResolvedValueOnce({ data: { data } });

      const { result } = renderHook(() => useProductos());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mocks.get).toHaveBeenCalledWith(
        '/dashboard/materiales-variantes',
      );
      expect(result.current.data).toEqual(data);
      expect(result.current.seleccionado).toBeNull();

      act(() => {
        result.current.toggleSeleccionado(1);
      });

      expect(result.current.seleccionado).toBe(1);
      expect(result.current.materialSeleccionado).toEqual(data[0]);

      act(() => {
        result.current.toggleSeleccionado(1);
      });

      expect(result.current.seleccionado).toBeNull();
      expect(result.current.materialSeleccionado).toBeUndefined();
    });

    it('finaliza la carga cuando la API falla', async () => {
      const error = new Error('API error');
      mocks.get.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useProductos());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toEqual([]);
    });

    it('genera datos para el gráfico', () => {
      vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
        array => {
          array[0] = 2 ** 31;
          return array;
        },
      );

      const material = {
        variantes: [
          { color_nombre: 'Natural', stock: '100' },
          { color_nombre: 'Negro', stock: '50' },
        ],
      };

      const result = generarDatosGrafico(material);

      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({
        periodo: 'Ene',
        Natural: 100,
        Negro: 50,
      });
      expect(result[5]).toEqual({
        periodo: 'Jun',
        Natural: 100,
        Negro: 50,
      });

      vi.restoreAllMocks();
    });

    it('devuelve un arreglo vacío sin variantes', () => {
      expect(generarDatosGrafico({ variantes: [] })).toEqual([]);
      expect(generarDatosGrafico({})).toEqual([]);
    });

    it('normaliza stock inválido y evita valores negativos', () => {
      vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
        array => {
          array[0] = 0;
          return array;
        },
      );

      const result = generarDatosGrafico({
        variantes: [
          { color_nombre: 'Sin stock', stock: 'abc' },
        ],
      });

      expect(result).toHaveLength(6);
      expect(result.every((item) => item['Sin stock'] >= 0)).toBe(true);

      vi.restoreAllMocks();
    });
  });

  describe('useTicket', () => {
    it('procesa el ticket promedio', async () => {
      mocks.get.mockResolvedValueOnce({
        data: {
          data: [
            { periodo: 'Ene', ingresos: 1000, total_pedidos: 4 },
            { periodo: 'Feb', ingresos: 500, total_pedidos: 0 },
          ],
        },
      });

      const { result } = renderHook(() => useTicket());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toEqual([
        {
          periodo: 'Ene',
          ticket_promedio: 250,
          total_pedidos: 4,
        },
        {
          periodo: 'Feb',
          ticket_promedio: 0,
          total_pedidos: 0,
        },
      ]);
    });

    it('recarga cuando cambia el periodo', async () => {
      mocks.get
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({
          data: {
            data: [
              { periodo: 'Año', ingresos: 900, total_pedidos: 3 },
            ],
          },
        });

      const { result } = renderHook(() => useTicket());

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.setPeriodo('anio');
      });

      await waitFor(() =>
        expect(mocks.get).toHaveBeenLastCalledWith(
          '/dashboard/ingresos?periodo=anio',
        ),
      );

      expect(result.current.data[0].ticket_promedio).toBe(300);
    });

    it('finaliza la carga cuando la API falla', async () => {
      const error = new Error('API error');
      mocks.get.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useTicket());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useUsuarios', () => {
    it('carga usuarios e ingresos', async () => {
      const data = [
        { usuario: 'admin', ingresos: 1200 },
        { usuario: 'vendedor', ingresos: 800 },
      ];

      mocks.get.mockResolvedValueOnce({ data: { data } });

      const { result } = renderHook(() => useUsuarios());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mocks.get).toHaveBeenCalledWith(
        '/dashboard/usuarios-ingresos',
      );
      expect(result.current.data).toEqual(data);
    });

    it('finaliza la carga cuando la API falla', async () => {
      const error = new Error('API error');
      mocks.get.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useUsuarios());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toEqual([]);
    });
  });
});
