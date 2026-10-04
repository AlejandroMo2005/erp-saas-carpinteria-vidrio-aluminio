import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  hook: vi.fn(),
}));

vi.mock('@/presentation/components/Dashboard/Usuarios/useUsuarios', () => ({
  default: mocks.hook,
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: ({ dataKey }) => <div data-testid="y-axis">{dataKey}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: ({ fill }) => <div data-testid="cell" data-fill={fill} />,
}));

import Usuarios from '@/presentation/components/Dashboard/Usuarios/Usuarios';

describe('Usuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra carga', () => {
    mocks.hook.mockReturnValue({
      data: [],
      loading: true,
    });

    render(<Usuarios />);

    expect(screen.getByText('Cargando usuarios…')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay datos', () => {
    mocks.hook.mockReturnValue({
      data: [],
      loading: false,
    });

    render(<Usuarios />);

    expect(screen.getByText('Ingresos por usuario')).toBeInTheDocument();
    expect(screen.getByText('No hay datos de usuarios')).toBeInTheDocument();
  });

  it('muestra usuarios y gráfico', () => {
    mocks.hook.mockReturnValue({
      data: [
        { nombre: 'Admin', ingresos_totales: 1500, total_pedidos: 5 },
        { nombre: 'Vendedor', ingresos_totales: 350, total_pedidos: 2 },
      ],
      loading: false,
    });

    render(<Usuarios darkMode={false} highContrast={false} />);

    expect(screen.getByText('Ingresos por usuario')).toBeInTheDocument();
    expect(screen.getByText('Top usuarios con más ventas')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toHaveTextContent('nombre');
    expect(screen.getAllByTestId('cell')).toHaveLength(2);
  });

  it('usa el color de ticks del modo oscuro', () => {
    mocks.hook.mockReturnValue({
      data: [
        { nombre: 'Admin', ingresos_totales: 1000, total_pedidos: 3 },
      ],
      loading: false,
    });

    render(<Usuarios darkMode />);

    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
  });

  it('usa la paleta de alto contraste', () => {
    mocks.hook.mockReturnValue({
      data: [
        { nombre: 'Admin', ingresos_totales: 1000, total_pedidos: 3 },
      ],
      loading: false,
    });

    render(<Usuarios highContrast />);

    expect(screen.getByTestId('cell')).toHaveAttribute(
      'data-fill',
      expect.any(String),
    );
  });
});
