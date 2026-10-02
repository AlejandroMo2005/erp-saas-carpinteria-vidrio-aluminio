import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  setPeriodo: vi.fn(),
  hook: vi.fn(),
}));

vi.mock('@/presentation/components/Dashboard/Ticket/useTicket', () => ({
  default: mocks.hook,
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ name }) => <div data-testid="line">{name}</div>,
  XAxis: ({ dataKey }) => <div data-testid="x-axis">{dataKey}</div>,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: ({ content }) => <div data-testid="tooltip">{content}</div>,
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

import Ticket from '@/presentation/components/Dashboard/Ticket/Ticket';

describe('Ticket', () => {
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

    render(<Ticket />);

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('muestra título, descripción y gráfico', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [{ periodo: 'Ene', ticket_promedio: 250, total_pedidos: 4 }],
      loading: false,
    });

    render(<Ticket darkMode={false} highContrast={false} />);

    expect(screen.getAllByText('Ticket promedio')).toHaveLength(2);
    expect(
      screen.getByText('Evolución del ticket promedio por mes'),
    ).toBeInTheDocument();

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toHaveTextContent('periodo');
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();

    expect(screen.getAllByText('Ticket promedio')).toHaveLength(2);
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
  });

  it('cambia el período', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ticket />);

    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));

    expect(mocks.setPeriodo).toHaveBeenCalledWith('semana');
  });

  it('renderiza el tooltip', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ticket />);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });
});
