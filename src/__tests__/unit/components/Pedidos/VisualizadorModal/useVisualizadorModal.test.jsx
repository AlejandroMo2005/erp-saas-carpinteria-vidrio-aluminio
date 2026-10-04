import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('../../../../../presentation/api/api', () => ({
  default: {
    get: mocks.get,
  },
}));

import { useVisualizadorModal } from '../../../../../presentation/components/Pedidos/VisualizadorModal/useVisualizadorModal';

const pedidoBase = {
  id: 42,
  cliente: 'Cliente Demo',
  trabajos_nombres: 'Ventanas, Puertas',
};

describe('useVisualizadorModal', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.get.mockReset();

    vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
      callback();
      return 1;
    }));

    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.style.overflow = '';
  });

  it('inicializa los datos básicos del pedido', async () => {
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido: pedidoBase,
        onClose,
      })
    );

    expect(result.current.ancho).toBe('1.50');
    expect(result.current.alto).toBe('1.20');
    expect(result.current.colorMarcoHex).toBe('#808080');
    expect(result.current.colorVidrioHex).toBe('#e0f2ff');
    expect(result.current.clienteInfo).toBe('Cliente Demo');
    expect(result.current.trabajoNombre).toBe('Ventanas');
    expect(result.current.cargandoDetalles).toBe(true);

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });

    expect(mocks.get).toHaveBeenCalledWith('/pedidos/42');
    expect(result.current.tipoTrabajo).toBe('Ventanas');
    expect(result.current.PreviewComponent).toBeTruthy();
  });

  it('usa guion cuando el pedido no tiene trabajos', async () => {
    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido: {
          id: 43,
          cliente: 'Cliente Sin Trabajo',
          trabajos_nombres: '',
        },
        onClose: vi.fn(),
      })
    );

    expect(result.current.trabajoNombre).toBe('—');

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });
  });

  it('carga los datos desde localStorage sin consultar la API', async () => {
    localStorage.setItem(
      'pedido_42_datos',
      JSON.stringify({
        trabajo_nombre: 'Puerta de Cocina',
        ancho: 2,
        alto: 1.5,
        color_nombre: 'Bronce',
        detalle: 'Puerta corrediza',
        cliente: 'Cliente Local',
      })
    );

    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido: pedidoBase,
        onClose: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });

    expect(mocks.get).not.toHaveBeenCalled();
    expect(result.current.trabajoNombre).toBe('Puerta de Cocina');
    expect(result.current.ancho).toBe('2');
    expect(result.current.alto).toBe('1.5');
    expect(result.current.colorMarcoHex).toBe('#CD7F32');
    expect(result.current.colorVidrioHex).toBe('#CD7F32');
    expect(result.current.detallesTrabajo).toBe('Puerta corrediza');
    expect(result.current.clienteInfo).toBe('Cliente Local');
    expect(result.current.tipoTrabajo).toBeNull();
  });

  it('usa los datos del primer item cuando no existe información local', async () => {
    mocks.get.mockResolvedValue({
      data: {
        cliente: 'Cliente API',
        items: [
          {
            trabajo_nombre: 'Ventanas',
            ancho: 1.8,
            alto: 2,
            color_nombre: 'Vidrio Azul',
            detalle: 'Ventana corrediza',
          },
          {
            trabajo_nombre: 'Puertas',
          },
        ],
      },
    });

    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido: pedidoBase,
        onClose: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });

    expect(result.current.trabajoNombre).toBe('Ventanas');
    expect(result.current.ancho).toBe('1.8');
    expect(result.current.alto).toBe('2');
    expect(result.current.colorMarcoHex).toBe('#6eb5ff');
    expect(result.current.colorVidrioHex).toBe('#6eb5ff');
    expect(result.current.detallesTrabajo).toBe('Ventana corrediza');
    expect(result.current.clienteInfo).toBe('Cliente API');
  });

  it('finaliza la carga aunque la API no tenga items', async () => {
    mocks.get.mockResolvedValue({
      data: {
        cliente: 'Cliente sin detalle',
        items: [],
      },
    });

    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido: pedidoBase,
        onClose: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });

    expect(result.current.trabajoNombre).toBe('Ventanas');
    expect(result.current.clienteInfo).toBe('Cliente Demo');
  });

  it('mantiene los valores iniciales cuando la API devuelve campos vacíos', async () => {
    mocks.get.mockResolvedValue({
      data: {
        items: [
          {
            trabajo_nombre: '',
            ancho: 0,
            alto: 0,
            color_nombre: '',
            detalle: '',
          },
        ],
      },
    });

    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido: pedidoBase,
        onClose: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });

    expect(result.current.ancho).toBe('1.50');
    expect(result.current.alto).toBe('1.20');
    expect(result.current.colorMarcoHex).toBe('#808080');
    expect(result.current.colorVidrioHex).toBe('#e0f2ff');
    expect(result.current.detallesTrabajo).toBe('');
  });

  it('maneja errores de la API y finaliza la carga', async () => {
    const error = new Error('API caída');
    mocks.get.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido: pedidoBase,
        onClose: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });

    expect(console.error).toHaveBeenCalledWith(
      '[VisualizadorModal] Error cargando pedido:',
      error
    );

    expect(result.current.trabajoNombre).toBe('Ventanas');
    expect(result.current.clienteInfo).toBe('Cliente Demo');
  });

  it('resuelve tipos de trabajo mediante coincidencia parcial', async () => {
    const pedido = {
      id: 50,
      cliente: 'Cliente',
      trabajos_nombres: 'Ventanas corredizas de aluminio',
    };

    mocks.get.mockResolvedValue({
      data: {
        items: [],
      },
    });

    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido,
        onClose: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });

    expect(result.current.tipoTrabajo).toBe('Ventanas');
    expect(result.current.PreviewComponent).toBeTruthy();
  });

  it('devuelve tipoTrabajo null cuando no puede identificar el trabajo', async () => {
    const pedido = {
      id: 51,
      cliente: 'Cliente',
      trabajos_nombres: 'Trabajo desconocido',
    };

    mocks.get.mockResolvedValue({
      data: {
        items: [],
      },
    });

    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido,
        onClose: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });

    expect(result.current.tipoTrabajo).toBeNull();
    expect(result.current.PreviewComponent).toBeNull();
  });

  it('devuelve tipoTrabajo null cuando el nombre inicial está vacío', async () => {
    const pedido = {
      id: 52,
      cliente: 'Cliente',
      trabajos_nombres: '',
    };

    mocks.get.mockResolvedValue({
      data: {
        items: [],
      },
    });

    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido,
        onClose: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });

    expect(result.current.trabajoNombre).toBe('—');
    expect(result.current.tipoTrabajo).toBeNull();
    expect(result.current.PreviewComponent).toBeNull();
  });

  it('cierra el modal cuando se presiona Escape', async () => {
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido: pedidoBase,
        onClose,
      })
    );

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignora teclas distintas de Escape', async () => {
    const onClose = vi.fn();

    renderHook(() =>
      useVisualizadorModal({
        pedido: pedidoBase,
        onClose,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('bloquea el scroll del body y lo restaura al desmontar', async () => {
    const { unmount } = renderHook(() =>
      useVisualizadorModal({
        pedido: pedidoBase,
        onClose: vi.fn(),
      })
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('unset');
  });

  it('dispara resize después de finalizar la carga', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const { result } = renderHook(() =>
      useVisualizadorModal({
        pedido: pedidoBase,
        onClose: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.cargandoDetalles).toBe(false);
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'resize' })
    );
  });
});
