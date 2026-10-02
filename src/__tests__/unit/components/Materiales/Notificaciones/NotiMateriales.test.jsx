import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  ToastContainer,
  useToasts,
} from '../../../../../presentation/components/Materiales/Notificaciones/NotiMateriales';

function ToastHarness() {
  const { toasts, push, remove } = useToasts();

  return (
    <>
      <button onClick={() => push('Guardado correctamente', 'success')}>
        Success
      </button>
      <button onClick={() => push('Ocurrió un error', 'error')}>
        Error
      </button>
      <button onClick={() => push('Información', 'info')}>
        Info
      </button>
      <button onClick={() => push('Tipo desconocido', 'warning')}>
        Unknown
      </button>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}

describe('NotiMateriales', () => {
  it('no renderiza el contenedor cuando no existen toasts', () => {
    render(<ToastContainer toasts={[]} onRemove={vi.fn()} />);

    expect(screen.queryByRole('region', { name: 'Notificaciones' }))
      .not.toBeInTheDocument();
  });

  it('agrega y muestra un toast success', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Success' }));

    expect(screen.getByRole('status')).toHaveTextContent('Guardado correctamente');
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('muestra los iconos de error e información', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Error' }));
    fireEvent.click(screen.getByRole('button', { name: 'Info' }));

    expect(screen.getByText('✕')).toBeInTheDocument();
    expect(screen.getByText('ℹ')).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(2);
  });

  it('usa el icono de información para un tipo desconocido', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Unknown' }));

    expect(screen.getByText('ℹ')).toBeInTheDocument();
    expect(screen.getByText('Tipo desconocido')).toBeInTheDocument();
  });

  it('elimina manualmente un toast', () => {
    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Success' }));

    expect(screen.getByRole('status')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {
      name: 'Cerrar notificación',
    }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('elimina automáticamente el toast después de 3500 ms', () => {
    vi.useFakeTimers();

    render(<ToastHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Success' }));

    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
