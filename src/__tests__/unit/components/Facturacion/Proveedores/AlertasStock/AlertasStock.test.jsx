import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlertasStock from '../../../../../../presentation/components/Facturacion/Proveedores/AlertasStock/AlertasStock';

vi.mock(
  '../../../../../../presentation/components/Facturacion/Proveedores/AlertasStock/GrupoProveedor',
  () => ({
    default: ({ grupo, onGenerarPedido }) => (
      <div data-testid="grupo-proveedor">
        <span>{grupo.proveedor ?? 'Sin proveedor'}</span>
        <span>{grupo.items.length} items</span>
        <button
          type="button"
          onClick={() => onGenerarPedido(grupo)}
        >
          Generar pedido
        </button>
      </div>
    ),
  })
);

describe('AlertasStock', () => {
  it('muestra el estado vacío cuando no existen alertas', () => {
    render(<AlertasStock alertas={[]} onGenerarPedido={vi.fn()} />);

    expect(screen.getByText('Sin alertas de stock bajo')).toBeInTheDocument();
    expect(
      screen.getByText('Todos los materiales están sobre su mínimo configurado.')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('grupo-proveedor')).not.toBeInTheDocument();
  });

  it('muestra el resumen singular para una sola alerta', () => {
    const alertas = [
      {
        proveedor_id: 1,
        proveedor: 'Proveedor A',
        material: 'Vidrio 6mm',
      },
    ];

    render(<AlertasStock alertas={alertas} onGenerarPedido={vi.fn()} />);

    expect(
      screen.getByText('1 variante por debajo del mínimo')
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('grupo-proveedor')).toHaveLength(1);
  });

  it('muestra el resumen plural para varias alertas', () => {
    const alertas = [
      {
        proveedor_id: 1,
        proveedor: 'Proveedor A',
        material: 'Vidrio 6mm',
      },
      {
        proveedor_id: 2,
        proveedor: 'Proveedor B',
        material: 'Aluminio',
      },
    ];

    render(<AlertasStock alertas={alertas} onGenerarPedido={vi.fn()} />);

    expect(
      screen.getByText('2 variantes por debajo del mínimo')
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('grupo-proveedor')).toHaveLength(2);
  });

  it('muestra el grupo sin proveedor asignado', () => {
    const alertas = [
      {
        proveedor_id: null,
        proveedor: null,
        material: 'Vidrio 6mm',
      },
    ];

    render(<AlertasStock alertas={alertas} onGenerarPedido={vi.fn()} />);

    expect(screen.getByText('Sin proveedor')).toBeInTheDocument();
    expect(screen.getAllByTestId('grupo-proveedor')).toHaveLength(1);
  });
  it('pasa cada grupo y el callback de generación de pedido a GrupoProveedor', () => {
    const onGenerarPedido = vi.fn();
    const alertas = [
      {
        proveedor_id: 1,
        proveedor: 'Proveedor A',
        material: 'Vidrio 6mm',
      },
    ];

    render(
      <AlertasStock
        alertas={alertas}
        onGenerarPedido={onGenerarPedido}
      />
    );

    expect(screen.getByText('Proveedor A')).toBeInTheDocument();
    expect(screen.getByText('1 items')).toBeInTheDocument();

    screen.getByRole('button', { name: 'Generar pedido' }).click();

    expect(onGenerarPedido).toHaveBeenCalledTimes(1);
    expect(onGenerarPedido).toHaveBeenCalledWith(
      expect.objectContaining({
        proveedor_id: 1,
        proveedor: 'Proveedor A',
        items: [alertas[0]],
      })
    );
  });
});
