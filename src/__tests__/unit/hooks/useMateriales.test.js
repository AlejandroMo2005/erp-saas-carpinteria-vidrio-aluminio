import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    removeQueries: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocks.useQuery,
  useMutation: mocks.useMutation,
}));

vi.mock('../../../presentation/api/api', () => ({
  default: mocks.api,
}));

vi.mock('../../../presentation/api/queryClient', () => ({
  default: mocks.queryClient,
}));

import {
  materialesKeys,
  useMateriales,
  useMaterial,
  useCrearMaterial,
  useActualizarMaterial,
  useActualizarStock,
  useEliminarMaterial,
  useMaterialesConColores,
  useActualizarVariante,
} from '../../../presentation/hooks/useMateriales';

describe('materialesKeys', () => {
  it('genera correctamente todas las claves', () => {
    expect(materialesKeys.all()).toEqual(['materiales']);
    expect(materialesKeys.lists()).toEqual(['materiales', 'list']);
    expect(materialesKeys.list()).toEqual(['materiales', 'list', {}]);
    expect(materialesKeys.list({ categoria: 1 }))
      .toEqual(['materiales', 'list', { categoria: 1 }]);
    expect(materialesKeys.conColores()).toEqual(['materiales', 'con-colores']);
    expect(materialesKeys.detail(7)).toEqual(['materiales', 'detail', 7]);
    expect(materialesKeys.variante(9)).toEqual(['materiales', 'variante', 9]);
  });
});

describe('useMateriales', () => {
  beforeEach(() => vi.clearAllMocks());

  it('configura la consulta con filtros', () => {
    const config = {};
    mocks.useQuery.mockReturnValue(config);

    const { result } = renderHook(() => useMateriales({ categoria: 2 }));

    expect(result.current).toBe(config);
    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['materiales', 'list', { categoria: 2 }],
        staleTime: 60000,
      }),
    );
  });

  it('ejecuta queryFn correctamente', async () => {
    mocks.api.get.mockResolvedValue({ data: [{ id: 1 }] });
    mocks.useQuery.mockImplementation((config) => config);

    const { result } = renderHook(() => useMateriales());

    await expect(result.current.queryFn()).resolves.toEqual([{ id: 1 }]);
    expect(mocks.api.get).toHaveBeenCalledWith('/materiales', { params: {} });
  });
});

describe('useMaterial', () => {
  it('configura detalle y enabled según id', () => {
    mocks.useQuery.mockImplementation((config) => config);

    const { result } = renderHook(() => useMaterial(8));

    expect(result.current.queryKey).toEqual(['materiales', 'detail', 8]);
    expect(result.current.enabled).toBe(true);
  });

  it('deshabilita la consulta sin id', () => {
    mocks.useQuery.mockImplementation((config) => config);

    const { result } = renderHook(() => useMaterial(null));

    expect(result.current.enabled).toBe(false);
  });

  it('ejecuta queryFn del detalle', async () => {
    mocks.api.get.mockResolvedValue({ data: { id: 8 } });
    mocks.useQuery.mockImplementation((config) => config);

    const { result } = renderHook(() => useMaterial(8));

    await expect(result.current.queryFn()).resolves.toEqual({ id: 8 });
    expect(mocks.api.get).toHaveBeenCalledWith('/materiales/8');
  });
});

describe('useCrearMaterial', () => {
  it('ejecuta POST y refresca listas al tener éxito', async () => {
    mocks.api.post.mockResolvedValue({ data: { id: 10 } });
    mocks.useMutation.mockImplementation((config) => config);

    const { result } = renderHook(() => useCrearMaterial());

    await expect(result.current.mutationFn({ nombre: 'Vidrio' }))
      .resolves.toEqual({ id: 10 });

    act(() => result.current.onSuccess());

    expect(mocks.api.post).toHaveBeenCalledWith('/materiales', { nombre: 'Vidrio' });
    expect(mocks.queryClient.invalidateQueries).toHaveBeenNthCalledWith(
      1,
      { queryKey: ['materiales', 'list'] },
    );
    expect(mocks.queryClient.invalidateQueries).toHaveBeenNthCalledWith(
      2,
      { queryKey: ['materiales', 'con-colores'] },
    );
  });
});

