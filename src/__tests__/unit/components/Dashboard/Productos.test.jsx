import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  hook: vi.fn(),
  generarDatosGrafico: vi.fn(),
  toggleSeleccionado: vi.fn(),
  iconoMaterial: vi.fn(() => () => <span data-testid="material-icon" />),
  obtenerEstiloLinea: vi.fn(() => ({})),
}));

vi.mock('@/presentation/components/Dashboard/Productos/useProductos', () => ({
  default: mocks.hook,
  generarDatosGrafico: mocks.generarDatosGrafico,
}));

vi.mock('@/presentation/components/Dashboard/Productos/constants', () => ({
  iconoMaterial: mocks.iconoMaterial,
}));

vi.mock('@/presentation/components/Dashboard/Productos/Identificador', () => ({
  obtenerEstiloLinea: mocks.obtenerEstiloLinea,
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ name }) => <div data-testid="line">{name}</div>,
  XAxis: ({ dataKey }) => <div data-testid="x-axis">{dataKey}</div>,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Legend: () => <div data-testid="legend" />,
}));

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="close-icon" />,
}));

import Productos from '@/presentation/components/Dashboard/Productos/Productos';

describe('Productos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generarDatosGrafico.mockReturnValue([
      { periodo: 'Ene', Rojo: 10 },
    ]);
  });

  it('muestra carga', () => {
    mocks.hook.mockReturnValue({
      data: [],
      seleccionado: null,
      loading: true,
      toggleSeleccionado: mocks.toggleSeleccionado,
      materialSeleccionado: null,
    });

    render(<Productos />);

    expect(screen.getByText('Cargando productos…')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay materiales', () => {
    mocks.hook.mockReturnValue({
      data: [],
      seleccionado: null,
      loading: false,
      toggleSeleccionado: mocks.toggleSeleccionado,
      materialSeleccionado: null,
    });

    render(<Productos />);

    expect(screen.getByText('Inventario de materiales')).toBeInTheDocument();
    expect(screen.getByText('No hay materiales registrados')).toBeInTheDocument();
  });

  it('muestra materiales y permite seleccionarlos', () => {
    mocks.hook.mockReturnValue({
      data: [
        { material_id: 1, material: 'Vidrio' },
        { material_id: 2, material: 'Aluminio' },
      ],
      seleccionado: null,
      loading: false,
      toggleSeleccionado: mocks.toggleSeleccionado,
      materialSeleccionado: null,
    });

    render(<Productos />);

    expect(screen.getByText('Vidrio')).toBeInTheDocument();
    expect(screen.getByText('Aluminio')).toBeInTheDocument();
    expect(screen.getAllByTestId('material-icon')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Vidrio' }));

    expect(mocks.toggleSeleccionado).toHaveBeenCalledWith(1);
  });

  it('muestra gráfica y permite cerrarla', () => {
    const material = {
      material_id: 1,
      material: 'Vidrio',
      variantes: [
        { color_id: 10, color_nombre: 'Rojo', color_hex: '#f00' },
      ],
    };

    mocks.hook.mockReturnValue({
      data: [material],
      seleccionado: 1,
      loading: false,
      toggleSeleccionado: mocks.toggleSeleccionado,
      materialSeleccionado: material,
    });

    render(<Productos darkMode={false} highContrast={false} />);

    expect(screen.getByText('Evolución de stock por color (1 variantes)')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toHaveTextContent('Rojo');
    expect(mocks.generarDatosGrafico).toHaveBeenCalledWith(material);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar gráfica' }));

    expect(mocks.toggleSeleccionado).toHaveBeenCalledWith(1);
  });

  it('muestra mensaje cuando el material no tiene variantes', () => {
    const material = {
      material_id: 2,
      material: 'Aluminio',
      variantes: [],
    };

    mocks.hook.mockReturnValue({
      data: [material],
      seleccionado: 2,
      loading: false,
      toggleSeleccionado: mocks.toggleSeleccionado,
      materialSeleccionado: material,
    });

    render(<Productos />);

    expect(
      screen.getByText('Este material no tiene variantes de color'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });
});
