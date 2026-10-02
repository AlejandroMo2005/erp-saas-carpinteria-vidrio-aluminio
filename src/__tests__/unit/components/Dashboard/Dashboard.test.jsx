import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  resumen: vi.fn(),
  accessibility: vi.fn(),
}));

vi.mock('@/presentation/context/AccessibilityContext', () => ({
  useAccessibility: mocks.accessibility,
}));

vi.mock('@/presentation/hooks/useDashboard', () => ({
  useDashboardResumen: mocks.resumen,
}));

vi.mock('lucide-react', () => ({
  Package: () => <span data-testid="package-icon" />,
  Activity: () => <span data-testid="activity-icon" />,
  TrendingUp: () => <span />,
  ShoppingCart: () => <span />,
  Users: () => <span />,
  BarChart2: () => <span />,
}));

vi.mock('@/presentation/components/Dashboard/Ingresos/Ingresos', () => ({
  default: () => <div data-testid="vista-ingresos">Ingresos</div>,
}));
vi.mock('@/presentation/components/Dashboard/Pedidos/Pedidos', () => ({
  default: () => <div data-testid="vista-pedidos">Pedidos</div>,
}));
vi.mock('@/presentation/components/Dashboard/Usuarios/Usuarios', () => ({
  default: () => <div data-testid="vista-usuarios">Usuarios</div>,
}));
vi.mock('@/presentation/components/Dashboard/Ticket/Ticket', () => ({
  default: () => <div data-testid="vista-ticket">Ticket</div>,
}));
vi.mock('@/presentation/components/Dashboard/Productos/Productos', () => ({
  default: () => <div data-testid="vista-productos">Productos</div>,
}));
vi.mock('@/presentation/components/Dashboard/Estado/Estado', () => ({
  default: () => <div data-testid="vista-estado">Estado</div>,
}));

import Dashboard from '@/presentation/components/Dashboard/Dashboard';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.accessibility.mockReturnValue({
      darkMode: false,
      highContrast: false,
    });

    mocks.resumen.mockReturnValue({
      data: {
        ingresos_totales: 2500,
        total_pedidos: 12,
        usuarios_activos: 5,
        ticket_promedio: 208,
      },
      isLoading: false,
      isPlaceholderData: false,
      isError: false,
    });
  });

  it('muestra encabezado y KPIs', () => {
    render(<Dashboard />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Métricas de ventas e inventario')).toBeInTheDocument();

    expect(screen.getByText('$2.5k')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('$208')).toBeInTheDocument();

    expect(screen.getByText('Ingresos totales')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Usuarios activos')).toBeInTheDocument();
  });

  it('muestra skeleton durante la carga', () => {
    mocks.resumen.mockReturnValue({
      data: undefined,
      isLoading: true,
      isPlaceholderData: false,
      isError: false,
    });

    render(<Dashboard />);

    expect(screen.getAllByRole('button')).toHaveLength(6);
    expect(screen.getByText('Ingresos totales')).toBeInTheDocument();
  });

  it('muestra error de métricas', () => {
    mocks.resumen.mockReturnValue({
      data: undefined,
      isLoading: false,
      isPlaceholderData: false,
      isError: true,
    });

    render(<Dashboard />);

    expect(
      screen.getByText(/No se pudieron cargar las métricas/),
    ).toBeInTheDocument();
  });

  it('abre y cierra las vistas mediante los KPIs', async () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole('button', { name: /Ingresos totales/ }));
    await waitFor(() => expect(screen.getByTestId('vista-ingresos')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Ingresos totales/ }));
    await waitFor(() => expect(screen.queryByTestId('vista-ingresos')).not.toBeInTheDocument());
  });

  it('abre las vistas secundarias', async () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole('button', { name: /Productos/ }));
    await waitFor(() => expect(screen.getByTestId('vista-productos')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Estados de pedido/ }));
    await waitFor(() => expect(screen.getByTestId('vista-estado')).toBeInTheDocument());
  });
});