describe('useActualizarMaterial', () => {
  it('ejecuta PUT y actualiza detalle/listas', async () => {
    const data = { id: 5, nombre: 'Aluminio' };
    mocks.api.put.mockResolvedValue({ data });
    mocks.useMutation.mockImplementation((config) => config);

    const { result } = renderHook(() => useActualizarMaterial());

    await expect(result.current.mutationFn({ id: 5, nombre: 'Aluminio' }))
      .resolves.toEqual(data);

    act(() => result.current.onSuccess(data, { id: 5 }));

    expect(mocks.api.put).toHaveBeenCalledWith(
      '/materiales/5',
      { nombre: 'Aluminio' },
    );
    expect(mocks.queryClient.setQueryData).toHaveBeenCalledWith(
      ['materiales', 'detail', 5],
      data,
    );
    expect(mocks.queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ['materiales', 'list'] },
    );
  });
});

describe('useActualizarStock', () => {
  it('ejecuta PATCH y actualiza cache/listas', async () => {
    const data = { id: 3, stock: 15 };
    mocks.api.patch.mockResolvedValue({ data });
    mocks.useMutation.mockImplementation((config) => config);

    const { result } = renderHook(() => useActualizarStock());

    await expect(
      result.current.mutationFn({ id: 3, cantidad: 5, tipo: 'entrada' }),
    ).resolves.toEqual(data);

    act(() => result.current.onSuccess(data, { id: 3 }));

    expect(mocks.api.patch).toHaveBeenCalledWith(
      '/materiales/3/stock',
      { cantidad: 5, tipo: 'entrada' },
    );
    expect(mocks.queryClient.setQueryData).toHaveBeenCalledWith(
      ['materiales', 'detail', 3],
      data,
    );
    expect(mocks.queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ['materiales', 'list'] },
    );
  });
});

describe('useEliminarMaterial', () => {
  it('elimina y limpia cache', async () => {
    mocks.api.delete.mockResolvedValue({});
    mocks.useMutation.mockImplementation((config) => config);

    const { result } = renderHook(() => useEliminarMaterial());

    await expect(result.current.mutationFn(12)).resolves.toBe(12);

    act(() => result.current.onSuccess(12));

    expect(mocks.api.delete).toHaveBeenCalledWith('/materiales/12');
    expect(mocks.queryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ['materiales', 'detail', 12],
    });
    expect(mocks.queryClient.invalidateQueries).toHaveBeenNthCalledWith(
      1,
      { queryKey: ['materiales', 'list'] },
    );
    expect(mocks.queryClient.invalidateQueries).toHaveBeenNthCalledWith(
      2,
      { queryKey: ['materiales', 'con-colores'] },
    );
  });
});

describe('useMaterialesConColores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useQuery.mockImplementation((config) => config);
  });

  it('obtiene el array de variantes', async () => {
    mocks.api.get.mockResolvedValue({
      data: {
        success: true,
        data: [{ variante_id: 1 }],
      },
    });

    const { result } = renderHook(() => useMaterialesConColores());

    await expect(result.current.queryFn()).resolves.toEqual([{ variante_id: 1 }]);
    expect(mocks.api.get).toHaveBeenCalledWith('/materiales/con-colores');
  });

  it('devuelve array vacío cuando data no es un array', async () => {
    mocks.api.get.mockResolvedValue({
      data: { success: true, data: null },
    });

    const { result } = renderHook(() => useMaterialesConColores());

    await expect(result.current.queryFn()).resolves.toEqual([]);
  });

  it('rechaza respuesta inesperada', async () => {
    mocks.api.get.mockResolvedValue({
      data: { success: false, data: [] },
    });

    const { result } = renderHook(() => useMaterialesConColores());

    await expect(result.current.queryFn())
      .rejects.toThrow('Respuesta inesperada del servidor');
  });
});

describe('useActualizarVariante', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMutation.mockImplementation((config) => config);
  });

  it('ejecuta PUT de variante', async () => {
    const data = { success: true };
    mocks.api.put.mockResolvedValue({ data });

    const { result } = renderHook(() => useActualizarVariante());

    await expect(
      result.current.mutationFn({
        varianteId: 7,
        stock: 20,
        precio: 35.5,
      }),
    ).resolves.toEqual(data);

    expect(mocks.api.put).toHaveBeenCalledWith(
      '/materiales/variante/7',
      { stock: 20, precio: 35.5 },
    );
  });

  it('invalida variantes ante error', () => {
    const { result } = renderHook(() => useActualizarVariante());

    act(() => result.current.onError());

    expect(mocks.queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['materiales', 'con-colores'],
    });
  });
});
