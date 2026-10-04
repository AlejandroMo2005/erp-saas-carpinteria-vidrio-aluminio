import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useListaFacturas from '../../../../../../presentation/components/Facturacion/Componentes/ListaFacturas/useListaFacturas';
import api from '../../../../../../presentation/api/api';

vi.mock('../../../../../../presentation/api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('useListaFacturas', () => {
  const onToastError = vi.fn();
  const onToastSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          facturas: [],
          paginacion: {
            total: 0,
            totalPaginas: 0,
          },
        },
      },
    });
  });

  it('carga las facturas inicialmente y actualiza la paginación', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          facturas: [{ id: 1, numero: '001-001-000000001' }],
          paginacion: {
            total: 1,
            totalPaginas: 1,
          },
        },
      },
    });

    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledWith('/facturacion?pagina=1&limite=20');
    expect(result.current.facturas).toEqual([
      { id: 1, numero: '001-001-000000001' },
    ]);
    expect(result.current.paginacion).toMatchObject({
      pagina: 1,
      limite: 20,
      total: 1,
      totalPaginas: 1,
    });
    expect(result.current.error).toBeNull();
  });

  it('maneja un error con mensaje del backend', async () => {
    api.get.mockRejectedValueOnce({
      response: {
        data: {
          message: 'No autorizado',
        },
      },
    });

    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('No autorizado');
    expect(result.current.facturas).toEqual([]);
  });

  it('usa el mensaje genérico cuando falla sin respuesta del backend', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Error al cargar facturas');
  });

  it('aplica los filtros al construir la consulta', async () => {
    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleBusquedaChange({
        target: { value: 'Juan' },
      });
      result.current.handleEstadoChange({
        target: { value: 'AUTORIZADA' },
      });
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/facturacion?pagina=1&limite=20&clienteNombre=Juan&estado=AUTORIZADA'
      );
    });
  });

  it('reinicia la página al cambiar la búsqueda', async () => {
    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.paginaSiguiente();
    });

    await waitFor(() => {
      expect(result.current.paginacion.pagina).toBe(2);
    });

    act(() => {
      result.current.handleBusquedaChange({
        target: { value: 'Cliente' },
      });
    });

    expect(result.current.filtros.busqueda).toBe('Cliente');
    expect(result.current.paginacion.pagina).toBe(1);
  });

  it('reinicia la página al cambiar el estado', async () => {
    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.paginaSiguiente();
    });

    await waitFor(() => {
      expect(result.current.paginacion.pagina).toBe(2);
    });

    act(() => {
      result.current.handleEstadoChange({
        target: { value: 'ANULADA' },
      });
    });

    expect(result.current.filtros.estado).toBe('ANULADA');
    expect(result.current.paginacion.pagina).toBe(1);
  });

  it('cierra el modal, recarga las facturas y muestra el toast al crear una factura', async () => {
    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const llamadasIniciales = api.get.mock.calls.length;

    act(() => {
      result.current.setModalFormulario(true);
    });

    expect(result.current.modalFormulario).toBe(true);

    act(() => {
      result.current.handleFacturaCreada();
    });

    expect(result.current.modalFormulario).toBe(false);
    expect(onToastSuccess).toHaveBeenCalledWith(
      'Factura creada correctamente.'
    );

    await waitFor(() => {
      expect(api.get.mock.calls.length).toBeGreaterThan(llamadasIniciales);
    });
  });

  it('descarga el PDF y genera el nombre de archivo esperado', async () => {
    const createObjectURL = vi.fn(() => 'blob:factura');
    const revokeObjectURL = vi.fn();
    const click = vi.fn();

    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;

    let enlaceCreado;

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);

      if (tagName === 'a') {
        enlaceCreado = element;
        vi.spyOn(element, 'click').mockImplementation(click);
      }

      return element;
    });

    api.get.mockResolvedValueOnce({
      data: new Blob(['pdf']),
    });

    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleDescargarPDF(25, '001-001-000000025');
    });

    expect(api.get).toHaveBeenCalledWith(
      '/facturacion/25/pdf',
      { responseType: 'blob' }
    );
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:factura');
    expect(onToastError).not.toHaveBeenCalled();
  });

  it('usa el id como nombre del PDF cuando no existe numeroFactura', async () => {
    const createObjectURL = vi.fn(() => 'blob:factura');
    const revokeObjectURL = vi.fn();
    const click = vi.fn();

    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;

    let enlaceCreado;

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);

      if (tagName === 'a') {
        enlaceCreado = element;
        vi.spyOn(element, 'click').mockImplementation(click);
      }

      return element;
    });

    api.get.mockResolvedValueOnce({
      data: new Blob(['pdf']),
    });

    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleDescargarPDF(25, null);
    });

    expect(enlaceCreado.download).toBe('RIDE_25.pdf');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:factura');
  });

  it('muestra el mensaje del backend cuando falla la descarga del PDF', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/facturacion/25/pdf') {
        return Promise.reject({
          response: {
            data: {
              message: 'Factura no disponible para descarga.',
            },
          },
        });
      }

      return Promise.resolve({
        data: {
          success: false,
        },
      });
    });

    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleDescargarPDF(25, '001-001-000000025');
    });

    expect(onToastError).toHaveBeenCalledWith(
      'Factura no disponible para descarga.'
    );
  });

  it('usa el mensaje genérico cuando falla la descarga sin mensaje del backend', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/facturacion/25/pdf') {
        return Promise.reject(new Error('Network error'));
      }

      return Promise.resolve({
        data: {
          success: false,
        },
      });
    });

    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleDescargarPDF(25, '001-001-000000025');
    });

    expect(onToastError).toHaveBeenCalledWith(
      'No se pudo generar el PDF.'
    );
  });

  it('calcula correctamente los rangos cuando no hay facturas', async () => {
    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.rangoDesde).toBe(0);
    expect(result.current.rangoHasta).toBe(0);
  });

  it('calcula correctamente los rangos cuando hay facturas', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          facturas: [{ id: 1 }],
          paginacion: {
            total: 25,
            totalPaginas: 2,
          },
        },
      },
    });

    const { result } = renderHook(() =>
      useListaFacturas({ onToastError, onToastSuccess })
    );

    await waitFor(() => {
      expect(result.current.paginacion.total).toBe(25);
    });

    expect(result.current.rangoDesde).toBe(1);
    expect(result.current.rangoHasta).toBe(20);

    act(() => {
      result.current.paginaSiguiente();
    });

    await waitFor(() => {
      expect(result.current.paginacion.pagina).toBe(2);
    });

    expect(result.current.rangoDesde).toBe(21);
    expect(result.current.rangoHasta).toBe(25);
  });
});
