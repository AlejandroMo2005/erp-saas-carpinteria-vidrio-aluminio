import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../presentation/components/Pedidos/BadgeEstado/BadgeEstado', () => ({
  default: ({ pedidoId, estadoActual, onCambiar, cambiando, soloLectura }) => (
    <div
      data-testid="badge-estado"
      data-pedido-id={pedidoId}
      data-estado={estadoActual}
      data-cambiando={String(cambiando)}
      data-solo-lectura={String(soloLectura)}
      onClick={() => onCambiar(pedidoId, 'ENTREGADO')}
    >
      {estadoActual}
    </div>
  ),
}));

import PedidoCard from '../../../../../presentation/components/Pedidos/PedidoCard/PedidoCard';

const pedido = {
  id: 42,
  cliente: 'Cliente <script>alert("x")</script>',
  fecha: '2026-09-20T12:00:00.000Z',
  total: '125.5',
  trabajos_nombres: 'Ventana &amp; puerta <b>aluminio</b>',
  estado: 'PENDIENTE',
};

describe('PedidoCard', () => {
  it('renderiza los datos principales del pedido', () => {
    render(
      <PedidoCard
        pedido={pedido}
        onVerDetalle={vi.fn()}
        onCambiarEstado={vi.fn()}
        cambiando={false}
        soloLectura={false}
      />,
    );

    expect(screen.getByRole('article', { name: /Pedido 42/ })).toBeInTheDocument();
    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getByText('TOTAL: $125.50')).toBeInTheDocument();
    expect(screen.getByText('Ventana & puerta baluminio/b')).toBeInTheDocument();
    expect(screen.getByText('Cliente scriptalert(x)/script')).toBeInTheDocument();
  });

  it('renderiza la fecha con formato local ecuatoriano', () => {
    render(
      <PedidoCard
        pedido={pedido}
        onVerDetalle={vi.fn()}
        onCambiarEstado={vi.fn()}
        cambiando={false}
        soloLectura={false}
      />,
    );

    const time = screen.getByText(
      new Date(pedido.fecha).toLocaleDateString('es-EC'),
    );

    expect(time).toHaveAttribute('dateTime', pedido.fecha);
  });

  it('oculta el nombre del cliente en modo solo lectura', () => {
    render(
      <PedidoCard
        pedido={pedido}
        onVerDetalle={vi.fn()}
        onCambiarEstado={vi.fn()}
        cambiando={false}
        soloLectura
      />,
    );

    expect(screen.queryByLabelText(/Cliente:/)).not.toBeInTheDocument();
    expect(screen.getByTestId('badge-estado')).toHaveAttribute(
      'data-solo-lectura',
      'true',
    );
  });

  it('pasa correctamente las propiedades al BadgeEstado', () => {
    render(
      <PedidoCard
        pedido={pedido}
        onVerDetalle={vi.fn()}
        onCambiarEstado={vi.fn()}
        cambiando
        soloLectura={false}
      />,
    );

    const badge = screen.getByTestId('badge-estado');

    expect(badge).toHaveAttribute('data-pedido-id', '42');
    expect(badge).toHaveAttribute('data-estado', 'PENDIENTE');
    expect(badge).toHaveAttribute('data-cambiando', 'true');
  });

  it('ejecuta onCambiarEstado cuando BadgeEstado cambia el estado', () => {
    const onCambiarEstado = vi.fn();

    render(
      <PedidoCard
        pedido={pedido}
        onVerDetalle={vi.fn()}
        onCambiarEstado={onCambiarEstado}
        cambiando={false}
        soloLectura={false}
      />,
    );

    fireEvent.click(screen.getByTestId('badge-estado'));

    expect(onCambiarEstado).toHaveBeenCalledTimes(1);
    expect(onCambiarEstado).toHaveBeenCalledWith(42, 'ENTREGADO');
  });

  it('ejecuta onVerDetalle con el pedido completo', () => {
    const onVerDetalle = vi.fn();

    render(
      <PedidoCard
        pedido={pedido}
        onVerDetalle={onVerDetalle}
        onCambiarEstado={vi.fn()}
        cambiando={false}
        soloLectura={false}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ver visualización 3D del pedido 42',
      }),
    );

    expect(onVerDetalle).toHaveBeenCalledTimes(1);
    expect(onVerDetalle).toHaveBeenCalledWith(pedido);
  });

  it('convierte el total numérico y conserva dos decimales', () => {
    render(
      <PedidoCard
        pedido={{ ...pedido, total: 7 }}
        onVerDetalle={vi.fn()}
        onCambiarEstado={vi.fn()}
        cambiando={false}
        soloLectura={false}
      />,
    );

    expect(screen.getByText('TOTAL: $7.00')).toBeInTheDocument();
  });
});
