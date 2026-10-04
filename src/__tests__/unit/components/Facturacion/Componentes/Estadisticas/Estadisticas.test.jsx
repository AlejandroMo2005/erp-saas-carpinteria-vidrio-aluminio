import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock(
  '../../../../../../presentation/context/useAccessibility',
  () => ({
    useAccessibility: vi.fn(),
  })
);

vi.mock(
  '../../../../../../presentation/components/Facturacion/Componentes/Estadisticas/useEstadisticas',
  () => ({
    default: vi.fn(),
  })
);

vi.mock('recharts', () => {
  const Componente = ({ children, data, dataKey, name, ...props }) => (
    <div
      data-testid={props['data-testid'] || 'recharts-component'}
      data-data-key={dataKey}
      data-name={name}
      data-count={Array.isArray(data) ? data.length : undefined}
    >
      {children}
    </div>
  );

  const Tooltip = ({ content }) => (
    <div data-testid="recharts-tooltip">
      {content &&
        typeof content === 'object' &&
        React.cloneElement(content, {
          active: true,
          payload: [
            { dataKey: 'total', name: 'Total facturado', value: 1250, color: '#6366f1' },
            { dataKey: 'cantidad', name: 'Nº facturas', value: 8, color: '#10b981' },
          ],
          label: '2026-09',
        })}
    </div>
  );

  return {
    LineChart: Componente,
    Line: Componente,
    BarChart: Componente,
    Bar: Componente,
    PieChart: Componente,
    Pie: Componente,
    Cell: ({ fill }) => <span data-testid="chart-cell" data-fill={fill} />,
    XAxis: Componente,
    YAxis: Componente,
    CartesianGrid: Componente,
    Tooltip,
    Legend: Componente,
    ResponsiveContainer: Componente,
  };
});

import { useAccessibility } from '../../../../../../presentation/context/useAccessibility';
import useEstadisticas from '../../../../../../presentation/components/Facturacion/Componentes/Estadisticas/useEstadisticas';
import Estadisticas, {
  TooltipMoneda,
  TooltipEstado,
} from '../../../../../../presentation/components/Facturacion/Componentes/Estadisticas/Estadisticas';

