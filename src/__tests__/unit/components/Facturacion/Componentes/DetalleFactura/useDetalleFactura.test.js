import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useDetalleFactura from '../../../../../../presentation/components/Facturacion/Componentes/DetalleFactura/useDetalleFactura';
import api from '../../../../../../presentation/api/api';

vi.mock('../../../../../../presentation/api/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('useDetalleFactura', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  const onAnulada = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 25,
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
        },
      },
    });
  });

  it('carga la factura correctamente', async () => {
    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.factura).toEqual({
      id: 25,
      numero_factura: '001-001-000000025',
      estado: 'AUTORIZADA',
    });
    expect(result.current.error).toBeNull();
    expect(api.get).toHaveBeenCalledWith('/facturacion/25');
  });

  it('maneja un error del backend al cargar la factura', async () => {
    api.get.mockRejectedValueOnce({
      response: { data: { message: 'Factura no encontrada' } },
    });

    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Factura no encontrada');
    expect(result.current.factura).toBeNull();
  });

  it('usa el mensaje genérico cuando la carga falla sin mensaje del backend', async () => {
    api.get.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Error al cargar la factura');
  });

  it('usa resp.data.factura como fallback de la respuesta', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        factura: {
          id: 25,
          numero_factura: '001-001-000000025',
        },
      },
    });

    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.factura).toEqual({
      id: 25,
      numero_factura: '001-001-000000025',
    });
  });

  it('rechaza un motivo de anulación menor de 10 caracteres', async () => {
    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setMotivo('corto');
    });

    await act(async () => {
      await result.current.handleAnular();
    });

    expect(result.current.errorMotivo)
      .toBe('El motivo debe tener al menos 10 caracteres');
    expect(api.put).not.toHaveBeenCalled();
  });
  it('anula la factura correctamente', async () => {
    api.put.mockResolvedValueOnce({ data: { success: true } });

    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setMotivo('Cliente solicita anulación');
    });

    await act(async () => {
      await result.current.handleAnular();
    });

    expect(api.put).toHaveBeenCalledWith(
      '/facturacion/25/anular',
      { motivo: 'Cliente solicita anulación' }
    );
    expect(result.current.modalAnular).toBe(false);
    expect(result.current.motivo).toBe('');
    expect(result.current.errorMotivo).toBe('');
    expect(result.current.anulando).toBe(false);
    expect(onAnulada).toHaveBeenCalledTimes(1);
  });

  it('muestra el error del backend al anular la factura', async () => {
    api.put.mockRejectedValueOnce({
      response: { data: { message: 'La factura ya fue anulada' } },
    });

    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setMotivo('Cliente solicita anulación');
    });

    await act(async () => {
      await result.current.handleAnular();
    });

    expect(result.current.errorMotivo)
      .toBe('La factura ya fue anulada');
    expect(result.current.anulando).toBe(false);
    expect(onAnulada).not.toHaveBeenCalled();
  });

  it('usa el mensaje genérico cuando falla la anulación sin mensaje del backend', async () => {
    api.put.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setMotivo('Cliente solicita anulación');
    });

    await act(async () => {
      await result.current.handleAnular();
    });

    expect(result.current.errorMotivo)
      .toBe('Error al anular la factura');
    expect(result.current.anulando).toBe(false);
    expect(onAnulada).not.toHaveBeenCalled();
  });

  it('abre y cierra el modal de anulación limpiando su estado', async () => {
    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setMotivo('Motivo temporal');
      result.current.setErrorMotivo('Error temporal');
      result.current.abrirModalAnular();
    });

    expect(result.current.modalAnular).toBe(true);

    act(() => {
      result.current.cerrarModalAnular();
    });

    expect(result.current.modalAnular).toBe(false);
    expect(result.current.motivo).toBe('');
    expect(result.current.errorMotivo).toBe('');
  });

  it('descarga el PDF usando el número de factura', async () => {
    const createObjectURL = vi.fn(() => 'blob:factura');
    const revokeObjectURL = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    await act(async () => {
      await result.current.handleDescargarPDF('001-001-000000025');
    });

    expect(api.get).toHaveBeenCalledWith(
      '/facturacion/25/pdf',
      { responseType: 'blob' }
    );
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:factura');
  });

  it('maneja el error al imprimir el PDF', async () => {
    const alert = vi.fn();
    vi.stubGlobal('alert', alert);

    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    api.get.mockRejectedValueOnce(new Error('PDF error'));

    await act(async () => {
      await result.current.handleImprimir();
    });

    expect(alert).toHaveBeenCalledWith(
      'No se pudo generar el PDF para imprimir.'
    );
  });

  it('usa el id de la factura como fallback para el nombre del PDF', async () => {
    const createObjectURL = vi.fn(() => 'blob:factura');
    const revokeObjectURL = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const link = originalCreateElement('a');

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') return link;
      return originalCreateElement(tagName);
    });

    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleDescargarPDF();
    });

    expect(link.download).toBe('RIDE_25.pdf');
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('abre e imprime el PDF correctamente', async () => {
    const createObjectURL = vi.fn(() => 'blob:factura');
    const revokeObjectURL = vi.fn();
    const addEventListener = vi.fn();
    const print = vi.fn();
    const ventana = {
      addEventListener,
      print,
    };

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    vi.spyOn(window, 'open').mockReturnValue(ventana);

    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleImprimir();
    });

    expect(api.get).toHaveBeenCalledWith(
      '/facturacion/25/pdf',
      { responseType: 'blob' }
    );
    expect(window.open).toHaveBeenCalledWith('blob:factura');
    expect(addEventListener).toHaveBeenCalledWith(
      'load',
      expect.any(Function)
    );

    const onLoad = addEventListener.mock.calls[0][1];

    onLoad();

    expect(print).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:factura');
  });

  it('maneja el error al descargar el PDF', async () => {
    const alert = vi.fn();
    vi.stubGlobal('alert', alert);

    const { result } = renderHook(() =>
      useDetalleFactura({ facturaId: 25, onAnulada })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    api.get.mockRejectedValueOnce(new Error('PDF error'));

    await act(async () => {
      await result.current.handleDescargarPDF('001-001-000000025');
    });

    expect(alert).toHaveBeenCalledWith(
      'No se pudo generar el PDF. Intenta de nuevo.'
    );
  });

});
