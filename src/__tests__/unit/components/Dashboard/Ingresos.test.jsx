import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  setPeriodo: vi.fn(),
  hook: vi.fn(),
}));

vi.mock('@/presentation/components/Dashboard/Ingresos/useIngresos', () => ({
  default: mocks.hook,
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: ({ dataKey }) => <div data-testid="x-axis">{dataKey}</div>,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: ({ content }) => <div data-testid="tooltip">{content}</div>,
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

import Ingresos from '@/presentation/components/Dashboard/Ingresos/Ingresos';

describe('Ingresos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra carga', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: true,
    });

    render(<Ingresos />);

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('muestra título, períodos y gráfico', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [{ periodo: 'Ene', ingresos: 1500 }],
      loading: false,
    });

    render(<Ingresos darkMode={false} highContrast={false} />);

    expect(screen.getByText('Ingresos por mes')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toHaveTextContent('periodo');
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Mes' })).toBeInTheDocument();
  });

  it('cambia el período al pulsar un botón', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos />);

    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));

    expect(mocks.setPeriodo).toHaveBeenCalledWith('semana');
  });

  it('renderiza el tooltip con valores en miles', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos highContrast={false} />);

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toBeInTheDocument();
  });
});
