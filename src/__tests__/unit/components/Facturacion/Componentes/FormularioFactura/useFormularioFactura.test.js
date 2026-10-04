import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useFormularioFactura from '../../../../../../presentation/components/Facturacion/Componentes/FormularioFactura/useFormularioFactura';
import api from '../../../../../../presentation/api/api';

vi.mock('../../../../../../presentation/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('useFormularioFactura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      data: {
        success: false,
      },
    });
  });

  it('inicializa el formulario con los valores por defecto', () => {
    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    expect(result.current.paso).toBe(1);
    expect(result.current.clienteSeleccionado).toBeNull();
    expect(result.current.items).toHaveLength(1);
    expect(result.current.observaciones).toBe('');
    expect(result.current.guardando).toBe(false);
    expect(result.current.errores).toEqual({});
    expect(result.current.errorGeneral).toBeNull();
    expect(result.current.exito).toBe(false);
    expect(result.current.facturaCreada).toBeNull();
  });

  it('carga la tasa IVA configurada', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/configuracion/IVA') {
        return Promise.resolve({
          data: {
            success: true,
            data: { valor: '0.12' },
          },
        });
      }

      return Promise.resolve({ data: null });
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    await waitFor(() => {
      expect(result.current.tasaIva).toBe(0.12);
    });
  });

  it('mantiene el IVA por defecto cuando la configuración no es válida', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: { valor: 'no-es-un-numero' },
      },
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/configuracion/IVA');
    });

    expect(result.current.tasaIva).toBe(0.15);
  });

  it('usa el IVA por defecto cuando la configuración no contiene valor', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {},
      },
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/configuracion/IVA');
    });

    expect(result.current.tasaIva).toBe(0.15);
  });

  it('carga los ítems del pedido inicial', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/configuracion/IVA') {
        return Promise.resolve({
          data: { success: false },
        });
      }

      if (url === '/pedidos/10') {
        return Promise.resolve({
          data: {
            data: {
              total: '250',
              items: [
                {
                  id: 1,
                  trabajo_nombre: 'Ventana',
                  ancho: 100,
                  alto: 120,
                  cantidad: 2,
                },
              ],
            },
          },
        });
      }

      return Promise.resolve({ data: null });
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: 10,
        onFacturaCreada: undefined,
      })
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].descripcion).toContain('Ventana');
    });

    expect(api.get).toHaveBeenCalledWith('/pedidos/10');
    expect(result.current.items[0].cantidad).toBe(2);
  });

  it('usa detalle del pedido cuando no existe data', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/pedidos/11') {
        return Promise.resolve({
          data: {
            pedido: {
              total: '100',
              detalle: [
                {
                  id: 2,
                  trabajo_nombre: 'Puerta',
                  ancho: 90,
                  alto: 200,
                  cantidad: 1,
                },
              ],
            },
          },
        });
      }

      return Promise.resolve({ data: { success: false } });
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: 11,
        onFacturaCreada: undefined,
      })
    );

    await waitFor(() => {
      expect(result.current.items[0].descripcion).toContain('Puerta');
    });

    expect(result.current.items[0].cantidad).toBe(1);
  });

  it('no reemplaza los ítems cuando el pedido no tiene detalle', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/pedidos/12') {
        return Promise.resolve({
          data: {
            data: {
              total: '100',
              items: [],
            },
          },
        });
      }

      return Promise.resolve({ data: { success: false } });
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: 12,
        onFacturaCreada: undefined,
      })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/pedidos/12');
    });

    expect(result.current.items).toHaveLength(1);
  });

  it('no reemplaza los ítems cuando la respuesta del pedido no contiene pedido', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/pedidos/14') {
        return Promise.resolve({
          data: null,
        });
      }

      return Promise.resolve({ data: { success: false } });
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: 14,
        onFacturaCreada: undefined,
      })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/pedidos/14');
    });

    expect(result.current.items).toHaveLength(1);
  });

  it('usa cero para el total inválido y uno para la cantidad inválida del pedido', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/pedidos/15') {
        return Promise.resolve({
          data: {
            data: {
              total: 'no-es-un-numero',
              items: [
                {
                  id: 3,
                  trabajo_nombre: 'Mampara',
                  ancho: 80,
                  alto: 200,
                  cantidad: 'no-es-un-numero',
                },
              ],
            },
          },
        });
      }

      return Promise.resolve({ data: { success: false } });
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: 15,
        onFacturaCreada: undefined,
      })
    );

    await waitFor(() => {
      expect(result.current.items[0].descripcion).toContain('Mampara');
    });

    expect(result.current.items[0].cantidad).toBe(1);
  });

  it('continúa con el formulario cuando falla la carga del pedido', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/pedidos/13') {
        return Promise.reject(new Error('Error de prueba'));
      }

      return Promise.resolve({ data: { success: false } });
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: 13,
        onFacturaCreada: undefined,
      })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/pedidos/13');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.errorGeneral).toBeNull();
  });

  it('agrega y elimina ítems sin eliminar el último', () => {
    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    const primerId = result.current.items[0]._id;

    act(() => {
      result.current.eliminarItem(primerId);
    });

    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.agregarItem();
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.eliminarItem(primerId);
    });

    expect(result.current.items).toHaveLength(1);
  });

  it('actualiza un campo del ítem y no modifica otros ítems', () => {
    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    const id = result.current.items[0]._id;

    act(() => {
      result.current.cambiarCampoItem(
        'id-inexistente',
        'descripcion',
        'No debe aplicarse'
      );
    });

    expect(result.current.items[0].descripcion).toBe('');

    act(() => {
      result.current.cambiarCampoItem(id, 'descripcion', 'Ventana de aluminio');
    });

    expect(result.current.items[0].descripcion).toBe('Ventana de aluminio');
  });

  it('valida el paso 1 antes de avanzar', () => {
    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    act(() => {
      result.current.avanzarPaso();
    });

    expect(result.current.paso).toBe(1);
    expect(result.current.errores.cliente).toBe(
      'Debes seleccionar o crear un cliente'
    );
  });

  it('permite avanzar cuando el cliente está seleccionado', () => {
    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    act(() => {
      result.current.setCliente({
        id: 1,
        nombre: 'Cliente prueba',
      });
    });

    act(() => {
      result.current.avanzarPaso();
    });

    expect(result.current.paso).toBe(2);
  });

  it('valida los campos de los ítems en el paso 2', () => {
    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    const id = result.current.items[0]._id;

    act(() => {
      result.current.setCliente({
        id: 1,
        nombre: 'Cliente prueba',
      });
    });

    act(() => {
      result.current.avanzarPaso();
    });

    expect(result.current.paso).toBe(2);

    act(() => {
      result.current.cambiarCampoItem(id, 'descripcion', '');
      result.current.cambiarCampoItem(id, 'cantidad', '0');
      result.current.cambiarCampoItem(id, 'precio_unitario', '-10');
    });

    act(() => {
      result.current.avanzarPaso();
    });

    expect(result.current.paso).toBe(2);
    expect(result.current.errores).toEqual({
      [`item_${id}_descripcion`]: 'Descripción requerida',
      [`item_${id}_cantidad`]: 'Cantidad inválida',
      [`item_${id}_precio_unitario`]: 'Precio inválido',
    });
  });

  it('permite avanzar del paso 2 al paso 3 cuando los ítems son válidos', () => {
    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    act(() => {
      result.current.setCliente({
        id: 1,
        nombre: 'Cliente prueba',
      });
    });

    act(() => {
      result.current.avanzarPaso();
    });

    expect(result.current.paso).toBe(2);

    const id = result.current.items[0]._id;

    act(() => {
      result.current.cambiarCampoItem(id, 'descripcion', 'Ventana de aluminio');
      result.current.cambiarCampoItem(id, 'cantidad', '1');
      result.current.cambiarCampoItem(id, 'precio_unitario', '100');
    });

    act(() => {
      result.current.avanzarPaso();
    });

    expect(result.current.paso).toBe(3);
    expect(result.current.errores).toEqual({});
  });

  it('no avanza más allá del paso 3', () => {
    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    act(() => {
      result.current.setCliente({
        id: 1,
        nombre: 'Cliente prueba',
      });
    });

    act(() => {
      result.current.avanzarPaso();
    });

    const id = result.current.items[0]._id;

    act(() => {
      result.current.cambiarCampoItem(id, 'descripcion', 'Ventana de aluminio');
      result.current.cambiarCampoItem(id, 'cantidad', '1');
      result.current.cambiarCampoItem(id, 'precio_unitario', '100');
    });

    act(() => {
      result.current.avanzarPaso();
    });

    act(() => {
      result.current.avanzarPaso();
    });

    expect(result.current.paso).toBe(3);
  });

  it('guarda una factura con un ítem sin IVA', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 24,
        },
      },
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    act(() => {
      result.current.setCliente({
        id: 2,
        nombre: 'Cliente sin IVA',
      });
      result.current.setItems([
        {
          ...result.current.items[0],
          descripcion: 'Ventana sin IVA',
          cantidad: '2',
          precio_unitario: '100',
          descuento: '0',
          aplica_iva: false,
        },
      ]);
    });

    await act(async () => {
      await result.current.guardar(undefined);
    });

    expect(api.post).toHaveBeenCalledWith(
      '/facturacion',
      expect.objectContaining({
        items: [
          expect.objectContaining({
            descripcion: 'Ventana sin IVA',
            cantidad: 2,
            precio_unitario: 100,
            porcentaje_iva: 0,
          }),
        ],
      })
    );
    expect(result.current.exito).toBe(true);
  });

  it('guarda la factura y ejecuta el callback cuando la creación es exitosa', async () => {
    const onFacturaCreada = vi.fn();

    api.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 25,
          numero: '001-001-000000025',
        },
      },
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: 10,
        onFacturaCreada,
      })
    );

    act(() => {
      result.current.setCliente({
        id: 3,
        nombre: 'Cliente prueba',
        identificacion: '1300000000',
        tipo_identificacion: 'CEDULA',
        direccion: 'Calle principal',
        telefono: '0999999999',
        email: 'cliente@example.com',
      });
      result.current.setObservaciones('  Observación de prueba  ');
    });

    await act(async () => {
      await result.current.guardar({ id: 20 });
    });

    expect(api.post).toHaveBeenCalledWith(
      '/facturacion',
      expect.objectContaining({
        cliente_id: 3,
        cliente_nombre: 'Cliente prueba',
        cliente_identificacion: '1300000000',
        cliente_tipo_identificacion: 'CEDULA',
        cliente_direccion: 'Calle principal',
        cliente_telefono: '0999999999',
        cliente_email: 'cliente@example.com',
        pedido_id: 20,
        observaciones: 'Observación de prueba',
        items: expect.any(Array),
      })
    );
    expect(result.current.facturaCreada).toEqual({
      id: 25,
      numero: '001-001-000000025',
    });
    expect(result.current.exito).toBe(true);
    expect(result.current.guardando).toBe(false);
    expect(result.current.errorGeneral).toBeNull();
    expect(onFacturaCreada).toHaveBeenCalledWith({
      id: 25,
      numero: '001-001-000000025',
    });
  });

  it('usa los valores por defecto del cliente y pedido al guardar', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        factura: {
          id: 26,
        },
      },
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: 30,
        onFacturaCreada: undefined,
      })
    );

    act(() => {
      result.current.setCliente({
        id: null,
        nombre: 'Consumidor final',
      });
      result.current.setObservaciones('   ');
    });

    await act(async () => {
      await result.current.guardar(undefined);
    });

    expect(api.post).toHaveBeenCalledWith(
      '/facturacion',
      expect.objectContaining({
        cliente_id: null,
        cliente_nombre: 'Consumidor final',
        cliente_identificacion: null,
        cliente_tipo_identificacion: 'CONSUMIDOR_FINAL',
        cliente_direccion: null,
        cliente_telefono: null,
        cliente_email: null,
        pedido_id: 30,
        observaciones: null,
        items: expect.any(Array),
      })
    );
    expect(result.current.facturaCreada).toEqual({
      id: 26,
    });
    expect(result.current.exito).toBe(true);
    expect(result.current.guardando).toBe(false);
  });

  it('muestra el mensaje del backend cuando falla la creación', async () => {
    api.post.mockRejectedValue({
      response: {
        data: {
          message: 'No se pudo crear la factura',
        },
      },
    });

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    act(() => {
      result.current.setCliente({
        id: 4,
        nombre: 'Cliente con error',
      });
    });

    await act(async () => {
      await result.current.guardar(undefined);
    });

    expect(result.current.errorGeneral).toBe('No se pudo crear la factura');
    expect(result.current.guardando).toBe(false);
    expect(result.current.exito).toBe(false);
  });

  it('usa el mensaje genérico cuando el error no contiene respuesta del backend', async () => {
    api.post.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    act(() => {
      result.current.setCliente({
        id: 5,
        nombre: 'Cliente sin respuesta',
      });
    });

    await act(async () => {
      await result.current.guardar(undefined);
    });

    expect(result.current.errorGeneral).toBe('Error al crear la factura');
    expect(result.current.guardando).toBe(false);
    expect(result.current.exito).toBe(false);
  });

  it('limpia el error del campo cuando se modifica el ítem', () => {
    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    const id = result.current.items[0]._id;
    const clave = `item_${id}_descripcion`;

    act(() => {
      result.current.setErrores({
        [clave]: 'Descripción requerida',
        otro_error: 'Mantener',
      });
    });

    act(() => {
      result.current.cambiarCampoItem(
        id,
        'descripcion',
        'Ventana de aluminio'
      );
    });

    expect(result.current.errores).toEqual({
      otro_error: 'Mantener',
    });
    expect(result.current.items[0].descripcion).toBe('Ventana de aluminio');
  });

  it('retrocede sin bajar del paso 1', () => {
    const { result } = renderHook(() =>
      useFormularioFactura({
        pedidoId: null,
        onFacturaCreada: undefined,
      })
    );

    act(() => {
      result.current.retrocederPaso();
    });

    expect(result.current.paso).toBe(1);

    act(() => {
      result.current.setCliente({
        id: 1,
        nombre: 'Cliente prueba',
      });
      result.current.avanzarPaso();
      result.current.retrocederPaso();
    });

    expect(result.current.paso).toBe(1);
  });
});
