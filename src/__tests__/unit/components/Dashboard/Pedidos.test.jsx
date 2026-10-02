import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@/presentation/api/api', () => ({
  default: {
    get: mocks.get,
  },
}));

import Pedidos from '@/presentation/components/Dashboard/Pedidos/Pedidos';

describe('Pedidos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra carga inicialmente', () => {
    mocks.get.mockReturnValue(new Promise(() => {}));

    render(<Pedidos />);

    expect(screen.getByText('Cargando pedidos…')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay pedidos', async () => {
    mocks.get.mockResolvedValueOnce({
      data: { data: [] },
    });

    render(<Pedidos />);

    await waitFor(() =>
      expect(screen.getByText('No hay pedidos registrados')).toBeInTheDocument(),
    );

    expect(mocks.get).toHaveBeenCalledWith(
      '/dashboard/pedidos-recientes?limite=10',
    );
  });

  it('muestra la tabla de pedidos', async () => {
    mocks.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            fecha: '2026-09-25',
            usuario: 'Admin',
            estado: 'ENTREGADO',
            total: 1250,
          },
          {
            id: 2,
            fecha: '2026-09-24',
            usuario: null,
            estado: 'PENDIENTE',
            total: 350,
          },
        ],
      },
    });

    render(<Pedidos />);

    await waitFor(() =>
      expect(screen.getByText('Últimos pedidos')).toBeInTheDocument(),
    );

    expect(screen.getByText('2026-09-25')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('ENTREGADO')).toBeInTheDocument();
    expect(screen.getByText('$1.3k')).toBeInTheDocument();

    expect(screen.getByText('2026-09-24')).toBeInTheDocument();
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument();
    expect(screen.getByText('$350')).toBeInTheDocument();

    expect(screen.getAllByText('—')).toHaveLength(1);
  });

  it('finaliza la carga cuando la API falla', async () => {
    mocks.get.mockRejectedValueOnce(new Error('API error'));

    render(<Pedidos />);

    await waitFor(() =>
      expect(screen.getByText('No hay pedidos registrados')).toBeInTheDocument(),
    );
  });
});