describe('Estadisticas', () => {
  const crearEstadoBase = (overrides = {}) => ({
    periodo: '6m',
    setPeriodo: vi.fn(),
    loading: false,
    error: null,
    datos: {
      facturacionMensual: [],
      topClientes: [],
      distribucionEstados: [],
    },
    resumen: null,
    cargarDatos: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    useAccessibility.mockReturnValue({
      darkMode: false,
      highContrast: false,
    });
  });

  it('muestra el estado de carga', () => {
    useEstadisticas.mockReturnValue(
      crearEstadoBase({
        loading: true,
      })
    );

    render(<Estadisticas />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Cargando estadísticas...'
    );
  });

  it('muestra el error y permite reintentar', () => {
    const cargarDatos = vi.fn();

    useEstadisticas.mockReturnValue(
      crearEstadoBase({
        error: 'Error al consultar estadísticas',
        cargarDatos,
      })
    );

    render(<Estadisticas />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Error al consultar estadísticas'
    );

    screen.getByRole('button', { name: /reintentar/i }).click();

    expect(cargarDatos).toHaveBeenCalledTimes(1);
  });

  it('muestra el encabezado y permite cambiar el periodo', () => {
    const setPeriodo = vi.fn();
    const cargarDatos = vi.fn();

    useEstadisticas.mockReturnValue(
      crearEstadoBase({
        setPeriodo,
        cargarDatos,
      })
    );

    render(<Estadisticas />);

    expect(
      screen.getByRole('heading', { name: 'Estadísticas de Facturación' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Últimos 3 meses' })
    ).toHaveAttribute('aria-pressed', 'false');

    expect(
      screen.getByRole('button', { name: 'Últimos 6 meses' })
    ).toHaveAttribute('aria-pressed', 'true');

    expect(
      screen.getByRole('button', { name: 'Último año' })
    ).toHaveAttribute('aria-pressed', 'false');

    screen.getByRole('button', { name: 'Últimos 3 meses' }).click();
    expect(setPeriodo).toHaveBeenCalledWith('3m');

    screen.getByRole('button', { name: 'Actualizar' }).click();
    expect(cargarDatos).toHaveBeenCalledTimes(1);
  });

  it('muestra los KPI cuando existe resumen', () => {
    useEstadisticas.mockReturnValue(
      crearEstadoBase({
        resumen: {
          totalFacturado: 1234.5,
          variacionVsMesAnterior: 12.5,
          totalFacturas: 8,
          variacionFacturas: -5,
          ticketPromedio: 154.31,
          clientesUnicos: 6,
        },
      })
    );

    render(<Estadisticas />);

    expect(screen.getByText('Total facturado')).toBeInTheDocument();
    expect(screen.getByText('$1.234,50')).toBeInTheDocument();
    expect(
      screen.getAllByText(/12\.5% vs mes anterior/)
        .some((element) => element.textContent.includes('12.5% vs mes anterior'))
    ).toBe(true);

    expect(screen.getByText('Facturas emitidas')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(
      screen.getAllByText(/5% vs mes anterior/)
        .some((element) => element.textContent.includes('5% vs mes anterior'))
    ).toBe(true);

    expect(screen.getByText('Ticket promedio')).toBeInTheDocument();
    expect(screen.getByText('$154,31')).toBeInTheDocument();

    expect(screen.getByText('Clientes únicos')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('muestra los KPI sin variación cuando corresponde', () => {
    useEstadisticas.mockReturnValue(
      crearEstadoBase({
        resumen: {
          totalFacturado: 100,
          variacionVsMesAnterior: 0,
          totalFacturas: null,
          variacionFacturas: null,
          ticketPromedio: 0,
          clientesUnicos: null,
        },
      })
    );

    render(<Estadisticas />);

    expect(screen.getByText('0% vs mes anterior')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('muestra mensajes vacíos cuando no existen datos de gráficos', () => {
    useEstadisticas.mockReturnValue(
      crearEstadoBase({
        datos: {
          facturacionMensual: [],
          topClientes: [],
          distribucionEstados: [],
        },
      })
    );

    render(<Estadisticas />);

    expect(
      screen.getAllByText('Sin datos para el periodo')
    ).toHaveLength(3);
  });

  it('muestra los gráficos cuando existen datos', () => {
    useEstadisticas.mockReturnValue(
      crearEstadoBase({
        datos: {
          facturacionMensual: [
            { mes: '2026-09', total: 1500, cantidad: 3 },
          ],
          topClientes: [
            { cliente_nombre: 'Cliente Principal', total: 1500 },
          ],
          distribucionEstados: [
            { estado: 'AUTORIZADA', cantidad: 2 },
            { estado: 'OTRO_ESTADO', cantidad: 1 },
          ],
        },
      })
    );

    render(<Estadisticas />);

    expect(screen.getByText('Facturación mensual')).toBeInTheDocument();
    expect(screen.getByText('Distribución por estado')).toBeInTheDocument();
    expect(
      screen.getByText('Top clientes por monto facturado')
    ).toBeInTheDocument();

    expect(screen.getByText('OTRO_ESTADO')).toBeInTheDocument();
    expect(
      screen.getAllByTestId('recharts-component')
        .some((element) => element.getAttribute('data-data-key') === 'cliente_nombre')
    ).toBe(true);

    expect(screen.getAllByTestId('chart-cell')).toHaveLength(3);
    expect(screen.getAllByTestId('chart-cell')[0]).toHaveAttribute(
      'data-fill',
      '#10b981'
    );
  });

  it('aplica el modo oscuro y alto contraste', () => {
    useAccessibility.mockReturnValue({
      darkMode: true,
      highContrast: true,
    });

    useEstadisticas.mockReturnValue(
      crearEstadoBase({
        resumen: {
          totalFacturado: 100,
          variacionVsMesAnterior: 2,
          totalFacturas: 1,
          variacionFacturas: 1,
          ticketPromedio: 100,
          clientesUnicos: 1,
        },
        datos: {
          facturacionMensual: [
            { mes: '2026-09', total: 100, cantidad: 1 },
          ],
          topClientes: [
            { cliente_nombre: 'Cliente', total: 100 },
          ],
          distribucionEstados: [
            { estado: 'AUTORIZADA', cantidad: 1 },
          ],
        },
      })
    );

    render(<Estadisticas />);

    expect(
      screen.getAllByText('Total facturado')[0]
    ).toHaveStyle({ color: '#ffff00' });
  });
  it('usa el color de tick del modo oscuro sin alto contraste', () => {
    useAccessibility.mockReturnValue({
      darkMode: true,
      highContrast: false,
    });

    useEstadisticas.mockReturnValue(
      crearEstadoBase({
        datos: {
          facturacionMensual: [
            { mes: '2026-09', total: 100, cantidad: 1 },
          ],
          topClientes: [
            { cliente_nombre: 'Cliente', total: 100 },
          ],
          distribucionEstados: [
            { estado: 'AUTORIZADA', cantidad: 1 },
          ],
        },
      })
    );

    render(<Estadisticas />);

    expect(screen.getByText('Facturación mensual')).toBeInTheDocument();
  });

  it('usa arreglos vacíos cuando las colecciones de datos no existen', () => {
    useEstadisticas.mockReturnValue(
      crearEstadoBase({
        datos: {},
      })
    );

    render(<Estadisticas />);

    expect(
      screen.getAllByText('Sin datos para el periodo')
    ).toHaveLength(3);
  });

  it('maneja tooltips sin datos y con etiqueta sin formato', () => {
    useEstadisticas.mockReturnValue(
      crearEstadoBase({
        datos: {
          facturacionMensual: [
            { mes: '2026-09', total: 100, cantidad: 1 },
          ],
          topClientes: [],
          distribucionEstados: [
            { estado: 'AUTORIZADA', cantidad: 1 },
          ],
        },
      })
    );

    render(<Estadisticas />);

    expect(screen.getAllByTestId('recharts-tooltip')).toHaveLength(2);
  });

  it('no renderiza TooltipMoneda cuando está inactivo o sin payload', () => {
    const { rerender } = render(
      <TooltipMoneda
        active={false}
        payload={[{ dataKey: 'total', value: 100 }]}
        label="2026-09"
        highContrast={false}
      />
    );

    expect(screen.queryByText('Total facturado')).not.toBeInTheDocument();

    rerender(
      <TooltipMoneda
        active={true}
        payload={[]}
        label="2026-09"
        highContrast={false}
      />
    );

    expect(screen.queryByText('Total facturado')).not.toBeInTheDocument();
  });

  it('usa la etiqueta original cuando formatearMes devuelve un valor falsy', () => {
    const original = Date.prototype.toLocaleDateString;

    Date.prototype.toLocaleDateString = () => '';

    try {
      render(
        <TooltipMoneda
          active={true}
          payload={[{ dataKey: 'cantidad', name: 'Nº facturas', value: 8 }]}
          label="2026-09"
          highContrast={false}
        />
      );

      expect(screen.getByText('2026-09')).toBeInTheDocument();
    } finally {
      Date.prototype.toLocaleDateString = original;
    }
  });

  it('no renderiza TooltipEstado cuando está inactivo o sin payload', () => {
    const { rerender } = render(
      <TooltipEstado
        active={false}
        payload={[{ name: 'AUTORIZADA', value: 1 }]}
        highContrast={false}
      />
    );

    expect(screen.queryByText('1 facturas')).not.toBeInTheDocument();

    rerender(
      <TooltipEstado
        active={true}
        payload={[]}
        highContrast={false}
      />
    );

    expect(screen.queryByText('1 facturas')).not.toBeInTheDocument();
  });

});
