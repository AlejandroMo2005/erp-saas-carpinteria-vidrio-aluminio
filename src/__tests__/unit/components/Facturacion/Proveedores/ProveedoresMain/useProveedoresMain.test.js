import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import useProveedoresMain from '../../../../../../presentation/components/Facturacion/Proveedores/ProveedoresMain/useProveedoresMain';
import api from '../../../../../../presentation/api/api';

vi.mock('../../../../../../presentation/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useProveedoresMain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn();
  });

  it('carga proveedores al iniciar', async () => {
    api.get.mockResolvedValueOnce({
      data: { data: [{ id: 1, nombre: 'Proveedor A' }] },
    });

    const { result } = renderHook(() => useProveedoresMain());

    expect(result.current.loading).toBe(true);

    await act(async () => { });

    expect(api.get).toHaveBeenCalledWith('/proveedores');
    expect(result.current.proveedores).toEqual([
      { id: 1, nombre: 'Proveedor A' },
    ]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('maneja error al cargar proveedores', async () => {
    api.get.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    expect(result.current.error).toBe('Error al cargar proveedores');
    expect(result.current.loading).toBe(false);
  });

  it('carga alertas al cambiar a la pestaña de alertas', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({
        data: { data: [{ variante_id: 1, stock: 2 }] },
      });

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    await act(async () => {
      result.current.setTab('alertas');
    });

    expect(api.get).toHaveBeenLastCalledWith('/proveedores/alertas/stock');
    expect(result.current.alertas).toEqual([
      { variante_id: 1, stock: 2 },
    ]);
    expect(result.current.loading).toBe(false);
  });

  it('carga historial al cambiar a la pestaña de historial', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({
        data: { data: [{ id: 1, estado: 'enviada' }] },
      });

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    await act(async () => {
      result.current.setTab('historial');
    });

    expect(api.get).toHaveBeenLastCalledWith(
      '/proveedores/solicitudes/historial',
    );
    expect(result.current.historial).toEqual([
      { id: 1, estado: 'enviada' },
    ]);
  });

  it('maneja error al cargar alertas e historial', async () => {
    api.get
      .mockRejectedValueOnce(new Error('alertas'))
      .mockRejectedValueOnce(new Error('historial'));

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    await act(async () => {
      result.current.setTab('alertas');
    });

    expect(result.current.error).toBe('Error al cargar alertas');

    await act(async () => {
      result.current.setTab('historial');
    });

    expect(result.current.error).toBe('Error al cargar historial');
    expect(result.current.loading).toBe(false);
  });

  it('refresca cada pestaña activa', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    await act(async () => {
      result.current.refrescarTab();
    });

    expect(api.get).toHaveBeenLastCalledWith('/proveedores');

    await act(async () => {
      result.current.setTab('alertas');
    });

    await act(async () => {
      result.current.refrescarTab();
    });

    expect(api.get).toHaveBeenLastCalledWith('/proveedores/alertas/stock');

    await act(async () => {
      result.current.setTab('historial');
    });

    await act(async () => {
      result.current.refrescarTab();
    });

    expect(api.get).toHaveBeenLastCalledWith(
      '/proveedores/solicitudes/historial',
    );
  });

  it('agrega un proveedor nuevo mediante onGuardado', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [] } });

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    await act(async () => {
      result.current.setModalProv({});
      result.current.onGuardado({ id: 5, nombre: 'Nuevo' });
    });

    expect(result.current.proveedores).toEqual([
      { id: 5, nombre: 'Nuevo' },
    ]);
    expect(result.current.modalProv).toBe(null);
  });

  it('actualiza un proveedor existente mediante onGuardado', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: [
          { id: 5, nombre: 'Anterior' },
          { id: 8, nombre: 'Otro proveedor' },
        ],
      },
    });

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    await act(async () => {
      result.current.onGuardado({ id: 5, nombre: 'Actualizado' });
    });

    expect(result.current.proveedores).toEqual([
      { id: 5, nombre: 'Actualizado' },
      { id: 8, nombre: 'Otro proveedor' },
    ]);
  });

  it('no elimina si el usuario cancela la confirmación', async () => {
    window.confirm.mockReturnValue(false);
    api.get.mockResolvedValueOnce({
      data: { data: [{ id: 5, nombre: 'Proveedor' }] },
    });

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    await act(async () => {
      await result.current.eliminar(5);
    });

    expect(window.confirm).toHaveBeenCalledWith('¿Eliminar este proveedor?');
    expect(api.delete).not.toHaveBeenCalled();
    expect(result.current.proveedores).toHaveLength(1);
  });

  it('elimina un proveedor confirmado', async () => {
    window.confirm.mockReturnValue(true);
    api.get.mockResolvedValueOnce({
      data: { data: [{ id: 5, nombre: 'Proveedor' }] },
    });
    api.delete.mockResolvedValueOnce({});

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    await act(async () => {
      await result.current.eliminar(5);
    });

    expect(api.delete).toHaveBeenCalledWith('/proveedores/5');
    expect(result.current.proveedores).toEqual([]);
  });

  it('maneja error al eliminar un proveedor', async () => {
    window.confirm.mockReturnValue(true);
    api.get.mockResolvedValueOnce({
      data: { data: [{ id: 5, nombre: 'Proveedor' }] },
    });
    api.delete.mockRejectedValueOnce(new Error('delete'));

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    await act(async () => {
      await result.current.eliminar(5);
    });

    expect(result.current.error).toBe('No se pudo eliminar');
    expect(result.current.proveedores).toHaveLength(1);
  });

  it('genera una solicitud y abre el modal', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [] } });
    api.post.mockResolvedValueOnce({
      data: {
        data: {
          plantilla_texto: 'Solicitud de materiales',
          solicitud_id: 12,
        },
      },
    });

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    const items = [{ variante_id: 3, cantidad: 10 }];

    await act(async () => {
      await result.current.onGenerarPedido(
        7,
        'Proveedor A',
        '0999999999',
        items,
      );
    });

    expect(api.post).toHaveBeenCalledWith(
      '/proveedores/solicitudes/generar',
      {
        proveedor_id: 7,
        items,
      },
    );

    expect(result.current.modalSolicitud).toEqual({
      proveedor_id: 7,
      nombreProveedor: 'Proveedor A',
      telefono_whatsapp: '0999999999',
      plantilla: 'Solicitud de materiales',
      solicitudId: 12,
    });
  });

  it('maneja error al generar una solicitud', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [] } });
    api.post.mockRejectedValueOnce(new Error('post'));

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    await act(async () => {
      await result.current.onGenerarPedido(
        7,
        'Proveedor A',
        null,
        [],
      );
    });

    expect(result.current.error).toBe('Error al generar la solicitud');
    expect(result.current.modalSolicitud).toBe(null);
  });

  it('permite cargar historial manualmente', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({
        data: { data: [{ id: 9, estado: 'pendiente' }] },
      });

    const { result } = renderHook(() => useProveedoresMain());

    await act(async () => { });

    await act(async () => {
      await result.current.cargarHistorial();
    });

    expect(api.get).toHaveBeenLastCalledWith(
      '/proveedores/solicitudes/historial',
    );
    expect(result.current.historial).toEqual([
      { id: 9, estado: 'pendiente' },
    ]);
  });
});
