import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useMaterialesActions } from '../../../../../presentation/components/Materiales/hooks/useMaterialesActions';

const variante1 = {
  variante_id: 1,
  material_id: 10,
  nombre_material: 'Aluminio',
  color_nombre: 'Negro',
  stock: 20,
  precio: '15.50',
};

const variante2 = {
  variante_id: 2,
  material_id: 10,
  nombre_material: 'Aluminio',
  color_nombre: 'Blanco',
  stock: 30,
  precio: '18.75',
};

const grupos = [
  ['Aluminio', [variante1, variante2]],
];

function createMocks(overrides = {}) {
  const queryData = [variante1, variante2];

  return {
    queryData,
    actualizarVariante: {
      mutateAsync: vi.fn().mockResolvedValue({}),
    },
    queryClient: {
      setQueryData: vi.fn((_, updater) => {
        const oldData = queryData;
        const next = typeof updater === 'function'
          ? updater(oldData)
          : updater;

        queryData.splice(0, queryData.length, ...next);
        return next;
      }),
    },
    pushToast: vi.fn(),
    ...overrides,
  };
}

describe('useMaterialesActions', () => {
  it('usa la primera variante como selección efectiva', () => {
    const mocks = createMocks();

    const { result } = renderHook(() =>
      useMaterialesActions({
        grupos,
        esAdmin: true,
        actualizarVariante: mocks.actualizarVariante,
        queryClient: mocks.queryClient,
        pushToast: mocks.pushToast,
      })
    );

    expect(result.current.seleccionEfectiva.Aluminio).toEqual(variante1);
    expect(result.current.editandoEfectivo.Aluminio).toEqual({
      stock: variante1.stock,
      precio: variante1.precio,
    });
  });

  it('selecciona una variante y sincroniza sus valores editables', () => {
    const mocks = createMocks();

    const { result } = renderHook(() =>
      useMaterialesActions({
        grupos,
        esAdmin: true,
        actualizarVariante: mocks.actualizarVariante,
        queryClient: mocks.queryClient,
        pushToast: mocks.pushToast,
      })
    );

    act(() => {
      result.current.handleSeleccionar('Aluminio', variante2);
    });

    expect(result.current.seleccionEfectiva.Aluminio).toEqual(variante2);
    expect(result.current.editandoEfectivo.Aluminio).toEqual({
      stock: 30,
      precio: '18.75',
    });
  });

  it('actualiza un campo editable', () => {
    const mocks = createMocks();

    const { result } = renderHook(() =>
      useMaterialesActions({
        grupos,
        esAdmin: true,
        actualizarVariante: mocks.actualizarVariante,
        queryClient: mocks.queryClient,
        pushToast: mocks.pushToast,
      })
    );

    act(() => {
      result.current.handleCampo('Aluminio', 'stock', '45');
    });

    expect(result.current.editandoEfectivo.Aluminio.stock).toBe('45');
    expect(result.current.editandoEfectivo.Aluminio.precio).toBe('15.50');
  });

  it('guarda correctamente y aplica optimistic update', async () => {
    const mocks = createMocks();

    const { result } = renderHook(() =>
      useMaterialesActions({
        grupos,
        esAdmin: true,
        actualizarVariante: mocks.actualizarVariante,
        queryClient: mocks.queryClient,
        pushToast: mocks.pushToast,
      })
    );

    act(() => {
      result.current.handleCampo('Aluminio', 'stock', '40');
    });

    act(() => {
      result.current.handleCampo('Aluminio', 'precio', '22.456');
    });

    await act(async () => {
      await result.current.handleGuardar('Aluminio');
    });

    expect(mocks.actualizarVariante.mutateAsync).toHaveBeenCalledWith({
      varianteId: 1,
      stock: 40,
      precio: 22.46,
    });

    expect(mocks.queryClient.setQueryData).toHaveBeenCalled();
    expect(mocks.queryData[0]).toMatchObject({
      variante_id: 1,
      stock: 40,
      precio: 22.456,
    });

    expect(mocks.pushToast).toHaveBeenCalledWith(
      'Aluminio (Negro) actualizado',
      'success'
    );

    expect(result.current.guardando.Aluminio).toBe(false);
  });

  it('no guarda si el usuario no es administrador', async () => {
    const mocks = createMocks();

    const { result } = renderHook(() =>
      useMaterialesActions({
        grupos,
        esAdmin: false,
        actualizarVariante: mocks.actualizarVariante,
        queryClient: mocks.queryClient,
        pushToast: mocks.pushToast,
      })
    );

    await act(async () => {
      await result.current.handleGuardar('Aluminio');
    });

    expect(mocks.actualizarVariante.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.queryClient.setQueryData).not.toHaveBeenCalled();
  });

  it('no ejecuta otra actualización mientras está guardando', async () => {
    let resolver;

    const mocks = createMocks({
      actualizarVariante: {
        mutateAsync: vi.fn(
          () => new Promise((resolve) => {
            resolver = resolve;
          })
        ),
      },
    });

    const { result } = renderHook(() =>
      useMaterialesActions({
        grupos,
        esAdmin: true,
        actualizarVariante: mocks.actualizarVariante,
        queryClient: mocks.queryClient,
        pushToast: mocks.pushToast,
      })
    );

    let firstSave;

    await act(async () => {
      firstSave = result.current.handleGuardar('Aluminio');
      await Promise.resolve();
    });

    expect(result.current.guardando.Aluminio).toBe(true);

    await act(async () => {
      await result.current.handleGuardar('Aluminio');
    });

    expect(mocks.actualizarVariante.mutateAsync).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolver({});
      await firstSave;
    });

    expect(result.current.guardando.Aluminio).toBe(false);
  });

  it('hace rollback y muestra error 403', async () => {
    const mocks = createMocks({
      actualizarVariante: {
        mutateAsync: vi.fn().mockRejectedValue({
          response: { status: 403 },
        }),
      },
    });

    const { result } = renderHook(() =>
      useMaterialesActions({
        grupos,
        esAdmin: true,
        actualizarVariante: mocks.actualizarVariante,
        queryClient: mocks.queryClient,
        pushToast: mocks.pushToast,
      })
    );

    await act(async () => {
      await result.current.handleGuardar('Aluminio');
    });

    expect(mocks.queryData[0]).toMatchObject({
      variante_id: 1,
      stock: 20,
      precio: '15.50',
    });

    expect(mocks.pushToast).toHaveBeenCalledWith(
      'Sin permisos para actualizar este material.',
      'error'
    );

    expect(result.current.guardando.Aluminio).toBe(false);
  });

  it('muestra error 404 y restaura los valores originales', async () => {
    const mocks = createMocks({
      actualizarVariante: {
        mutateAsync: vi.fn().mockRejectedValue({
          response: { status: 404 },
        }),
      },
    });

    const { result } = renderHook(() =>
      useMaterialesActions({
        grupos,
        esAdmin: true,
        actualizarVariante: mocks.actualizarVariante,
        queryClient: mocks.queryClient,
        pushToast: mocks.pushToast,
      })
    );

    await act(async () => {
      await result.current.handleGuardar('Aluminio');
    });

    expect(mocks.pushToast).toHaveBeenCalledWith(
      'Material no encontrado.',
      'error'
    );

    expect(result.current.editandoEfectivo.Aluminio).toEqual({
      stock: 20,
      precio: '15.50',
    });
  });

  it('muestra error genérico ante una falla distinta', async () => {
    const mocks = createMocks({
      actualizarVariante: {
        mutateAsync: vi.fn().mockRejectedValue(new Error('fallo')),
      },
    });

    const { result } = renderHook(() =>
      useMaterialesActions({
        grupos,
        esAdmin: true,
        actualizarVariante: mocks.actualizarVariante,
        queryClient: mocks.queryClient,
        pushToast: mocks.pushToast,
      })
    );

    await act(async () => {
      await result.current.handleGuardar('Aluminio');
    });

    expect(mocks.pushToast).toHaveBeenCalledWith(
      'Error al guardar. Inténtalo de nuevo.',
      'error'
    );

    expect(result.current.guardando.Aluminio).toBe(false);
  });
});
