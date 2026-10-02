import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  PedidoToastContainer,
  usePedidoToasts,
} from '../../../../../presentation/components/Pedidos/Notificaciones/NotiPedidos';

function Harness() {
  const {
    toasts,
    push,
    remove,
    ok,
    error,
    warning,
    info,
  } = usePedidoToasts();

  return (
    <>
      <div data-testid="toast-count">{toasts.length}</div>

      <button onClick={() => push('Mensaje push', 'info')}>push</button>
      <button onClick={() => ok('Operación correcta')}>ok</button>
      <button onClick={() => error('Ocurrió un error')}>error</button>
      <button onClick={() => warning('Advertencia')}>warning</button>
      <button onClick={() => info('Información')}>info</button>

      <PedidoToastContainer
        toasts={toasts}
        onRemove={remove}
      />
    </>
  );
}

describe('NotiPedidos', () => {
  it('inicia sin notificaciones y no renderiza el contenedor', () => {
    render(<Harness />);

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    expect(
      screen.queryByRole('region', { name: 'Notificaciones de pedidos' }),
    ).not.toBeInTheDocument();
  });

  it('push agrega una notificación de información', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'push' }));

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    expect(screen.getByRole('status')).toHaveTextContent('Mensaje push');
    expect(screen.getByRole('status')).toHaveClass('np-toast--info');
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('crea notificaciones con ok, error, warning e info', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'ok' }));
    fireEvent.click(screen.getByRole('button', { name: 'error' }));
    fireEvent.click(screen.getByRole('button', { name: 'warning' }));
    fireEvent.click(screen.getByRole('button', { name: 'info' }));

    expect(screen.getByTestId('toast-count')).toHaveTextContent('4');

    expect(screen.getByText('Operación correcta')).toBeInTheDocument();
    expect(screen.getByText('Ocurrió un error')).toBeInTheDocument();
    expect(screen.getByText('Advertencia')).toBeInTheDocument();
    expect(screen.getByText('Información')).toBeInTheDocument();

    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('permite eliminar una notificación manualmente', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'ok' }));

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar notificación' }),
    );

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    expect(
      screen.queryByRole('region', { name: 'Notificaciones de pedidos' }),
    ).not.toBeInTheDocument();
  });

  it('elimina automáticamente una notificación después de 4 segundos', () => {
    vi.useFakeTimers();

    try {
      render(<Harness />);

      fireEvent.click(screen.getByRole('button', { name: 'ok' }));

      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      act(() => {
        vi.advanceTimersByTime(3999);
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    } finally {
      vi.useRealTimers();
    }
  });

  it('usa el icono informativo como fallback para un tipo desconocido', () => {
    render(
      <PedidoToastContainer
        toasts={[{ id: 99, mensaje: 'Tipo desconocido', tipo: 'custom' }]}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveClass('np-toast--custom');
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('permite cerrar específicamente un toast seleccionado', () => {
    const onRemove = vi.fn();

    render(
      <PedidoToastContainer
        toasts={[
          { id: 1, mensaje: 'Primero', tipo: 'success' },
          { id: 2, mensaje: 'Segundo', tipo: 'error' },
        ]}
        onRemove={onRemove}
      />,
    );

    const botones = screen.getAllByRole('button', {
      name: 'Cerrar notificación',
    });

    fireEvent.click(botones[1]);

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith(2);
  });
});
