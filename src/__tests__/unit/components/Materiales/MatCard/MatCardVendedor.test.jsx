import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../presentation/components/Materiales/MatCard/IconoMaterial/IconoMaterial', () => ({
  default: ({ nombre }) => <div data-testid="icono-material">{nombre}</div>,
}));

vi.mock('../../../../../presentation/components/Materiales/utils/materialesUtils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    normalizarColor: (color) => color || '#000000',
  };
});

import MatCardVendedor from '../../../../../presentation/components/Materiales/MatCard/MatCardVendedor';

const variantes = [
  {
    variante_id: 1,
    color_nombre: 'Natural',
    color_valor: '#ffffff',
  },
  {
    variante_id: 2,
    color_nombre: 'Negro',
    color_valor: '#000000',
  },
];

const activo = {
  material_id: 10,
  nombre_material: 'Aluminio',
  stock: 8,
  precio: '12.50',
  variante_id: 1,
  color_nombre: 'Natural',
  color_valor: '#ffffff',
};

describe('MatCardVendedor', () => {
  it('renderiza la tarjeta de solo lectura con sus datos', () => {
    render(
      <MatCardVendedor
        cardKey="aluminio"
        variantes={variantes}
        activo={activo}
        onSeleccionar={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Material ID 10')).toHaveTextContent('#10');
    expect(screen.getByLabelText('8 unidades disponibles')).toHaveTextContent('8 DISPONIBLES');
    expect(screen.getByText('Aluminio')).toBeInTheDocument();
    expect(screen.getByText('Natural')).toBeInTheDocument();
    expect(screen.getAllByText('$12.50')).toHaveLength(2);
    expect(screen.getByLabelText('Vista de solo lectura')).toHaveTextContent('Solo lectura');
  });

  it('marca la variante activa y permite seleccionar otra variante', () => {
    const onSeleccionar = vi.fn();

    render(
      <MatCardVendedor
        cardKey="aluminio"
        variantes={variantes}
        activo={activo}
        onSeleccionar={onSeleccionar}
      />,
    );

    const activa = screen.getByRole('button', { name: 'Ver color Natural' });
    const otra = screen.getByRole('button', { name: 'Ver color Negro' });

    expect(activa).toHaveAttribute('aria-pressed', 'true');
    expect(otra).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(otra);

    expect(onSeleccionar).toHaveBeenCalledWith('aluminio', variantes[1]);
  });

  it('aplica la clase de stock vacío cuando el stock es cero', () => {
    const stockCero = { ...activo, stock: 0 };

    render(
      <MatCardVendedor
        cardKey="aluminio"
        variantes={variantes}
        activo={stockCero}
        onSeleccionar={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('0 unidades disponibles'))
      .toHaveClass('mat-stock-tag--vacio');
  });

  it('no muestra la etiqueta de color cuando color_nombre está vacío', () => {
    const sinColor = { ...activo, color_nombre: '' };

    render(
      <MatCardVendedor
        cardKey="aluminio"
        variantes={variantes}
        activo={sinColor}
        onSeleccionar={vi.fn()}
      />,
    );

    expect(screen.queryByText('Natural')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('normaliza el color de cada variante', () => {
    render(
      <MatCardVendedor
        cardKey="aluminio"
        variantes={[
          { variante_id: 1, color_nombre: 'Rojo', color_valor: '#ff0000' },
        ]}
        activo={{ ...activo, variante_id: 1, color_nombre: 'Rojo' }}
        onSeleccionar={vi.fn()}
      />,
    );

    const muestra = document.querySelector('.color-sample');
    expect(muestra).toHaveStyle({ backgroundColor: '#ff0000' });
  });
});
