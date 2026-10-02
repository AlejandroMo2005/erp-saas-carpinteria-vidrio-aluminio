import { fireEvent, render, screen } from '@testing-library/react';
import Productos from '@/presentation/components/Dashboard/Productos/Productos';

const mocks = vi.hoisted(() => ({
  useProductos: vi.fn(),
}));

vi.mock('@/presentation/components/Dashboard/Productos/useProductos', () => ({
  default: mocks.useProductos,
  generarDatosGrafico: vi.fn(() => [
    { periodo: 'Ene', Blanco: 100, Negro: 50 },
    { periodo: 'Feb', Blanco: 110, Negro: 55 },
  ]),
}));

vi.mock('@/presentation/components/Dashboard/Productos/constants', () => ({
  iconoMaterial: vi.fn(() => () => <span data-testid="material-icon" />),
}));

vi.mock('@/presentation/components/Dashboard/Productos/Identificador', () => ({
  obtenerEstiloLinea: vi.fn(() => ({
    stroke: '#ffffff',
    strokeWidth: 3.5,
    dot: {
      fill: '#ffffff',
      r: 4,
      stroke: '#000000',
      strokeWidth: 2,
    },
    activeDot: {
      r: 6,
      stroke: '#000000',
      strokeWidth: 2,
    },
  })),
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ name }) => <div data-testid={`line-${name}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: ({ content }) => (
    <div data-testid="tooltip">
      {content}
    </div>
  ),
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Legend: () => <div data-testid="legend" />,
}));

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="close-icon" />,
}));

const crearEstado = (overrides = {}) => ({
  data: [],
  seleccionado: null,
  loading: false,
  toggleSeleccionado: vi.fn(),
  materialSeleccionado: undefined,
  ...overrides,
});

describe('Productos', () => {
  beforeEach(() => {
    mocks.useProductos.mockReset();
  });

  it('muestra el estado de carga', () => {
    mocks.useProductos.mockReturnValue(crearEstado({ loading: true }));

    render(<Productos darkMode={true} highContrast={false} />);

    expect(screen.getByText('Cargando productos…')).toBeInTheDocument();
  });

  it('muestra el mensaje cuando no existen materiales', () => {
    mocks.useProductos.mockReturnValue(crearEstado());

    render(<Productos darkMode={true} highContrast={false} />);

    expect(screen.getByText('Inventario de materiales')).toBeInTheDocument();
    expect(screen.getByText('No hay materiales registrados')).toBeInTheDocument();
  });

  it('muestra los materiales registrados', () => {
    mocks.useProductos.mockReturnValue(
      crearEstado({
        data: [
          { material_id: 1, material: 'Vidrio', variantes: [] },
          { material_id: 2, material: 'Aluminio', variantes: [] },
        ],
      })
    );

    render(<Productos darkMode={true} highContrast={false} />);

    expect(screen.getByText('Vidrio')).toBeInTheDocument();
    expect(screen.getByText('Aluminio')).toBeInTheDocument();
    expect(screen.getAllByTestId('material-icon')).toHaveLength(2);
  });

  it('ejecuta toggleSeleccionado al seleccionar un material', () => {
    const toggleSeleccionado = vi.fn();

    mocks.useProductos.mockReturnValue(
      crearEstado({
        data: [
          { material_id: 1, material: 'Vidrio', variantes: [] },
        ],
        toggleSeleccionado,
      })
    );

    render(<Productos darkMode={false} highContrast={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Vidrio/i }));

    expect(toggleSeleccionado).toHaveBeenCalledWith(1);
  });

  it('muestra la gráfica con múltiples variantes', () => {
    const material = {
      material_id: 1,
      material: 'Vidrio',
      variantes: [
        {
          color_id: 10,
          color_nombre: 'Blanco',
          color_hex: '#ffffff',
          stock: 100,
        },
        {
          color_id: 11,
          color_nombre: 'Negro',
          color_hex: '#000000',
          stock: 50,
        },
      ],
    };

    mocks.useProductos.mockReturnValue(
      crearEstado({
        data: [material],
        seleccionado: 1,
        materialSeleccionado: material,
      })
    );

    render(<Productos darkMode={true} highContrast={false} />);

    expect(screen.getAllByText('Vidrio')).toHaveLength(2);
    expect(screen.getByText(/Evolución de stock por color/)).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-Blanco')).toBeInTheDocument();
    expect(screen.getByTestId('line-Negro')).toBeInTheDocument();
  });

  it('cierra la gráfica al pulsar el botón de cierre', () => {
    const toggleSeleccionado = vi.fn();

    const material = {
      material_id: 1,
      material: 'Vidrio',
      variantes: [
        {
          color_id: 10,
          color_nombre: 'Blanco',
          color_hex: '#ffffff',
          stock: 100,
        },
      ],
    };

    mocks.useProductos.mockReturnValue(
      crearEstado({
        data: [material],
        seleccionado: 1,
        materialSeleccionado: material,
        toggleSeleccionado,
      })
    );

    render(<Productos darkMode={true} highContrast={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar gráfica' }));

    expect(toggleSeleccionado).toHaveBeenCalledWith(1);
  });

  it('muestra mensaje cuando el material no tiene variantes', () => {
    const material = {
      material_id: 1,
      material: 'Aluminio',
      variantes: [],
    };

    mocks.useProductos.mockReturnValue(
      crearEstado({
        data: [material],
        seleccionado: 1,
        materialSeleccionado: material,
      })
    );

    render(<Productos darkMode={false} highContrast={false} />);

    expect(
      screen.getByText('Este material no tiene variantes de color')
    ).toBeInTheDocument();

    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('renderiza correctamente en modo alto contraste', () => {
    const material = {
      material_id: 1,
      material: 'Vidrio',
      variantes: [
        {
          color_id: 10,
          color_nombre: 'Blanco',
          color_hex: '#ffffff',
          stock: 100,
        },
      ],
    };

    mocks.useProductos.mockReturnValue(
      crearEstado({
        data: [material],
        seleccionado: 1,
        materialSeleccionado: material,
      })
    );

    render(<Productos darkMode={false} highContrast={true} />);

    expect(screen.getAllByText('Vidrio')).toHaveLength(2);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
