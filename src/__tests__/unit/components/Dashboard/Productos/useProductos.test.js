import { act, renderHook, waitFor } from '@testing-library/react';
import useProductos, {
  generarDatosGrafico,
} from '@/presentation/components/Dashboard/Productos/useProductos';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@/presentation/api/api', () => ({
  default: mocks,
}));

describe('generarDatosGrafico', () => {
  beforeEach(() => {
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(array => {
      array[0] = 2 ** 31;
      return array;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve [] cuando no existen variantes', () => {
    expect(generarDatosGrafico({})).toEqual([]);
    expect(generarDatosGrafico({ variantes: [] })).toEqual([]);
  });

  it('genera los seis periodos para las variantes', () => {
    const material = {
      variantes: [
        { stock: 100, color_nombre: 'Blanco' },
        { stock: 50, color_nombre: 'Negro' },
      ],
    };

    const resultado = generarDatosGrafico(material);

    expect(resultado).toHaveLength(6);
    expect(resultado.map(p => p.periodo)).toEqual([
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    ]);

    expect(resultado[0]).toMatchObject({
      periodo: 'Ene',
      Blanco: 100,
      Negro: 50,
    });
  });

  it('convierte stock inválido en cero', () => {
    const resultado = generarDatosGrafico({
      variantes: [
        { stock: 'invalido', color_nombre: 'Rojo' },
      ],
    });

    expect(resultado[0].Rojo).toBe(0);
  });

  it('nunca genera stock negativo', () => {
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(array => {
      array[0] = 0;
      return array;
    });

    const resultado = generarDatosGrafico({
      variantes: [
        { stock: 0, color_nombre: 'Negro' },
      ],
    });

    resultado.forEach(punto => {
      expect(punto.Negro).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('useProductos', () => {
  beforeEach(() => {
    mocks.get.mockReset();
  });

  it('carga materiales correctamente', async () => {
    const materiales = [
      {
        material_id: 1,
        material: 'Vidrio',
        variantes: [],
      },
      {
        material_id: 2,
        material: 'Aluminio',
        variantes: [],
      },
    ];

    mocks.get.mockResolvedValue({
      data: { data: materiales },
    });

    const { result } = renderHook(() => useProductos());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mocks.get).toHaveBeenCalledWith('/dashboard/materiales-variantes');
    expect(result.current.data).toEqual(materiales);
    expect(result.current.materialSeleccionado).toBeUndefined();
  });

  it('maneja errores de la API y finaliza la carga', async () => {
    const error = new Error('Error de API');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mocks.get.mockRejectedValue(error);

    const { result } = renderHook(() => useProductos());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(error);

    consoleSpy.mockRestore();
  });

  it('selecciona y deselecciona un material', async () => {
    mocks.get.mockResolvedValue({
      data: {
        data: [
          {
            material_id: 1,
            material: 'Vidrio',
            variantes: [],
          },
        ],
      },
    });

    const { result } = renderHook(() => useProductos());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.toggleSeleccionado(1);
    });

    expect(result.current.seleccionado).toBe(1);
    expect(result.current.materialSeleccionado.material).toBe('Vidrio');

    act(() => {
      result.current.toggleSeleccionado(1);
    });

    expect(result.current.seleccionado).toBeNull();
    expect(result.current.materialSeleccionado).toBeUndefined();
  });

  it('permite cambiar directamente de un material a otro', async () => {
    mocks.get.mockResolvedValue({
      data: {
        data: [
          { material_id: 1, material: 'Vidrio', variantes: [] },
          { material_id: 2, material: 'Aluminio', variantes: [] },
        ],
      },
    });

    const { result } = renderHook(() => useProductos());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.toggleSeleccionado(1);
    });

    act(() => {
      result.current.toggleSeleccionado(2);
    });

    expect(result.current.seleccionado).toBe(2);
    expect(result.current.materialSeleccionado.material).toBe('Aluminio');
  });
});
