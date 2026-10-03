import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: {
    rol: 'ADMIN',
    nombre: 'Administrador',
    telefono: '0999999999',
  },
  trabajos: [
    { id: 1, nombre: 'Ventana' },
    { id: 2, nombre: 'Puerta' },
  ],
  colores: [
    { id: 10, nombre: 'Blanco', valor: '#ffffff' },
    { id: 20, nombre: 'Negro', valor: '#000000' },
  ],
  errorTrabajos: false,
  errorColores: false,
  apiPost: vi.fn(),
  invalidateQueries: vi.fn(),
  toastOk: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
  toastInfo: vi.fn(),
  onAgendar: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mocks.invalidateQueries,
  }),
}));

vi.mock('../../../../../presentation/context/useAuth', () => ({
  useAuth: () => ({
    user: mocks.user,
  }),
}));

vi.mock('../../../../../presentation/hooks/useCatalogos', () => ({
  useTrabajos: () => ({
    data: mocks.trabajos,
    isLoading: false,
    isError: mocks.errorTrabajos,
  }),
  useColoresTrabajo: () => ({
    data: mocks.colores,
    isLoading: false,
    isError: mocks.errorColores,
  }),
}));

vi.mock('../../../../../presentation/hooks/usePedidos', () => ({
  pedidosKeys: {
    lists: () => ['pedidos', 'list'],
  },
}));

vi.mock('../../../../../presentation/api/api', () => ({
  default: {
    post: mocks.apiPost,
  },
}));

import { useProformas } from '../../../../../presentation/components/Proformas/hooks/useProformas';

function crearProps(overrides = {}) {
  return {
    onAgendar: mocks.onAgendar,
    toastOk: mocks.toastOk,
    toastError: mocks.toastError,
    toastWarning: mocks.toastWarning,
    toastInfo: mocks.toastInfo,
    ...overrides,
  };
}

function renderUseProformas(overrides = {}) {
  const props = crearProps(overrides);
  return {
    ...renderHook(() => useProformas(props)),
    props,
  };
}

