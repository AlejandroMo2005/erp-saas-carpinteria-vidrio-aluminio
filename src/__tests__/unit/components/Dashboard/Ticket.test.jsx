import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  setPeriodo: vi.fn(),
  hook: vi.fn(),
  tooltipProps: {
    active: false,
    payload: [],
    label: '',
  },
}));

vi.mock('@/presentation/components/Dashboard/Ticket/useTicket', () => ({
  default: mocks.hook,
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ name }) => <div data-testid="line">{name}</div>,
  XAxis: ({ dataKey, tick }) => (
    <div data-testid="x-axis" data-tick-color={tick?.fill}>
      {dataKey}
    </div>
  ),
  YAxis: ({ tick }) => (
    <div data-testid="y-axis" data-tick-color={tick?.fill} />
  ),
  Tooltip: ({ content }) => (
    <div data-testid="tooltip">
      {cloneElement(content, mocks.tooltipProps)}
    </div>
  ),
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

import Ticket from '@/presentation/components/Dashboard/Ticket/Ticket';

describe('Ticket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tooltipProps = {
      active: false,
      payload: [],
      label: '',
    };
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

  it('usa el color de alto contraste para los ejes', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ticket highContrast />);

    expect(screen.getByTestId('x-axis')).toHaveAttribute(
      'data-tick-color',
      '#ffff00',
    );
    expect(screen.getByTestId('y-axis')).toHaveAttribute(
      'data-tick-color',
      '#ffff00',
    );
  });

  it('usa el color oscuro para los ejes en modo oscuro', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ticket darkMode />);

    expect(screen.getByTestId('x-axis')).toHaveAttribute(
      'data-tick-color',
      '#cbd5e1',
    );
    expect(screen.getByTestId('y-axis')).toHaveAttribute(
      'data-tick-color',
      '#cbd5e1',
    );
  });

  it('usa el color normal para los ejes cuando no hay modo oscuro ni alto contraste', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    render(<Ticket darkMode={false} highContrast={false} />);

    expect(screen.getByTestId('x-axis')).toHaveAttribute(
      'data-tick-color',
      '#475569',
    );
    expect(screen.getByTestId('y-axis')).toHaveAttribute(
      'data-tick-color',
      '#475569',
    );
  });

  it('no renderiza el tooltip cuando no está activo', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    mocks.tooltipProps = {
      active: false,
      payload: [{ name: 'Ticket promedio', value: 250, color: '#000' }],
      label: 'Ene',
    };

    render(<Ticket />);

    expect(screen.getByTestId('tooltip')).toBeEmptyDOMElement();
  });

  it('no renderiza el tooltip cuando el payload está vacío', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    mocks.tooltipProps = {
      active: true,
      payload: [],
      label: 'Ene',
    };

    render(<Ticket />);

    expect(screen.getByTestId('tooltip')).toBeEmptyDOMElement();
  });

  it('renderiza el contenido del tooltip cuando está activo y tiene datos', () => {
    mocks.hook.mockReturnValue({
      periodo: 'mes',
      setPeriodo: mocks.setPeriodo,
      data: [],
      loading: false,
    });

    mocks.tooltipProps = {
      active: true,
      payload: [
        { name: 'Ticket promedio', value: 250, color: '#000' },
        { name: 'Pedidos', value: 4, color: '#111' },
      ],
      label: 'Ene',
    };

    render(<Ticket />);

    expect(screen.getByText('Ene')).toBeInTheDocument();
    expect(screen.getByText('Ticket promedio: 250')).toBeInTheDocument();
    expect(screen.getByText('Pedidos: 4')).toBeInTheDocument();
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
