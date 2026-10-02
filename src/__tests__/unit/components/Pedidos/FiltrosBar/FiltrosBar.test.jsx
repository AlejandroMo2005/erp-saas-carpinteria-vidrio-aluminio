import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FiltrosBar from '../../../../../presentation/components/Pedidos/FiltrosBar/FiltrosBar';

const contadores = {
  activos: 5,
  pendientes: 3,
  entregados: 2,
  cancelados: 1,
  todos: 6,
};

describe('FiltrosBar', () => {
  it('muestra los filtros de período para administradores', () => {
    render(
      <FiltrosBar
        esAdmin
        esCliente={false}
        filtroEstado="activos"
        setFiltroEstado={vi.fn()}
        filtroPeriodo="mes"
        setFiltroPeriodo={vi.fn()}
        contadores={contadores}
      />,
    );

    expect(screen.getByRole('group', { name: 'Filtrar por período' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Esta semana' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Este mes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3 meses' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6 meses' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Este año' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Histórico' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Este mes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('no muestra filtros de período para usuarios no administradores', () => {
    render(
      <FiltrosBar
        esAdmin={false}
        esCliente={false}
        filtroEstado="activos"
        setFiltroEstado={vi.fn()}
        filtroPeriodo="mes"
        setFiltroPeriodo={vi.fn()}
        contadores={contadores}
      />,
    );

    expect(
      screen.queryByRole('group', { name: 'Filtrar por período' }),
    ).not.toBeInTheDocument();
  });

  it('ejecuta setFiltroPeriodo al seleccionar un período', () => {
    const setFiltroPeriodo = vi.fn();

    render(
      <FiltrosBar
        esAdmin
        esCliente={false}
        filtroEstado="activos"
        setFiltroEstado={vi.fn()}
        filtroPeriodo="mes"
        setFiltroPeriodo={setFiltroPeriodo}
        contadores={contadores}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Esta semana' }));

    expect(setFiltroPeriodo).toHaveBeenCalledTimes(1);
    expect(setFiltroPeriodo).toHaveBeenCalledWith('semana');
  });

  it('muestra los cinco filtros de estado y sus contadores', () => {
    render(
      <FiltrosBar
        esAdmin
        esCliente={false}
        filtroEstado="activos"
        setFiltroEstado={vi.fn()}
        filtroPeriodo="mes"
        setFiltroPeriodo={vi.fn()}
        contadores={contadores}
      />,
    );

    const group = screen.getByRole('group', { name: 'Filtrar por estado' });

    expect(group).toBeInTheDocument();
    expect(screen.getByText('Activos').closest('button')).toHaveTextContent('5');
    expect(screen.getByText('Pendientes').closest('button')).toHaveTextContent('3');
    expect(screen.getByText('Entregados').closest('button')).toHaveTextContent('2');
    expect(screen.getByText('Cancelados').closest('button')).toHaveTextContent('1');
    expect(screen.getByText('Todos').closest('button')).toHaveTextContent('6');
  });

  it('no muestra contadores cuando el usuario es cliente', () => {
    render(
      <FiltrosBar
        esAdmin={false}
        esCliente
        filtroEstado="activos"
        setFiltroEstado={vi.fn()}
        filtroPeriodo="mes"
        setFiltroPeriodo={vi.fn()}
        contadores={contadores}
      />,
    );

    expect(screen.getByRole('button', { name: 'Activos' })).toBeInTheDocument();
    expect(screen.queryByText('5')).not.toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('usa cero cuando no existe contador para un estado', () => {
    render(
      <FiltrosBar
        esAdmin={false}
        esCliente={false}
        filtroEstado="activos"
        setFiltroEstado={vi.fn()}
        filtroPeriodo="mes"
        setFiltroPeriodo={vi.fn()}
        contadores={{}}
      />,
    );

    expect(screen.getByText('Activos').closest('button')).toHaveTextContent('0');
  });

  it('marca como activo el filtro de estado seleccionado', () => {
    render(
      <FiltrosBar
        esAdmin={false}
        esCliente={false}
        filtroEstado="entregados"
        setFiltroEstado={vi.fn()}
        filtroPeriodo="mes"
        setFiltroPeriodo={vi.fn()}
        contadores={contadores}
      />,
    );

    expect(screen.getByText('Entregados').closest('button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Activos').closest('button')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('ejecuta setFiltroEstado al seleccionar un estado', () => {
    const setFiltroEstado = vi.fn();

    render(
      <FiltrosBar
        esAdmin={false}
        esCliente={false}
        filtroEstado="activos"
        setFiltroEstado={setFiltroEstado}
        filtroPeriodo="mes"
        setFiltroPeriodo={vi.fn()}
        contadores={contadores}
      />,
    );

    fireEvent.click(screen.getByText('Cancelados').closest('button'));

    expect(setFiltroEstado).toHaveBeenCalledTimes(1);
    expect(setFiltroEstado).toHaveBeenCalledWith('cancelados');
  });
});
