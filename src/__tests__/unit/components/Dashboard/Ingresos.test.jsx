import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  setPeriodo: vi.fn(),
  hook: vi.fn(),
  tooltipProps: {
    active: true,
    payload: [{ value: 1500, color: '#123456' }],
    label: 'Ene',
  },
}));

vi.mock('@/presentation/components/Dashboard/Ingresos/useIngresos', () => ({
  default: mocks.hook,
}));

vi.mock('recharts', async () => {
  const React = await import('react');

  return {
    LineChart: ({ children }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Line: () => <div data-testid="line" />,
    XAxis: ({ dataKey }) => (
      <div data-testid="x-axis">{dataKey}</div>
    ),
    YAxis: ({ tickFormatter }) => (
      <div data-testid="y-axis">
        {tickFormatter?.(1500)}
        {tickFormatter?.(500)}
      </div>
    ),
    Tooltip: ({ content }) => (
      <div data-testid="tooltip">
        {React.cloneElement(content, mocks.tooltipProps)}
      </div>
    ),
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

import Ingresos from '@/presentation/components/Dashboard/Ingresos/Ingresos';

describe('Ingresos', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.tooltipProps = {
      active: true,
      payload: [{ value: 1500, color: '#123456' }],
      label: 'Ene',
    };
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

  it('renderiza tooltip con valor menor a mil', () => {
    mocks.tooltipProps = {
      active: true,
      payload: [{ value: 500, color: '#123456' }],
      label: 'Ene',
    };

    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos highContrast={false} />);

    expect(screen.getByText('$500')).toBeInTheDocument();
    expect(screen.getByText('Ene')).toBeInTheDocument();
  });

  it('renderiza tooltip con valor en miles', () => {
    mocks.tooltipProps = {
      active: true,
      payload: [{ value: 1500, color: '#123456' }],
      label: 'Ene',
    };

    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos highContrast={false} />);

    expect(screen.getByText('$1.5k')).toBeInTheDocument();
  });

  it('renderiza tooltip en alto contraste', () => {
    mocks.tooltipProps = {
      active: true,
      payload: [{ value: 1500, color: '#123456' }],
      label: 'Ene',
    };

    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos highContrast />);

    expect(screen.getByText('$1.5k')).toBeInTheDocument();
    expect(screen.getByText('Ene')).toHaveStyle({ color: '#ffff00' });
    expect(screen.getByText('$1.5k')).toHaveStyle({ color: '#ffff00' });
  });

  it('no renderiza tooltip cuando está inactivo', () => {
    mocks.tooltipProps = {
      active: false,
      payload: [{ value: 1500, color: '#123456' }],
      label: 'Ene',
    };

    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos highContrast={false} />);

    expect(screen.queryByText('Ene')).not.toBeInTheDocument();
    expect(screen.queryByText('$1.5k')).not.toBeInTheDocument();
  });

  it('no renderiza tooltip sin payload', () => {
    mocks.tooltipProps = {
      active: true,
      payload: [],
      label: 'Ene',
    };

    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos highContrast={false} />);

    expect(screen.queryByText('Ene')).not.toBeInTheDocument();
  });

  it('usa el color del payload sin alto contraste', () => {
    mocks.tooltipProps = {
      active: true,
      payload: [{ value: 500, color: '#abcdef' }],
      label: 'Ene',
    };

    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos highContrast={false} />);

    expect(screen.getByText('$500')).toHaveStyle({ color: '#abcdef' });
  });

  it('usa el color de alto contraste en tooltip', () => {
    mocks.tooltipProps = {
      active: true,
      payload: [{ value: 500, color: '#abcdef' }],
      label: 'Ene',
    };

    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos highContrast />);

    expect(screen.getByText('$500')).toHaveStyle({ color: '#ffff00' });
  });

  it('usa color de ticks en alto contraste', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos highContrast />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('usa color de ticks oscuro', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos darkMode highContrast={false} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('usa color de ticks claro', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ingresos darkMode={false} highContrast={false} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