describe('useProformas', () => {

  it('actualiza el teléfono cuando coincide con el teléfono del cliente vinculado', () => {
    const { result } = renderUseProformas();

    act(() => {
      result.current.handleSeleccionarCliente({
        id: 30,
        nombre: 'Cliente Inicial',
        telefono: '0999999999',
      });
    });

    act(() => {
      result.current.handleSeleccionarCliente({
        id: 31,
        nombre: 'Cliente Nuevo',
        telefono: '0988888888',
      });
    });

    expect(result.current.cliente).toBe('Cliente Nuevo');
    expect(result.current.telefono).toBe('0988888888');
  });



  it('usa valores predeterminados para alto y cantidad no numéricos en el payload', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      data: {
        data: {
          items: [{ subtotal: 10 }],
          subtotal: 10,
          iva: 1.5,
          total: 11.5,
          iva_valor: 0.15,
          whatsapp_text: '',
        },
      },
    });

    const { result } = renderUseProformas();
    const id = result.current.items[0].id;

    act(() => {
      result.current.setCliente('Juan Pérez');
    });

    act(() => {
      result.current.setTelefono('0999999999');
    });

    act(() => {
      result.current.handleUpdate(id, 'trabajo_id', '1');
      result.current.handleUpdate(id, 'alto', 'no-numérico');
      result.current.handleUpdate(id, 'cantidad', 'no-numérica');
    });

    await act(async () => {
      await result.current.calcularProforma();
    });

    const payload = mocks.apiPost.mock.calls[0][1];

    expect(payload.items[0].alto).toBe(0);
    expect(payload.items[0].cantidad).toBe(1);
  });

  it('usa nombre vacío cuando el cliente seleccionado no tiene nombres', () => {
    const { result } = renderUseProformas();

    act(() => {
      result.current.handleSeleccionarCliente({
        id: 20,
      });
    });

    expect(result.current.cliente).toBe('');
    expect(result.current.clienteVinculado).toMatchObject({
      id: 20,
      nombre: '',
    });
  });

  it('deja el teléfono vacío cuando el cliente seleccionado no tiene teléfono', () => {
    const { result } = renderUseProformas();

    act(() => {
      result.current.handleSeleccionarCliente({
        id: 21,
        nombre: 'Carlos Pérez',
      });
    });

    expect(result.current.telefono).toBe('');
  });

  it('usa el nombre vacío del cliente vinculado al detectar un cambio manual', () => {
    const { result } = renderUseProformas();

    act(() => {
      result.current.handleSeleccionarCliente({
        id: 22,
      });
    });

    act(() => {
      result.current.setCliente('Nuevo cliente');
    });

    expect(result.current.clienteVinculado).toBeNull();
  });



  it('usa valores predeterminados cuando la respuesta de cálculo omite campos opcionales', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      data: {
        data: {
          items: [{}],
        },
      },
    });

    const { result } = renderUseProformas();

    act(() => {
      result.current.setCliente('Juan Pérez');
    });

    act(() => {
      result.current.setTelefono('0999999999');
    });

    const id = result.current.items[0].id;

    act(() => {
      result.current.handleUpdate(id, 'trabajo_id', '1');
    });

    await act(async () => {
      await result.current.calcularProforma();
    });

    expect(result.current.resumen).toEqual({
      subtotal: 0,
      iva: 0,
      total: 0,
      iva_valor: 0.15,
    });
  });



  it('inicializa cliente y teléfono vacíos cuando el usuario CLIENTE no tiene esos datos', () => {
    mocks.user = {
      rol: 'CLIENTE',
      nombre: '',
      telefono: '',
    };

    const { result } = renderUseProformas();

    expect(result.current.cliente).toBe('');
    expect(result.current.telefono).toBe('');
  });

  it('valida correctamente cuando existen varios trabajos sin tipo seleccionado', () => {
    const { result } = renderUseProformas();

    act(() => {
      result.current.setCliente('Juan Pérez');
    });

    act(() => {
      result.current.setTelefono('0999999999');
    });

    act(() => {
      result.current.handleAddItem();
    });

    act(() => {
      result.current.handleAddItem();
    });

    act(() => {
      result.current.agendar();
    });

    expect(mocks.toastWarning).toHaveBeenCalledWith(
      expect.stringContaining('trabajos no tienen')
    );
  });

  it('selecciona cliente usando nombre cuando no existe nombre_completo', () => {
    const { result } = renderUseProformas();

    act(() => {
      result.current.handleSeleccionarCliente({
        id: 10,
        nombre: 'María López',
        telefono: '0987654321',
      });
    });

    expect(result.current.cliente).toBe('María López');
    expect(result.current.telefono).toBe('0987654321');
    expect(result.current.clienteVinculado).toMatchObject({
      id: 10,
      nombre: 'María López',
    });
  });

  it('desvincula el cliente cuando cambia manualmente el nombre', () => {
    const { result } = renderUseProformas();

    act(() => {
      result.current.handleSeleccionarCliente({
        id: 10,
        nombre: 'María López',
        telefono: '0987654321',
      });
    });

    expect(result.current.clienteVinculado).not.toBeNull();

    act(() => {
      result.current.setCliente('Otro cliente');
    });

    expect(result.current.clienteVinculado).toBeNull();
  });



  it('rechaza agendar cuando el formulario es inválido', async () => {
    const { result } = renderUseProformas();

    await act(async () => {
      await result.current.agendar();
    });

    expect(mocks.apiPost).not.toHaveBeenCalled();
    expect(mocks.toastWarning).toHaveBeenCalledWith(
      'El nombre del cliente es requerido.'
    );
  });

  it('rechaza WhatsApp cuando el teléfono normalizado es demasiado corto', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      data: {
        data: {
          items: [{ subtotal: 10 }],
          subtotal: 10,
          iva: 1.5,
          total: 11.5,
          iva_valor: 0.15,
          whatsapp_text: '',
        },
      },
    });

    const { result } = renderUseProformas();

    act(() => {
      result.current.setCliente('Juan Pérez');
    });

    act(() => {
      result.current.setTelefono('123456789');
    });

    const id = result.current.items[0].id;

    act(() => {
      result.current.handleUpdate(id, 'trabajo_id', '1');
    });

    await act(async () => {
      await result.current.calcularProforma();
    });

    act(() => {
      result.current.enviarWhatsApp();
    });

    expect(mocks.toastWarning).toHaveBeenCalledWith(
      'Número de teléfono inválido. Usa formato: 0999999999'
    );
  });



  beforeEach(() => {
    vi.clearAllMocks();

    mocks.user = {
      rol: 'ADMIN',
      nombre: 'Administrador',
      telefono: '0999999999',
    };

    mocks.trabajos = [
      { id: 1, nombre: 'Ventana' },
      { id: 2, nombre: 'Puerta' },
    ];

    mocks.colores = [
      { id: 10, nombre: 'Blanco', valor: '#ffffff' },
      { id: 20, nombre: 'Negro', valor: '#000000' },
    ];

    mocks.errorTrabajos = false;
    mocks.errorColores = false;

    mocks.apiPost.mockReset();
  });

  describe('estado inicial y catálogos', () => {
    it('inicia correctamente para un usuario del sistema', () => {
      const { result } = renderUseProformas();

      expect(result.current.esCliente).toBe(false);
      expect(result.current.esSistema).toBe(true);
      expect(result.current.user).toEqual(mocks.user);
      expect(result.current.cliente).toBe('');
      expect(result.current.telefono).toBe('');
      expect(result.current.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.current.fechaAgendamiento).toBe('');
      expect(result.current.clienteVinculado).toBeNull();
      expect(result.current.items).toHaveLength(1);
      expect(result.current.calculando).toBe(false);
      expect(result.current.agendando).toBe(false);
      expect(result.current.resumen).toEqual({
        subtotal: 0,
        iva: 0,
        total: 0,
        iva_valor: 0.15,
      });
    });

    it('inicia con los datos del usuario cuando es CLIENTE', () => {
      mocks.user = {
        rol: 'CLIENTE',
        nombre: 'Juan Pérez',
        telefono: '0987654321',
      };

      const { result } = renderUseProformas();

      expect(result.current.esCliente).toBe(true);
      expect(result.current.esSistema).toBe(false);
      expect(result.current.cliente).toBe('Juan Pérez');

      expect(result.current.trabajos).toEqual(mocks.trabajos);
      expect(result.current.coloresDB).toEqual(mocks.colores);
      expect(result.current.loadingTrabajos).toBe(false);
      expect(result.current.loadingColores).toBe(false);
    });

    it('construye mapaColores con nombre y hexadecimal', () => {
      const { result } = renderUseProformas();

      expect(result.current.mapaColores).toEqual({
        10: { hex: '#ffffff', nombre: 'Blanco' },
        20: { hex: '#000000', nombre: 'Negro' },
      });
    });

    it('muestra error cuando falla la carga de catálogos', () => {
      mocks.errorTrabajos = true;

      renderUseProformas();

      expect(mocks.toastError).toHaveBeenCalledWith(
        'No se pudieron cargar los catálogos de trabajos y colores.'
      );
    });
  });

  describe('cliente', () => {
    it('evalúa teléfono vacío del cliente vinculado al seleccionar otro cliente', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.handleSeleccionarCliente({
          id: 30,
          nombre: 'Cliente Sin Teléfono',
        });
      });

      act(() => {
        result.current.setTelefono('0999999999');
      });

      act(() => {
        result.current.handleSeleccionarCliente({
          id: 31,
          nombre: 'Cliente Nuevo',
          telefono: '0988888888',
        });
      });

      expect(result.current.cliente).toBe('Cliente Nuevo');
      expect(result.current.telefono).toBe('0999999999');
    });

    it('actualiza el nombre del cliente', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.setCliente('Cliente Nuevo');
      });

      expect(result.current.cliente).toBe('Cliente Nuevo');
    });

    it('desvincula el cliente registrado cuando se modifica el nombre', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.handleSeleccionarCliente({
          id: 55,
          nombre_completo: 'Juan Pérez',
          telefono: '0991111111',
        });
      });

      expect(result.current.clienteVinculado.id).toBe(55);

      act(() => {
        result.current.setCliente('Otro Cliente');
      });

      expect(result.current.cliente).toBe('Otro Cliente');
      expect(result.current.clienteVinculado).toBeNull();
    });

    it('selecciona un cliente usando nombre_completo y carga su teléfono', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.handleSeleccionarCliente({
          id: 55,
          nombre_completo: 'Juan Pérez',
          telefono: '0991111111',
        });
      });

      expect(result.current.cliente).toBe('Juan Pérez');
      expect(result.current.telefono).toBe('0991111111');
      expect(result.current.clienteVinculado).toMatchObject({
        id: 55,
        nombre: 'Juan Pérez',
      });
      expect(mocks.toastInfo).toHaveBeenCalledWith(
        'Cliente "Juan Pérez" cargado desde el registro.'
      );
    });

    it('selecciona un cliente usando nombre cuando no existe nombre_completo', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.handleSeleccionarCliente({
          id: 56,
          nombre: 'María López',
          telefono: '0982222222',
        });
      });

      expect(result.current.cliente).toBe('María López');
      expect(result.current.telefono).toBe('0982222222');
      expect(result.current.clienteVinculado.nombre).toBe('María López');
    });

    it('no reemplaza el teléfono existente al seleccionar un cliente', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.setTelefono('0993333333');
      });

      act(() => {
        result.current.handleSeleccionarCliente({
          id: 57,
          nombre_completo: 'Pedro Díaz',
          telefono: '0994444444',
        });
      });

      expect(result.current.telefono).toBe('0993333333');
    });

    it('desvincula manualmente el cliente registrado', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.handleSeleccionarCliente({
          id: 58,
          nombre_completo: 'Ana Ruiz',
          telefono: '0995555555',
        });
      });

      act(() => {
        result.current.handleDesvincular();
      });

      expect(result.current.clienteVinculado).toBeNull();
    });
  });

  describe('items', () => {
    it('agrega un nuevo trabajo', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.handleAddItem();
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[1]).toMatchObject({
        trabajo_id: '',
        nombre_trabajo: '',
        ancho: 1,
        alto: 1,
        cantidad: 1,
        subtotal: 0,
      });
    });

    it('no elimina el último trabajo disponible', () => {
      const { result } = renderUseProformas();
      const id = result.current.items[0].id;

      act(() => {
        result.current.handleRemoveItem(id);
      });

      expect(result.current.items).toHaveLength(1);
    });

    it('elimina un trabajo cuando existen varios', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.handleAddItem();
      });

      const id = result.current.items[0].id;

      act(() => {
        result.current.handleRemoveItem(id);
      });

      expect(result.current.items).toHaveLength(1);
    });

    it('actualiza el tipo de trabajo y su nombre', () => {
      const { result } = renderUseProformas();
      const id = result.current.items[0].id;

      act(() => {
        result.current.handleUpdate(id, 'trabajo_id', '1');
      });

      expect(result.current.items[0]).toMatchObject({
        trabajo_id: '1',
        nombre_trabajo: 'Ventana',
        subtotal: 0,
      });
    });

    it('limpia el nombre cuando el tipo de trabajo no existe', () => {
      const { result } = renderUseProformas();
      const id = result.current.items[0].id;

      act(() => {
        result.current.handleUpdate(id, 'trabajo_id', '999');
      });

      expect(result.current.items[0].nombre_trabajo).toBe('');
      expect(result.current.items[0].subtotal).toBe(0);
    });

    it('actualiza color, nombre y hexadecimal', () => {
      const { result } = renderUseProformas();
      const id = result.current.items[0].id;

      act(() => {
        result.current.handleUpdate(id, 'color_id', '10');
      });

      expect(result.current.items[0]).toMatchObject({
        color_id: '10',
        nombre_color: 'Blanco',
        color_hex: '#ffffff',
        subtotal: 0,
      });
    });

    it('limpia color y subtotal cuando el color no existe', () => {
      const { result } = renderUseProformas();
      const id = result.current.items[0].id;

      act(() => {
        result.current.handleUpdate(id, 'color_id', '999');
      });

      expect(result.current.items[0]).toMatchObject({
        nombre_color: '',
        color_hex: '',
        subtotal: 0,
      });
    });

    it('reinicia el subtotal al cambiar una medida o cantidad', () => {
      const { result } = renderUseProformas();
      const id = result.current.items[0].id;

      act(() => {
        result.current.handleUpdate(id, 'ancho', '3');
      });

      act(() => {
        result.current.handleUpdate(id, 'alto', '4');
      });

      act(() => {
        result.current.handleUpdate(id, 'cantidad', '2');
      });

      expect(result.current.items[0]).toMatchObject({
        ancho: '3',
        alto: '4',
        cantidad: '2',
        subtotal: 0,
      });
    });

    it('no modifica otros items al actualizar uno específico', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.handleAddItem();
      });

      const secondId = result.current.items[1].id;

      act(() => {
        result.current.handleUpdate(secondId, 'ancho', '7');
      });

      expect(result.current.items[0].ancho).toBe(1);
      expect(result.current.items[1].ancho).toBe('7');
    });
  });

  describe('validación y cálculo', () => {
    it('rechaza el cálculo sin nombre de cliente', async () => {
      const { result } = renderUseProformas();

      let response;

      await act(async () => {
        response = await result.current.calcularProforma();
      });

      expect(response).toBe(false);
      expect(mocks.toastWarning).toHaveBeenCalledWith(
        'El nombre del cliente es requerido.'
      );
      expect(mocks.apiPost).not.toHaveBeenCalled();
    });

    it('rechaza el cálculo sin teléfono', async () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.setCliente('Juan Pérez');
      });

      await act(async () => {
        await result.current.calcularProforma();
      });

      expect(mocks.toastWarning).toHaveBeenCalledWith(
        'El número de teléfono es requerido.'
      );
      expect(mocks.apiPost).not.toHaveBeenCalled();
    });

    it('rechaza el cálculo si falta el tipo de trabajo', async () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.setCliente('Juan Pérez');
        result.current.setTelefono('0999999999');
      });

      await act(async () => {
        await result.current.calcularProforma();
      });

      expect(mocks.toastWarning).toHaveBeenCalledWith(
        'Un trabajo no tiene tipo seleccionado.'
      );
      expect(mocks.apiPost).not.toHaveBeenCalled();
    });

    it('rechaza el cálculo si las medidas son inválidas', async () => {
      const { result } = renderUseProformas();
      const id = result.current.items[0].id;

      act(() => {
        result.current.setCliente('Juan Pérez');
        result.current.setTelefono('0999999999');
        result.current.handleUpdate(id, 'trabajo_id', '1');
        result.current.handleUpdate(id, 'ancho', '0');
      });

      await act(async () => {
        await result.current.calcularProforma();
      });

      expect(mocks.toastWarning).toHaveBeenCalledWith(
        'Revisa las medidas: ancho, alto y cantidad deben ser mayores a 0.'
      );
      expect(mocks.apiPost).not.toHaveBeenCalled();
    });

    it('normaliza un ancho vacío a cero en el payload', () => {
      const { result } = renderUseProformas();
      const id = result.current.items[0].id;

      act(() => {
        result.current.handleUpdate(id, 'ancho', '');
      });

      const ancho = result.current.items[0].ancho;
      expect(Number(ancho) || 0).toBe(0);
    });

    it('calcula la proforma correctamente', async () => {
      mocks.apiPost.mockResolvedValueOnce({
        data: {
          data: {
            items: [{ subtotal: 120 }],
            subtotal: 120,
            iva: 18,
            total: 138,
            iva_valor: 0.15,
            whatsapp_text: 'Texto WhatsApp',
          },
        },
      });

      const { result } = renderUseProformas();
      const id = result.current.items[0].id;

      act(() => {
        result.current.setCliente('Juan Pérez');
        result.current.setTelefono('0999999999');
        result.current.handleUpdate(id, 'trabajo_id', '1');
        result.current.handleUpdate(id, 'ancho', '2');
        result.current.handleUpdate(id, 'alto', '3');
      });

      let response;

      await act(async () => {
        response = await result.current.calcularProforma();
      });

      expect(response).toEqual({
        ok: true,
        resumen: {
          subtotal: 120,
          iva: 18,
          total: 138,
          iva_valor: 0.15,
        },
      });

      expect(mocks.apiPost).toHaveBeenCalledWith(
        '/proformas/calcular',
        expect.objectContaining({
          cliente: 'Juan Pérez',
          telefono: '0999999999',
          items: [
            expect.objectContaining({
              trabajo_id: 1,
              ancho: 2,
              alto: 3,
              cantidad: 1,
            }),
          ],
        })
      );

      expect(result.current.items[0].subtotal).toBe(120);
      expect(result.current.resumen).toEqual({
        subtotal: 120,
        iva: 18,
        total: 138,
        iva_valor: 0.15,
      });
      expect(mocks.toastInfo).toHaveBeenCalledWith(
        'Proforma calculada: $138.00'
      );
      expect(result.current.calculando).toBe(false);
    });

    it('maneja una respuesta inválida del servidor', async () => {
      mocks.apiPost.mockResolvedValueOnce({
        data: {},
      });

      const { result } = renderUseProformas();

      act(() => {
        result.current.setCliente('Juan Pérez');
        result.current.setTelefono('0999999999');
        result.current.handleUpdate(
          result.current.items[0].id,
          'trabajo_id',
          '1'
        );
      });

      let response;

      await act(async () => {
        response = await result.current.calcularProforma();
      });

      expect(response).toBe(false);
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Respuesta inválida del servidor'
      );
      expect(result.current.calculando).toBe(false);
    });

    it('maneja errores HTTP durante el cálculo', async () => {
      mocks.apiPost.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            message: 'Stock insuficiente (Negro)',
          },
        },
      });

      const { result } = renderUseProformas();

      act(() => {
        result.current.setCliente('Juan Pérez');
        result.current.setTelefono('0999999999');
        result.current.handleUpdate(
          result.current.items[0].id,
          'trabajo_id',
          '1'
        );
      });

      await act(async () => {
        await result.current.calcularProforma();
      });

      expect(mocks.toastError).toHaveBeenCalledWith(
        'Material insuficiente para el color "Negro". Intenta con otro color o indícalo en el campo Detalle para coordinar con nosotros.'
      );
      expect(result.current.calculando).toBe(false);
    });

    it('no ejecuta dos cálculos simultáneamente', async () => {
      let resolver;

      mocks.apiPost.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolver = resolve;
          })
      );

      const { result } = renderUseProformas();

      act(() => {
        result.current.setCliente('Juan Pérez');
        result.current.setTelefono('0999999999');
        result.current.handleUpdate(
          result.current.items[0].id,
          'trabajo_id',
          '1'
        );
      });

      let primera;

      await act(async () => {
        primera = result.current.calcularProforma();
      });

      expect(result.current.calculando).toBe(true);

      let segunda;

      await act(async () => {
        segunda = await result.current.calcularProforma();
      });

      expect(segunda).toBe(false);
      expect(mocks.apiPost).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolver({
          data: {
            data: {
              items: [{ subtotal: 50 }],
              subtotal: 50,
              iva: 7.5,
              total: 57.5,
              iva_valor: 0.15,
              whatsapp_text: '',
            },
          },
        });
        await primera;
      });

      expect(result.current.calculando).toBe(false);
    });
  });

  describe('WhatsApp', () => {
    beforeEach(() => {
      vi.stubGlobal('open', vi.fn());
    });

    it('rechaza WhatsApp sin teléfono', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.enviarWhatsApp();
      });

      expect(mocks.toastWarning).toHaveBeenCalledWith(
        'Ingresa el número de teléfono antes de enviar.'
      );
    });

    it('rechaza WhatsApp si todavía no existe total calculado', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.setTelefono('0999999999');
      });

      act(() => {
        result.current.enviarWhatsApp();
      });

      expect(mocks.toastWarning).toHaveBeenCalledWith(
        'Primero calcula la proforma antes de enviar por WhatsApp.'
      );
    });

    it('rechaza un teléfono con formato inválido', async () => {
      mocks.apiPost.mockResolvedValueOnce({
        data: {
          data: {
            items: [{ subtotal: 10 }],
            subtotal: 10,
            iva: 1.5,
            total: 11.5,
            iva_valor: 0.15,
            whatsapp_text: 'Texto',
          },
        },
      });

      const { result } = renderUseProformas();

      act(() => {
        result.current.setCliente('Juan Pérez');
        result.current.setTelefono('123');
        result.current.handleUpdate(
          result.current.items[0].id,
          'trabajo_id',
          '1'
        );
      });

      await act(async () => {
        await result.current.calcularProforma();
      });

      act(() => {
        result.current.enviarWhatsApp();
      });

      expect(mocks.toastWarning).toHaveBeenCalledWith(
        'Número de teléfono inválido. Usa formato: 0999999999'
      );
    });

    it('envía la proforma mediante WhatsApp con texto generado', () => {
      const { result } = renderUseProformas();

      act(() => {
        result.current.setCliente('Juan Pérez');
        result.current.setTelefono('0999999999');
      });

      act(() => {
        result.current.handleUpdate(
          result.current.items[0].id,
          'trabajo_id',
          '1'
        );
        result.current.handleUpdate(
          result.current.items[0].id,
          'ancho',
          '2'
        );
        result.current.handleUpdate(
          result.current.items[0].id,
          'alto',
          '3'
        );
      });

      act(() => {
        result.current.enviarWhatsApp();
      });

    });
  });

  describe('agendamiento', () => {
    function prepararFormulario(result) {
      act(() => {
        result.current.setCliente('Juan Pérez');
        result.current.setTelefono('0999999999');
        result.current.setFechaAgendamiento('2026-10-01');
        result.current.handleUpdate(
          result.current.items[0].id,
          'trabajo_id',
          '1'
        );
      });
    }

    it('agenda usando el total existente', async () => {
      mocks.apiPost
        .mockResolvedValueOnce({
          data: {
            data: {
              items: [{ subtotal: 80 }],
              subtotal: 80,
              iva: 12,
              total: 92,
              iva_valor: 0.15,
              whatsapp_text: 'Texto',
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
          },
        });

      const { result } = renderUseProformas();
      prepararFormulario(result);

      await act(async () => {
        await result.current.calcularProforma();
      });

      await act(async () => {
        await result.current.agendar();
      });

      expect(mocks.apiPost).toHaveBeenNthCalledWith(
        2,
        '/proformas/agendar',
        expect.objectContaining({
          cliente: 'Juan Pérez',
          telefono: '0999999999',
          fecha_agendamiento: '2026-10-01',
          total: 92,
        })
      );
    });

    it('no ejecuta dos agendamientos simultáneamente', async () => {
      mocks.apiPost.mockResolvedValueOnce({
        data: {
          data: {
            items: [{ subtotal: 10 }],
            subtotal: 10,
            iva: 1.5,
            total: 11.5,
            iva_valor: 0.15,
            whatsapp_text: '',
          },
        },
      });

      const { result } = renderUseProformas();
      const id = result.current.items[0].id;

      act(() => {
        result.current.setCliente('Juan Pérez');
      });

      act(() => {
        result.current.setTelefono('0999999999');
      });

      act(() => {
        result.current.handleUpdate(id, 'trabajo_id', '1');
      });

      await act(async () => {
        await result.current.calcularProforma();
      });

      let resolver;
      const pendiente = new Promise((resolve) => {
        resolver = resolve;
      });

      mocks.apiPost.mockReturnValueOnce(pendiente);

      let primera;

      act(() => {
        primera = result.current.agendar();
      });

      await waitFor(() => {
        expect(result.current.agendando).toBe(true);
      });

      const llamadasAntesDeLaSegunda = mocks.apiPost.mock.calls.length;

      act(() => {
        result.current.agendar();
      });

      expect(mocks.apiPost).toHaveBeenCalledTimes(llamadasAntesDeLaSegunda);

      resolver({
        data: {
          success: true,
        },
      });

      await act(async () => {
        await primera;
      });
    });

    it('calcula antes de agendar cuando no existe total', async () => {
      mocks.apiPost
        .mockResolvedValueOnce({
          data: {
            data: {
              items: [{ subtotal: 80 }],
              subtotal: 80,
              iva: 12,
              total: 92,
              iva_valor: 0.15,
              whatsapp_text: 'Texto',
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
          },
        });

      const { result } = renderUseProformas();
      prepararFormulario(result);

      await act(async () => {
        await result.current.agendar();
      });

      expect(mocks.apiPost).toHaveBeenNthCalledWith(
        1,
        '/proformas/calcular',
        expect.any(Object)
      );

      expect(mocks.apiPost).toHaveBeenNthCalledWith(
        2,
        '/proformas/agendar',
        expect.objectContaining({
          total: 92,
        })
      );
    });

    it('invalida la lista de pedidos después de agendar', async () => {
      mocks.apiPost
        .mockResolvedValueOnce({
          data: {
            data: {
              items: [{ subtotal: 80 }],
              subtotal: 80,
              iva: 12,
              total: 92,
              iva_valor: 0.15,
              whatsapp_text: 'Texto',
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
          },
        });

      const { result } = renderUseProformas();
      prepararFormulario(result);

      await act(async () => {
        await result.current.calcularProforma();
      });

      await act(async () => {
        await result.current.agendar();
      });

      expect(mocks.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['pedidos', 'list'],
      });
    });

    it('ejecuta onAgendar y muestra confirmación para usuario del sistema', async () => {
      mocks.apiPost
        .mockResolvedValueOnce({
          data: {
            data: {
              items: [{ subtotal: 80 }],
              subtotal: 80,
              iva: 12,
              total: 92,
              iva_valor: 0.15,
              whatsapp_text: 'Texto',
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
          },
        });

      const { result } = renderUseProformas();
      prepararFormulario(result);

      await act(async () => {
        await result.current.calcularProforma();
      });

      await act(async () => {
        await result.current.agendar();
      });

      expect(mocks.onAgendar).toHaveBeenCalledTimes(1);
      expect(mocks.toastOk).toHaveBeenCalledWith(
        'Pedido agendado correctamente para Juan Pérez.'
      );
      expect(result.current.agendando).toBe(false);
    });

    it('muestra el mensaje específico para un cliente', async () => {
      mocks.user = {
        rol: 'CLIENTE',
        nombre: 'Juan Pérez',
        telefono: '0999999999',
      };

      mocks.apiPost
        .mockResolvedValueOnce({
          data: {
            data: {
              items: [{ subtotal: 80 }],
              subtotal: 80,
              iva: 12,
              total: 92,
              iva_valor: 0.15,
              whatsapp_text: 'Texto',
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
          },
        });

      const { result } = renderUseProformas();
      prepararFormulario(result);

      await act(async () => {
        await result.current.calcularProforma();
      });

      await act(async () => {
        await result.current.agendar();
      });

      expect(mocks.toastOk).toHaveBeenCalledWith(
        '¡Tu solicitud fue enviada! Nos pondremos en contacto para confirmar.'
      );
    });

    it('maneja una respuesta no exitosa al agendar', async () => {
      mocks.apiPost
        .mockResolvedValueOnce({
          data: {
            data: {
              items: [{ subtotal: 80 }],
              subtotal: 80,
              iva: 12,
              total: 92,
              iva_valor: 0.15,
              whatsapp_text: 'Texto',
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: false,
            message: 'No se pudo agendar',
          },
        });

      const { result } = renderUseProformas();
      prepararFormulario(result);

      await act(async () => {
        await result.current.calcularProforma();
      });

      await act(async () => {
        await result.current.agendar();
      });

      expect(mocks.toastError).toHaveBeenCalledWith('No se pudo agendar');
      expect(result.current.agendando).toBe(false);
    });

    it('maneja una respuesta no exitosa sin mensaje', async () => {
      mocks.apiPost
        .mockResolvedValueOnce({
          data: {
            data: {
              items: [{ subtotal: 10 }],
              subtotal: 10,
              iva: 1.5,
              total: 11.5,
              iva_valor: 0.15,
              whatsapp_text: '',
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: false,
          },
        });

      const { result } = renderUseProformas();

      act(() => {
        result.current.setCliente('Juan Pérez');
      });
      act(() => {
        result.current.setTelefono('0999999999');
      });
      act(() => {
        result.current.handleUpdate(
          result.current.items[0].id,
          'trabajo_id',
          '1'
        );
      });

      await act(async () => {
        await result.current.calcularProforma();
      });

      await act(async () => {
        await result.current.agendar();
      });

      expect(mocks.toastError).toHaveBeenCalledWith(
        'No se pudo agendar el pedido'
      );
    });

    it('maneja errores HTTP durante el agendamiento', async () => {
      mocks.apiPost.mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            message: 'Conflicto: pedido existente',
          },
        },
      });

      const { result } = renderUseProformas();
      prepararFormulario(result);

      await act(async () => {
        await result.current.agendar();
      });

      expect(mocks.toastError).toHaveBeenCalledWith(
        'Conflicto: pedido existente'
      );
      expect(result.current.agendando).toBe(false);
    });

    it('no continúa agendando si falla el cálculo previo', async () => {
      mocks.apiPost.mockRejectedValueOnce({
        response: {
          status: 500,
        },
      });

      const { result } = renderUseProformas();
      prepararFormulario(result);

      await act(async () => {
        await result.current.agendar();
      });

      expect(mocks.apiPost).toHaveBeenCalledTimes(1);
      expect(mocks.apiPost).toHaveBeenCalledWith(
        '/proformas/calcular',
        expect.any(Object)
      );
      expect(result.current.agendando).toBe(false);
    });
  });

  describe('payload', () => {
    it('normaliza y limita los datos enviados al servidor', async () => {
      mocks.apiPost.mockResolvedValueOnce({
        data: {
          data: {
            items: [{ subtotal: 10 }],
            subtotal: 10,
            iva: 1.5,
            total: 11.5,
            iva_valor: 0.15,
            whatsapp_text: '',
          },
        },
      });

      const { result } = renderUseProformas();
      const id = result.current.items[0].id;

      act(() => {
        result.current.setCliente(' <Juan> Pérez ');
        result.current.setTelefono('0999999999');
        result.current.setFechaAgendamiento('2026-10-15');
        result.current.handleUpdate(id, 'trabajo_id', '1');
        result.current.handleUpdate(id, 'ancho', '100000');
        result.current.handleUpdate(id, 'alto', '100000');
        result.current.handleUpdate(id, 'cantidad', '10000');
        result.current.handleUpdate(id, 'detalle', '<script>alert(1)</script>');
      });

      await act(async () => {
        await result.current.calcularProforma();
      });

      expect(mocks.apiPost).toHaveBeenCalledWith(
        '/proformas/calcular',
        expect.objectContaining({
          cliente: 'Juan Pérez',
          telefono: '0999999999',
          fecha_agendamiento: '2026-10-15',
          usuario_id: null,
          items: [
            expect.objectContaining({
              trabajo_id: 1,
              ancho: 99999,
              alto: 99999,
              cantidad: 9999,
              detalle: 'scriptalert(1)/script',
            }),
          ],
        })
      );
    });

    it('incluye usuario_id del cliente vinculado para usuarios del sistema', async () => {
      mocks.apiPost.mockResolvedValueOnce({
        data: {
          data: {
            items: [{ subtotal: 10 }],
            subtotal: 10,
            iva: 1.5,
            total: 11.5,
            iva_valor: 0.15,
            whatsapp_text: '',
          },
        },
      });

      const { result } = renderUseProformas();

      act(() => {
        result.current.setCliente('Juan Pérez');
        result.current.setTelefono('0999999999');
        result.current.handleUpdate(
          result.current.items[0].id,
          'trabajo_id',
          '1'
        );
        result.current.handleSeleccionarCliente({
          id: 123,
          nombre_completo: 'Juan Pérez',
          telefono: '0999999999',
        });
      });

      await act(async () => {
        await result.current.calcularProforma();
      });

      expect(mocks.apiPost).toHaveBeenCalledWith(
        '/proformas/calcular',
        expect.objectContaining({
          usuario_id: 123,
        })
      );
    });

    it('no incluye usuario_id para clientes', async () => {
      mocks.user = {
        rol: 'CLIENTE',
        nombre: 'Juan Pérez',
        telefono: '0999999999',
      };

      mocks.apiPost.mockResolvedValueOnce({
        data: {
          data: {
            items: [{ subtotal: 10 }],
            subtotal: 10,
            iva: 1.5,
            total: 11.5,
            iva_valor: 0.15,
            whatsapp_text: '',
          },
        },
      });

      const { result } = renderUseProformas();

      act(() => {
        result.current.handleUpdate(
          result.current.items[0].id,
          'trabajo_id',
          '1'
        );
      });

      await act(async () => {
        await result.current.calcularProforma();
      });

      const payload = mocks.apiPost.mock.calls[0][1];

      expect(payload.usuario_id).toBeUndefined();
    });
  });
});
