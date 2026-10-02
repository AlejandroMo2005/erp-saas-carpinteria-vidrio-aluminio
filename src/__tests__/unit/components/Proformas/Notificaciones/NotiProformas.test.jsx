import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import {
  useProformaToasts,
  ProformaToastContainer,
} from '@/presentation/components/Proformas/Notificaciones/NotiProformas';

function ToastHarness() {
  const { toasts, push, remove, ok, error, warning, info } =
    useProformaToasts();

  return (
    <>
      <button onClick={() => push('Mensaje personalizado', 'success')}>
        Push
      </button>
      <button onClick={() => ok('Correcto')}>Ok</button>
      <button onClick={() => error('Error')}>Error</button>
      <button onClick={() => warning('Advertencia')}>Warning</button>
      <button onClick={() => info('Información')}>Info</button>

      <ProformaToastContainer
        toasts={toasts}
        onRemove={remove}
      />
    </>
  );
}

describe('useProformaToasts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('inicia sin notificaciones', () => {
    render(<ToastHarness />);

    expect(
      screen.queryByRole('region', {
        name: 'Notificaciones de proformas',
      })
    ).not.toBeInTheDocument();
  });

  it('agrega una notificación personalizada', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Push' }));

    expect(screen.getByText('Mensaje personalizado')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('np-toast--success');
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('usa el shortcut ok como success', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Ok' }));

    expect(screen.getByText('Correcto')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('np-toast--success');
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('usa el shortcut error como error', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Error' }));

    expect(screen.getByRole('status')).toHaveTextContent('Error');
    expect(screen.getByRole('status')).toHaveClass('np-toast--error');
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('usa el shortcut warning como warning', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Warning' }));

    expect(screen.getByText('Advertencia')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('np-toast--warning');
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('usa el shortcut info como info', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Info' }));

    expect(screen.getByText('Información')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('np-toast--info');
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('elimina automáticamente una notificación después de 4 segundos', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Push' }));

    expect(screen.getByText('Mensaje personalizado')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3999);
    });

    expect(screen.getByText('Mensaje personalizado')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(
      screen.queryByText('Mensaje personalizado')
    ).not.toBeInTheDocument();
  });

  it('permite cerrar manualmente una notificación', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Push' }));

    expect(screen.getByText('Mensaje personalizado')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar notificación' })
    );

    expect(
      screen.queryByText('Mensaje personalizado')
    ).not.toBeInTheDocument();
  });

  it('permite mantener varias notificaciones simultáneamente', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
    fireEvent.click(screen.getByRole('button', { name: 'Error' }));
    fireEvent.click(screen.getByRole('button', { name: 'Info' }));

    const statuses = screen.getAllByRole('status');

    expect(statuses).toHaveLength(3);
    expect(statuses[0]).toHaveTextContent('Correcto');
    expect(statuses[1]).toHaveTextContent('Error');
    expect(statuses[2]).toHaveTextContent('Información');
  });
});

describe('ProformaToastContainer', () => {
  it('retorna null cuando no existen notificaciones', () => {
    const { container } = render(
      <ProformaToastContainer
        toasts={[]}
        onRemove={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renderiza notificaciones con sus datos y permite cerrarlas', () => {
    const onRemove = vi.fn();

    render(
      <ProformaToastContainer
        toasts={[
          { id: 1, mensaje: 'Guardado correctamente', tipo: 'success' },
          { id: 2, mensaje: 'Ocurrió un problema', tipo: 'error' },
        ]}
        onRemove={onRemove}
      />
    );

    const region = screen.getByRole('region', {
      name: 'Notificaciones de proformas',
    });

    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'false');

    expect(screen.getByText('Guardado correctamente')).toBeInTheDocument();
    expect(screen.getByText('Ocurrió un problema')).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(2);

    const closeButtons = screen.getAllByRole('button', {
      name: 'Cerrar notificación',
    });

    fireEvent.click(closeButtons[1]);

    expect(onRemove).toHaveBeenCalledWith(2);
  });

  it('usa el icono de info como fallback para un tipo desconocido', () => {
    render(
      <ProformaToastContainer
        toasts={[
          { id: 99, mensaje: 'Tipo desconocido', tipo: 'custom' },
        ]}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('Tipo desconocido')).toBeInTheDocument();
    expect(screen.getByText('ℹ')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('np-toast--custom');
  });
});
