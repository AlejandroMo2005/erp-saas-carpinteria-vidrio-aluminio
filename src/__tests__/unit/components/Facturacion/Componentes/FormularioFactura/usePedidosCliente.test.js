import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import usePedidosCliente from '../../../../../../presentation/components/Facturacion/Componentes/FormularioFactura/usePedidosCliente';
import api from '../../../../../../presentation/api/api';

vi.mock('../../../../../../presentation/api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('usePedidosCliente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('limpia los pedidos cuando no existe clienteId', () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    expect(result.current.pedidosCliente).toEqual([]);
    expect(result.current.pedidoVinculado).toBeNull();
    expect(result.current.errorPedidosCliente).toBeNull();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('carga los pedidos del cliente correctamente', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [
          { id: 10, total: 250 },
          { id: 11, total: 400 },
        ],
      },
    });

    const { result } = renderHook(() => usePedidosCliente({ clienteId: 5 }));

    expect(result.current.cargandoPedidos).toBe(true);

    await waitFor(() => {
      expect(result.current.cargandoPedidos).toBe(false);
    });

    expect(api.get).toHaveBeenCalledWith('/facturacion/pedidos-cliente/5');
    expect(result.current.pedidosCliente).toEqual([
      { id: 10, total: 250 },
      { id: 11, total: 400 },
    ]);
    expect(result.current.errorPedidosCliente).toBeNull();
  });

  it('usa una lista vacía cuando la respuesta no contiene data', async () => {
    api.get.mockResolvedValue({
      data: {},
    });

    const { result } = renderHook(() => usePedidosCliente({ clienteId: 5 }));

    await waitFor(() => {
      expect(result.current.cargandoPedidos).toBe(false);
    });

    expect(result.current.pedidosCliente).toEqual([]);
  });

  it('expone el error cuando falla la carga de pedidos', async () => {
    api.get.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => usePedidosCliente({ clienteId: 5 }));

    await waitFor(() => {
      expect(result.current.cargandoPedidos).toBe(false);
    });

    expect(result.current.errorPedidosCliente).toBe(
      'No se pudieron cargar los pedidos de este cliente.'
    );
    expect(result.current.pedidosCliente).toEqual([]);
  });

  it('cancela la actualización cuando el hook se desmonta durante la carga', async () => {
    let resolveRequest;
    api.get.mockReturnValue(
      new Promise(resolve => {
        resolveRequest = resolve;
      })
    );

    const { result, unmount } = renderHook(
      () => usePedidosCliente({ clienteId: 5 })
    );

    expect(result.current.cargandoPedidos).toBe(true);

    unmount();

    resolveRequest({
      data: {
        data: [{ id: 20, total: 100 }],
      },
    });

    await Promise.resolve();

    expect(api.get).toHaveBeenCalledWith('/facturacion/pedidos-cliente/5');
  });

  it('selecciona un pedido con ítems y construye los datos de factura', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: [
          { id: 1, trabajo_nombre: 'Ventana', ancho: 100, alto: 200, cantidad: 1 },
          { id: 2, trabajo_nombre: 'Puerta', ancho: 80, alto: 200, cantidad: 1 },
        ],
      },
    });

    const { result } = renderHook(() => usePedidosCliente({ clienteId: 5 }));

    await waitFor(() => {
      expect(result.current.cargandoPedidos).toBe(false);
    });

    api.get.mockResolvedValueOnce({
      data: {
        data: {
          items: [
            { id: 1, trabajo_nombre: 'Ventana', ancho: 100, alto: 100, cantidad: 1 },
            { id: 2, trabajo_nombre: 'Puerta', ancho: 200, alto: 100, cantidad: 1 },
          ],
        },
      },
    });

    const setItems = vi.fn();

    await act(async () => {
      await result.current.seleccionarPedido(
        { id: 20, total: 300 },
        setItems
      );
    });

    expect(api.get).toHaveBeenLastCalledWith('/pedidos/20');
    expect(setItems).toHaveBeenCalledTimes(1);

    const [items] = setItems.mock.calls[0];

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      descripcion: 'Ventana — 100×100 cm',
      cantidad: 1,
      precio_unitario: 100,
      descuento: 0,
      aplica_iva: true,
    });
    expect(items[1]).toMatchObject({
      descripcion: 'Puerta — 200×100 cm',
      cantidad: 1,
      precio_unitario: 200,
      descuento: 0,
      aplica_iva: true,
    });
    expect(result.current.pedidoVinculado).toEqual({
      id: 20,
      total: 300,
    });
    expect(result.current.cargandoItemsPedido).toBe(false);
  });

  it('acepta detalle como fuente de ítems del pedido', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    api.get.mockResolvedValue({
      data: {
        pedido: {
          detalle: [
            {
              trabajo_nombre: 'Puerta',
              ancho: 100,
              alto: 200,
              cantidad: 1,
            },
          ],
        },
      },
    });

    const setItems = vi.fn();

    await act(async () => {
      await result.current.seleccionarPedido(
        { id: 21, total: 150 },
        setItems
      );
    });

    const [items] = setItems.mock.calls[0];

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      descripcion: 'Puerta — 100×200 cm',
      cantidad: 1,
      precio_unitario: 150,
      descuento: 0,
      aplica_iva: true,
    });
  });

  it('acepta data directa como fuente de ítems del pedido', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    api.get.mockResolvedValue({
      data: {
        items: [
          {
            trabajo_nombre: 'Ventana',
            ancho: 100,
            alto: 100,
            cantidad: 1,
          },
        ],
      },
    });

    const setItems = vi.fn();

    await act(async () => {
      await result.current.seleccionarPedido(
        { id: 22, total: 120 },
        setItems
      );
    });

    const [items] = setItems.mock.calls[0];

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      descripcion: 'Ventana — 100×100 cm',
      cantidad: 1,
      precio_unitario: 120,
      descuento: 0,
      aplica_iva: true,
    });
  });

  it('crea un ítem único cuando el pedido no tiene ítems', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    api.get.mockResolvedValue({
      data: {
        data: {
          items: [],
        },
      },
    });

    const setItems = vi.fn();

    await act(async () => {
      await result.current.seleccionarPedido(
        {
          id: 22,
          total: 450,
          trabajos_nombres: 'Instalación de ventanas',
        },
        setItems
      );
    });

    const [items] = setItems.mock.calls[0];

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      descripcion: 'Instalación de ventanas',
      cantidad: 1,
      precio_unitario: 450,
      descuento: 0,
      aplica_iva: true,
    });
  });

  it('usa Servicio cuando un pedido sin ítems no tiene trabajos_nombres', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    api.get.mockResolvedValue({
      data: {
        data: {},
      },
    });

    const setItems = vi.fn();

    await act(async () => {
      await result.current.seleccionarPedido(
        { id: 23, total: 200 },
        setItems
      );
    });

    const [items] = setItems.mock.calls[0];

    expect(items[0]).toMatchObject({
      descripcion: 'Servicio',
      cantidad: 1,
      precio_unitario: 200,
    });
  });

  it('usa resp.data directamente y total 0 cuando el total no es válido', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    const setItems = vi.fn();

    api.get.mockResolvedValue({
      data: {
        items: [
          {
            id: 30,
            trabajo_nombre: 'Ventana',
            ancho: 100,
            alto: 100,
            cantidad: 1,
          },
        ],
      },
    });

    await act(async () => {
      await result.current.seleccionarPedido(
        { id: 30, total: 'no válido' },
        setItems
      );
    });

    expect(api.get).toHaveBeenCalledWith('/pedidos/30');
    expect(setItems).toHaveBeenCalledTimes(1);
    expect(setItems.mock.calls[0][0][0].precio_unitario).toBe(0);
  });

  it('usa resp.data como detalle cuando no existen data ni pedido', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    const setItems = vi.fn();

    api.get.mockResolvedValue({
      data: {
        items: [
          {
            id: 32,
            trabajo_nombre: 'Cielo raso',
            ancho: 100,
            alto: 100,
            cantidad: 1,
          },
        ],
      },
    });

    await act(async () => {
      await result.current.seleccionarPedido(
        { id: 32, total: 100 },
        setItems
      );
    });

    expect(setItems).toHaveBeenCalledTimes(1);
    expect(setItems.mock.calls[0][0]).toHaveLength(1);
    expect(setItems.mock.calls[0][0][0].descripcion).toContain('Cielo raso');
  });

  it('usa resp.data cuando data y pedido son null', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    const setItems = vi.fn();

    api.get.mockResolvedValue({
      data: {
        data: null,
        pedido: null,
        items: [
          {
            id: 33,
            trabajo_nombre: 'Mampara',
            ancho: 100,
            alto: 100,
            cantidad: 1,
          },
        ],
      },
    });

    await act(async () => {
      await result.current.seleccionarPedido(
        { id: 33, total: 100 },
        setItems
      );
    });

    expect(setItems).toHaveBeenCalledTimes(1);
    expect(setItems.mock.calls[0][0][0].descripcion).toContain('Mampara');
  });

  it('usa cantidad 1 cuando la cantidad del ítem no es válida', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    const setItems = vi.fn();

    api.get.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              id: 31,
              trabajo_nombre: 'Puerta',
              ancho: 100,
              alto: 100,
              cantidad: 'no válida',
            },
          ],
        },
      },
    });

    await act(async () => {
      await result.current.seleccionarPedido(
        { id: 31, total: 100 },
        setItems
      );
    });

    expect(setItems).toHaveBeenCalledTimes(1);
    expect(setItems.mock.calls[0][0][0].cantidad).toBe(1);
  });

  it('desvincula el pedido cuando se selecciona nuevamente', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    const setItems = vi.fn();

    api.get.mockResolvedValue({
      data: {
        data: {},
      },
    });

    const pedido = { id: 24, total: 100 };

    await act(async () => {
      await result.current.seleccionarPedido(pedido, setItems);
    });

    expect(result.current.pedidoVinculado).toEqual(pedido);

    await act(async () => {
      await result.current.seleccionarPedido(pedido, setItems);
    });

    expect(result.current.pedidoVinculado).toBeNull();
    expect(setItems).toHaveBeenCalledTimes(2);
    expect(setItems.mock.calls[1][0]).toHaveLength(1);
    expect(setItems.mock.calls[1][0][0]).toMatchObject({
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      aplica_iva: true,
    });
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('expone el mensaje del backend cuando falla el detalle del pedido', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    api.get.mockRejectedValue({
      response: {
        data: {
          message: 'Pedido no disponible',
        },
      },
    });

    const setItems = vi.fn();

    await act(async () => {
      await result.current.seleccionarPedido(
        { id: 25, total: 100 },
        setItems
      );
    });

    expect(result.current.errorPedido).toBe('Pedido no disponible');
    expect(result.current.cargandoItemsPedido).toBe(false);
    expect(setItems).not.toHaveBeenCalled();
  });

  it('usa el mensaje fallback cuando falla el detalle sin mensaje del backend', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    api.get.mockRejectedValue(new Error('network error'));

    const setItems = vi.fn();

    await act(async () => {
      await result.current.seleccionarPedido(
        { id: 26, total: 100 },
        setItems
      );
    });

    expect(result.current.errorPedido).toBe(
      'No se pudieron cargar los ítems. Completa los campos manualmente.'
    );
    expect(result.current.cargandoItemsPedido).toBe(false);
  });

  it('desvincula manualmente el pedido y reinicia los ítems', async () => {
    const { result } = renderHook(() => usePedidosCliente({ clienteId: null }));

    const setItems = vi.fn();

    act(() => {
      result.current.desvincularPedido(setItems);
    });

    expect(result.current.pedidoVinculado).toBeNull();
    expect(result.current.errorPedido).toBeNull();
    expect(setItems).toHaveBeenCalledTimes(1);
    expect(setItems.mock.calls[0][0]).toHaveLength(1);
    expect(setItems.mock.calls[0][0][0]).toMatchObject({
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      aplica_iva: true,
    });
  });

});
