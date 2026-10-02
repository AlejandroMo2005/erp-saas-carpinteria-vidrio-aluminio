import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BadgeEstado from '../../../../../presentation/components/Pedidos/BadgeEstado/BadgeEstado';

describe('BadgeEstado', () => {
  it('renderiza como badge simple cuando no existen transiciones', () => {
    render(
      <BadgeEstado
        pedidoId={10}
        estadoActual="ENTREGADO"
        onCambiar={vi.fn()}
        cambiando={false}
        soloLectura={false}
      />,
    );

    const badge = screen.getByLabelText('Estado: ENTREGADO');

    expect(badge).toHaveTextContent('ENTREGADO');
    expect(badge.tagName).toBe('SPAN');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renderiza el estado traducido en modo solo lectura', () => {
    render(
      <BadgeEstado
        pedidoId={11}
        estadoActual="PENDIENTE"
        onCambiar={vi.fn()}
        cambiando={false}
        soloLectura
      />,
    );

    expect(
      screen.getByLabelText('Estado: ⏳ Pendiente'),
    ).toHaveTextContent('⏳ Pendiente');
  });

  it('usa el estado original cuando no existe etiqueta de cliente', () => {
    render(
      <BadgeEstado
        pedidoId={12}
        estadoActual="DESCONOCIDO"
        onCambiar={vi.fn()}
        cambiando={false}
        soloLectura
      />,
    );

    expect(
      screen.getByLabelText('Estado: DESCONOCIDO'),
    ).toHaveTextContent('DESCONOCIDO');
  });

  it('abre y cierra el menú de transición', () => {
    render(
      <BadgeEstado
        pedidoId={20}
        estadoActual="PENDIENTE"
        onCambiar={vi.fn()}
        cambiando={false}
        soloLectura={false}
      />,
    );

    const trigger = screen.getByRole('button', {
      name: 'Estado: PENDIENTE. Toca para cambiar',
    });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Marcar como Entregado — pedido 20' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Cancelar pedido — pedido 20' }),
    ).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('cierra el menú mediante el backdrop', () => {
    const { container } = render(
      <BadgeEstado
        pedidoId={21}
        estadoActual="PENDIENTE"
        onCambiar={vi.fn()}
        cambiando={false}
        soloLectura={false}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Estado: PENDIENTE. Toca para cambiar',
      }),
    );

    const backdrop = container.querySelector('.badge-backdrop');

    expect(backdrop).toBeTruthy();

    fireEvent.click(backdrop);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('ejecuta onCambiar con el pedido y el nuevo estado', () => {
    const onCambiar = vi.fn();

    render(
      <BadgeEstado
        pedidoId={25}
        estadoActual="PENDIENTE"
        onCambiar={onCambiar}
        cambiando={false}
        soloLectura={false}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Estado: PENDIENTE. Toca para cambiar',
      }),
    );

    fireEvent.click(
      screen.getByRole('menuitem', {
        name: 'Marcar como Entregado — pedido 25',
      }),
    );

    expect(onCambiar).toHaveBeenCalledTimes(1);
    expect(onCambiar).toHaveBeenCalledWith(25, 'ENTREGADO');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('muestra Guardando y deshabilita el botón mientras cambia', () => {
    render(
      <BadgeEstado
        pedidoId={30}
        estadoActual="PENDIENTE"
        onCambiar={vi.fn()}
        cambiando
        soloLectura={false}
      />,
    );

    const button = screen.getByRole('button', { name: 'Estado: PENDIENTE. Toca para cambiar' });

    expect(button).toHaveTextContent('Guardando…');
    expect(button).toBeDisabled();
  });

  it('no permite interacción en modo solo lectura aunque existan transiciones', () => {
    render(
      <BadgeEstado
        pedidoId={31}
        estadoActual="PENDIENTE"
        onCambiar={vi.fn()}
        cambiando={false}
        soloLectura
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('⏳ Pendiente')).toBeInTheDocument();
  });
});
