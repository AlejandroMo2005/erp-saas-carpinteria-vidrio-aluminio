import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSelectorCliente from '../../../../../../presentation/components/Facturacion/Componentes/SelectorCliente/useSelectorCliente';
import api from '../../../../../../presentation/api/api';

vi.mock('../../../../../../presentation/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('useSelectorCliente - búsqueda y selección', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('inicia en modo búsqueda con estado vacío', () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    expect(result.current.modo).toBe('buscar');
    expect(result.current.query).toBe('');
    expect(result.current.resultados).toEqual([]);
    expect(result.current.buscando).toBe(false);
    expect(result.current.mostrarLista).toBe(false);
    expect(result.current.focusedIndex).toBe(-1);
    expect(result.current.errorBusqueda).toBe(null);
  });

  it('no busca cuando el texto tiene menos de dos caracteres', async () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    const event = { target: { value: 'a' } };

    act(() => {
      result.current.handleQueryChange(event);
      vi.advanceTimersByTime(350);
    });

    expect(result.current.query).toBe('a');
    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.resultados).toEqual([]);
    expect(result.current.mostrarLista).toBe(false);
    expect(result.current.errorBusqueda).toBe(null);
  });

  it('busca clientes después del debounce y muestra resultados', async () => {
    const clientes = [
      { id: 1, nombre: 'Juan Pérez', telefono: '0991234567' },
      { id: 2, nombre: 'Pedro López', telefono: '0987654321' },
    ];

    api.get.mockResolvedValue({
      data: {
        success: true,
        data: clientes,
      },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.handleQueryChange({
        target: { value: '  Juan  ' },
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(api.get).toHaveBeenCalledWith(
      '/clientes?busqueda=Juan&limite=8'
    );
    expect(result.current.resultados).toEqual(clientes);
    expect(result.current.mostrarLista).toBe(true);
    expect(result.current.focusedIndex).toBe(-1);
    expect(result.current.buscando).toBe(false);
  });

  it('acepta la respuesta usando clientes como fallback', async () => {
    const clientes = [
      { id: 1, nombre: 'Ana', telefono: '0991111111' },
    ];

    api.get.mockResolvedValue({
      data: {
        success: true,
        clientes,
      },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    await act(async () => {
      result.current.handleQueryChange({
        target: { value: 'Ana' },
      });
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(result.current.resultados).toEqual(clientes);
    expect(result.current.mostrarLista).toBe(true);
  });

  it('usa un arreglo vacío cuando la respuesta no contiene clientes', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: null,
        clientes: null,
      },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    await act(async () => {
      result.current.handleQueryChange({
        target: { value: 'Juan' },
      });
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(result.current.resultados).toEqual([]);
    expect(result.current.mostrarLista).toBe(true);
    expect(result.current.focusedIndex).toBe(-1);
  });

  it('maneja una búsqueda sin éxito sin abrir la lista', async () => {
    api.get.mockResolvedValue({
      data: {
        success: false,
      },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    await act(async () => {
      result.current.handleQueryChange({
        target: { value: 'Juan' },
      });
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(result.current.resultados).toEqual([]);
    expect(result.current.mostrarLista).toBe(false);
  });

  it('maneja errores de búsqueda con mensaje de la API', async () => {
    api.get.mockRejectedValue({
      response: {
        data: {
          message: 'Error del servidor',
        },
      },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    await act(async () => {
      result.current.handleQueryChange({
        target: { value: 'Juan' },
      });
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(result.current.errorBusqueda).toBe('Error del servidor');
    expect(result.current.resultados).toEqual([]);
    expect(result.current.mostrarLista).toBe(false);
    expect(result.current.buscando).toBe(false);
  });

  it('usa el mensaje genérico cuando la búsqueda falla sin mensaje de API', async () => {
    api.get.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    await act(async () => {
      result.current.handleQueryChange({
        target: { value: 'Juan' },
      });
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(result.current.errorBusqueda).toBe(
      'No se pudo conectar. Intenta de nuevo.'
    );
  });

  it('selecciona un cliente y limpia el estado de búsqueda', () => {
    const onSeleccionar = vi.fn();
    const cliente = {
      id: 1,
      nombre: 'Juan Pérez',
      telefono: '0991234567',
    };

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar,
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.setModo('crear');
      result.current.handleSeleccionar(cliente);
    });

    expect(onSeleccionar).toHaveBeenCalledWith(cliente);
    expect(result.current.mostrarLista).toBe(false);
    expect(result.current.query).toBe('');
    expect(result.current.resultados).toEqual([]);
    expect(result.current.focusedIndex).toBe(-1);
    expect(result.current.errorBusqueda).toBe(null);
  });

  it('limpia la selección y vuelve al modo búsqueda', () => {
    const onLimpiar = vi.fn();

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar,
      })
    );

    act(() => {
      result.current.setModo('crear');
      result.current.handleLimpiar();
    });

    expect(onLimpiar).toHaveBeenCalledTimes(1);
    expect(result.current.modo).toBe('buscar');
    expect(result.current.query).toBe('');
    expect(result.current.resultados).toEqual([]);
    expect(result.current.mostrarLista).toBe(false);
    expect(result.current.errorBusqueda).toBe(null);
  });
  it('navega hacia abajo y limita el índice al último resultado', async () => {
    const clientes = [
      { id: 1, nombre: 'Juan', telefono: '0991111111' },
      { id: 2, nombre: 'Pedro', telefono: '0992222222' },
    ];

    api.get.mockResolvedValue({
      data: { success: true, data: clientes },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    await act(async () => {
      result.current.handleQueryChange({
        target: { value: 'Juan' },
      });
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(result.current.mostrarLista).toBe(true);

    const preventDefault = vi.fn();

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault,
      });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(result.current.focusedIndex).toBe(0);

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault,
      });
    });

    expect(result.current.focusedIndex).toBe(1);

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault,
      });
    });

    expect(result.current.focusedIndex).toBe(1);
  });

  it('navega hacia arriba y limita el índice a cero', async () => {
    const clientes = [
      { id: 1, nombre: 'Juan', telefono: '0991111111' },
      { id: 2, nombre: 'Pedro', telefono: '0992222222' },
    ];

    api.get.mockResolvedValue({
      data: { success: true, data: clientes },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    await act(async () => {
      result.current.handleQueryChange({
        target: { value: 'Juan' },
      });
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowUp',
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.focusedIndex).toBe(0);

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.focusedIndex).toBe(1);

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowUp',
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.focusedIndex).toBe(0);

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowUp',
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.focusedIndex).toBe(0);
  });

  it('valida los campos obligatorios del nuevo cliente', async () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.erroresForm).toEqual({
      nombre: 'El nombre es obligatorio',
      telefono: 'El teléfono es obligatorio',
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('valida identificación obligatoria para tipos distintos de consumidor final', async () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.handleCampoNuevo({
        target: { name: 'nombre', value: 'Juan Pérez' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'telefono', value: '0991234567' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'tipo_identificacion', value: 'PASAPORTE' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'identificacion', value: '' },
      });
    });

    await act(async () => {
      await result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.erroresForm).toEqual({
      identificacion: 'La identificación es obligatoria',
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('rechaza una cédula inválida', async () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.handleCampoNuevo({
        target: { name: 'nombre', value: 'Juan Pérez' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'telefono', value: '0991234567' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'tipo_identificacion', value: 'CEDULA' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'identificacion', value: '1234567890' },
      });
    });

    await act(async () => {
      await result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.erroresForm).toEqual({
      identificacion: 'Cédula inválida',
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('rechaza un RUC inválido', async () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.handleCampoNuevo({
        target: { name: 'nombre', value: 'Juan Pérez' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'telefono', value: '0991234567' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'tipo_identificacion', value: 'RUC' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'identificacion', value: '1234567890123' },
      });
    });

    await act(async () => {
      await result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.erroresForm).toEqual({
      identificacion: 'RUC inválido',
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('rechaza un correo electrónico inválido', async () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.handleCampoNuevo({
        target: { name: 'nombre', value: 'Juan Pérez' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'telefono', value: '0991234567' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'tipo_identificacion', value: 'PASAPORTE' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'identificacion', value: 'ABC123' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'email', value: 'correo-invalido' },
      });
    });

    await act(async () => {
      await result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.erroresForm).toEqual({
      email: 'Correo electrónico inválido',
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('rechaza un teléfono con formato inválido', async () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.handleCampoNuevo({
        target: { name: 'nombre', value: 'Juan Pérez' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'telefono', value: '123' },
      });
    });

    await act(async () => {
      await result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.erroresForm).toEqual({
      telefono: 'Ingresa un teléfono válido (7-15 dígitos)',
    });
    expect(api.post).not.toHaveBeenCalled();
  });


  it('crea el cliente correctamente y lo selecciona', async () => {
    const onSeleccionar = vi.fn();

    const clienteCreado = {
      id: 10,
      nombre: 'Juan Pérez',
      telefono: '0991234567',
    };

    api.post.mockResolvedValue({
      data: {
        success: true,
        data: clienteCreado,
      },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar,
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.setModo('crear');

      result.current.handleCampoNuevo({
        target: { name: 'nombre', value: '  Juan Pérez  ' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'telefono', value: ' 0991234567 ' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'tipo_identificacion', value: 'PASAPORTE' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'identificacion', value: 'ABC123' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'direccion', value: '  Calle Principal  ' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'email', value: 'juan@correo.com' },
      });
    });

    await act(async () => {
      await result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(api.post).toHaveBeenCalledWith('/clientes', {
      nombre: 'Juan Pérez',
      telefono: '0991234567',
      identificacion: 'ABC123',
      tipo_identificacion: 'PASAPORTE',
      direccion: 'Calle Principal',
      email: 'juan@correo.com',
    });

    expect(onSeleccionar).toHaveBeenCalledWith(clienteCreado);
    expect(result.current.modo).toBe('buscar');
    expect(result.current.nuevoCliente).toEqual({
      nombre: '',
      telefono: '',
      identificacion: '',
      tipo_identificacion: 'CONSUMIDOR_FINAL',
      direccion: '',
      email: '',
    });
    expect(result.current.guardando).toBe(false);
  });


  it('acepta la respuesta de creación usando cliente como fallback', async () => {
    const onSeleccionar = vi.fn();

    const clienteCreado = {
      id: 11,
      nombre: 'Ana López',
      telefono: '0998765432',
    };

    api.post.mockResolvedValue({
      data: {
        success: true,
        data: null,
        cliente: clienteCreado,
      },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar,
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.handleCampoNuevo({
        target: { name: 'nombre', value: 'Ana López' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'telefono', value: '0998765432' },
      });
    });

    await act(async () => {
      await result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(onSeleccionar).toHaveBeenCalledWith(clienteCreado);
    expect(result.current.modo).toBe('buscar');
    expect(result.current.guardando).toBe(false);
  });

  it('muestra el mensaje de la API cuando falla la creación', async () => {
    api.post.mockRejectedValue({
      response: {
        data: {
          message: 'El cliente ya existe',
        },
      },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.handleCampoNuevo({
        target: { name: 'nombre', value: 'Juan Pérez' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'telefono', value: '0991234567' },
      });
    });

    await act(async () => {
      await result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.erroresForm).toEqual({
      general: 'El cliente ya existe',
    });
    expect(result.current.guardando).toBe(false);
  });

  it('usa el mensaje genérico cuando falla la creación sin mensaje de API', async () => {
    api.post.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.handleCampoNuevo({
        target: { name: 'nombre', value: 'Juan Pérez' },
      });
      result.current.handleCampoNuevo({
        target: { name: 'telefono', value: '0991234567' },
      });
    });

    await act(async () => {
      await result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.erroresForm).toEqual({
      general: 'Error al crear el cliente',
    });
    expect(result.current.guardando).toBe(false);
  });


  it('elimina el error del campo cuando se modifica después de una validación', async () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.erroresForm.nombre).toBe('El nombre es obligatorio');

    act(() => {
      result.current.handleCampoNuevo({
        target: { name: 'nombre', value: 'Juan Pérez' },
      });
    });

    expect(result.current.erroresForm).toEqual({
      telefono: 'El teléfono es obligatorio',
    });
    expect(result.current.nuevoCliente.nombre).toBe('Juan Pérez');
  });

  it('cancela la creación y limpia los errores del formulario', () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    act(() => {
      result.current.setModo('crear');
      result.current.handleCampoNuevo({
        target: { name: 'nombre', value: '' },
      });
    });

    act(() => {
      result.current.handleGuardarCliente({
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.erroresForm).toEqual({
      nombre: 'El nombre es obligatorio',
      telefono: 'El teléfono es obligatorio',
    });

    act(() => {
      result.current.cancelarCreacion();
    });

    expect(result.current.modo).toBe('buscar');
    expect(result.current.erroresForm).toEqual({});
  });


  it('cierra la lista cuando se hace click fuera del listado y del campo', async () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    const lista = document.createElement('div');
    const campo = document.createElement('div');
    const externo = document.createElement('div');

    document.body.append(lista, campo, externo);

    result.current.listRef.current = lista;
    result.current.inputRef.current = campo;

    act(() => {
      result.current.setModo('buscar');
    });

    await act(async () => {
      document.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
      }));
    });

    expect(result.current.mostrarLista).toBe(false);

    lista.remove();
    campo.remove();
    externo.remove();
  });


  it('no procesa teclado si la lista no está visible o está vacía', () => {
    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    const preventDefault = vi.fn();

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault,
      });
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(result.current.focusedIndex).toBe(-1);
  });

  it('selecciona con Enter cuando existe un resultado enfocado', async () => {
    const onSeleccionar = vi.fn();
    const clientes = [
      { id: 1, nombre: 'Juan', telefono: '0991111111' },
      { id: 2, nombre: 'Pedro', telefono: '0992222222' },
    ];

    api.get.mockResolvedValue({
      data: { success: true, data: clientes },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar,
        onLimpiar: vi.fn(),
      })
    );

    await act(async () => {
      result.current.handleQueryChange({ target: { value: 'Juan' } });
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      });
    });

    const preventDefault = vi.fn();

    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault,
      });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onSeleccionar).toHaveBeenCalledWith(clientes[0]);
    expect(result.current.mostrarLista).toBe(false);
  });

  it('cierra la lista con Escape', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: [{ id: 1, nombre: 'Juan', telefono: '0991111111' }],
      },
    });

    const { result } = renderHook(() =>
      useSelectorCliente({
        onSeleccionar: vi.fn(),
        onLimpiar: vi.fn(),
      })
    );

    await act(async () => {
      result.current.handleQueryChange({ target: { value: 'Juan' } });
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(result.current.mostrarLista).toBe(true);

    act(() => {
      result.current.handleKeyDown({
        key: 'Escape',
        preventDefault: vi.fn(),
      });
    });

    expect(result.current.mostrarLista).toBe(false);
  });

});
