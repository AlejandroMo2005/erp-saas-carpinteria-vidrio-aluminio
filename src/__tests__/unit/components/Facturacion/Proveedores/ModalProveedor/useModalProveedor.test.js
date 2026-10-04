import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useModalProveedor from '../../../../../../presentation/components/Facturacion/Proveedores/ModalProveedor/useModalProveedor';
import api from '../../../../../../presentation/api/api';

vi.mock('../../../../../../presentation/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('useModalProveedor', () => {
  const onGuardado = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    api.get.mockResolvedValue({
      data: {
        data: [],
      },
    });
  });

  it('inicializa un nuevo proveedor con valores vacíos', async () => {
    const { result } = renderHook(() =>
      useModalProveedor({ proveedor: null, onGuardado })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/proveedores/materiales');
    });

    expect(result.current.esEdicion).toBe(false);
    expect(result.current.form).toEqual({
      nombre: '',
      ciudad: '',
      telefono_whatsapp: '',
      email: '',
      notas: '',
    });
    expect(result.current.materiales).toEqual([]);
    expect(result.current.seleccionados).toEqual([]);
    expect(result.current.guardando).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('inicializa un proveedor existente con sus datos y materiales seleccionados', async () => {
    const proveedor = {
      id: 10,
      nombre: 'Proveedor A',
      ciudad: 'Manta',
      telefono_whatsapp: '0991111111',
      email: 'proveedor@example.com',
      notas: 'Entrega semanal',
      materiales: [
        { id: 1, nombre: 'Vidrio 6mm' },
        { id: 2, nombre: 'Aluminio' },
      ],
    };

    const { result } = renderHook(() =>
      useModalProveedor({ proveedor, onGuardado })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    expect(result.current.esEdicion).toBe(true);
    expect(result.current.form).toEqual({
      nombre: 'Proveedor A',
      ciudad: 'Manta',
      telefono_whatsapp: '0991111111',
      email: 'proveedor@example.com',
      notas: 'Entrega semanal',
    });
    expect(result.current.seleccionados).toEqual([1, 2]);
  });

  it('carga los materiales disponibles', async () => {
    const materiales = [
      { id: 1, nombre: 'Vidrio 6mm', stock: 5 },
      { id: 2, nombre: 'Aluminio', stock: 8 },
    ];

    api.get.mockResolvedValueOnce({
      data: {
        data: materiales,
      },
    });

    const { result } = renderHook(() =>
      useModalProveedor({ proveedor: null, onGuardado })
    );

    await waitFor(() => {
      expect(result.current.materiales).toEqual(materiales);
    });

    expect(api.get).toHaveBeenCalledWith('/proveedores/materiales');
  });

  it('muestra error cuando no puede cargar los materiales', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useModalProveedor({ proveedor: null, onGuardado })
    );

    await waitFor(() => {
      expect(result.current.error).toBe(
        'No se pudieron cargar los materiales'
      );
    });
  });

  it('cambia un campo del formulario', async () => {
    const { result } = renderHook(() =>
      useModalProveedor({ proveedor: null, onGuardado })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    act(() => {
      result.current.cambiar({
        target: {
          name: 'nombre',
          value: 'Proveedor Nuevo',
        },
      });
    });

    expect(result.current.form.nombre).toBe('Proveedor Nuevo');
  });

  it('selecciona y deselecciona un material', async () => {
    const { result } = renderHook(() =>
      useModalProveedor({ proveedor: null, onGuardado })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    act(() => {
      result.current.toggleMaterial(7);
    });

    expect(result.current.seleccionados).toEqual([7]);

    act(() => {
      result.current.toggleMaterial(7);
    });

    expect(result.current.seleccionados).toEqual([]);
  });

  it('rechaza guardar cuando el nombre está vacío', async () => {
    const { result } = renderHook(() =>
      useModalProveedor({ proveedor: null, onGuardado })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.guardar();
    });

    expect(result.current.error).toBe('El nombre es requerido');
    expect(api.post).not.toHaveBeenCalled();
    expect(api.put).not.toHaveBeenCalled();
    expect(onGuardado).not.toHaveBeenCalled();
  });

  it('crea un proveedor mediante POST y llama a onGuardado', async () => {
    const proveedorCreado = {
      id: 20,
      nombre: 'Proveedor Nuevo',
    };

    api.post.mockResolvedValueOnce({
      data: {
        data: proveedorCreado,
      },
    });

    const { result } = renderHook(() =>
      useModalProveedor({ proveedor: null, onGuardado })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    act(() => {
      result.current.cambiar({
        target: {
          name: 'nombre',
          value: 'Proveedor Nuevo',
        },
      });
      result.current.toggleMaterial(3);
    });

    await act(async () => {
      await result.current.guardar();
    });

    expect(api.post).toHaveBeenCalledWith('/proveedores', {
      nombre: 'Proveedor Nuevo',
      ciudad: '',
      telefono_whatsapp: '',
      email: '',
      notas: '',
      material_ids: [3],
    });
    expect(onGuardado).toHaveBeenCalledWith(proveedorCreado);
    expect(result.current.guardando).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('actualiza un proveedor mediante PUT', async () => {
    const proveedor = {
      id: 10,
      nombre: 'Proveedor A',
      ciudad: 'Manta',
      telefono_whatsapp: '',
      email: '',
      notas: '',
      materiales: [],
    };

    const proveedorActualizado = {
      id: 10,
      nombre: 'Proveedor Actualizado',
    };

    api.put.mockResolvedValueOnce({
      data: {
        data: proveedorActualizado,
      },
    });

    const { result } = renderHook(() =>
      useModalProveedor({ proveedor, onGuardado })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    act(() => {
      result.current.cambiar({
        target: {
          name: 'nombre',
          value: 'Proveedor Actualizado',
        },
      });
    });

    await act(async () => {
      await result.current.guardar();
    });

    expect(api.put).toHaveBeenCalledWith(
      '/proveedores/10',
      {
        nombre: 'Proveedor Actualizado',
        ciudad: 'Manta',
        telefono_whatsapp: '',
        email: '',
        notas: '',
        material_ids: [],
      }
    );
    expect(onGuardado).toHaveBeenCalledWith(proveedorActualizado);
    expect(api.post).not.toHaveBeenCalled();
    expect(result.current.guardando).toBe(false);
  });

  it('usa el mensaje del backend cuando falla al guardar', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'El proveedor ya existe',
        },
      },
    });

    const { result } = renderHook(() =>
      useModalProveedor({ proveedor: null, onGuardado })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    act(() => {
      result.current.cambiar({
        target: {
          name: 'nombre',
          value: 'Proveedor Duplicado',
        },
      });
    });

    await act(async () => {
      await result.current.guardar();
    });

    expect(result.current.error).toBe('El proveedor ya existe');
    expect(result.current.guardando).toBe(false);
    expect(onGuardado).not.toHaveBeenCalled();
  });

  it('usa el mensaje genérico cuando falla al guardar sin respuesta del backend', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useModalProveedor({ proveedor: null, onGuardado })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    act(() => {
      result.current.cambiar({
        target: {
          name: 'nombre',
          value: 'Proveedor Error',
        },
      });
    });

    await act(async () => {
      await result.current.guardar();
    });

    expect(result.current.error).toBe('Error al guardar');
    expect(result.current.guardando).toBe(false);
  });
});
