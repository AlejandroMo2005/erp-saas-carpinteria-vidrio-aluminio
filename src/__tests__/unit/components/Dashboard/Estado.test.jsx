import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/presentation/components/Dashboard/Estado/useEstado', () => ({
  default: vi.fn(),
}));

import useEstado from '@/presentation/components/Dashboard/Estado/useEstado';
import Estado from '@/presentation/components/Dashboard/Estado/Estado';

describe('Estado', () => {
  it('muestra estado de carga', () => {
    useEstado.mockReturnValue({
      data: [],
      loading: true,
      total: 0,
    });

    render(<Estado />);

    expect(screen.getByText('Cargando estados…')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay pedidos', () => {
    useEstado.mockReturnValue({
      data: [],
      loading: false,
      total: 0,
    });

    render(<Estado />);

    expect(screen.getByText('Estado de pedidos')).toBeInTheDocument();
    expect(screen.getByText('No hay pedidos registrados')).toBeInTheDocument();
  });

  it('muestra estados, cantidades, montos y porcentajes', () => {
    useEstado.mockReturnValue({
      data: [
        {
          estado: 'PENDIENTE',
          cantidad: 3,
          monto_total: 450,
        },
        {
          estado: 'ENTREGADO',
          cantidad: 1,
          monto_total: 200,
        },
      ],
      loading: false,
      total: 4,
    });

    render(<Estado />);

    expect(screen.getByText('PENDIENTE')).toBeInTheDocument();
    expect(screen.getByText('3 pedidos')).toBeInTheDocument();
    expect(screen.getByText('$450')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();

    expect(screen.getByText('ENTREGADO')).toBeInTheDocument();
    expect(screen.getByText('1 pedidos')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('muestra 0% cuando el total es cero', () => {
    useEstado.mockReturnValue({
      data: [
        {
          estado: 'PENDIENTE',
          cantidad: 0,
          monto_total: 0,
        },
      ],
      loading: false,
      total: 0,
    });

    render(<Estado />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
