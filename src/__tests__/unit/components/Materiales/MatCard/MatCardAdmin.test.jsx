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

import MatCardAdmin from '../../../../../presentation/components/Materiales/MatCard/MatCardAdmin';

const variantes = [
  { variante_id: 1, color_nombre: 'Natural', color_valor: '#ffffff' },
  { variante_id: 2, color_nombre: 'Negro', color_valor: '#000000' },
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

const edit = {
  stock: 15,
  precio: '14.75',
};

describe('MatCardAdmin', () => {
  it('renderiza datos, campos editables y estado inicial', () => {
    render(
      <MatCardAdmin
        cardKey="aluminio"
        variantes={variantes}
        activo={activo}
        edit={edit}
        onSeleccionar={vi.fn()}
        onCampo={vi.fn()}
        onGuardar={vi.fn()}
        guardando={false}
      />,
    );

    expect(screen.getByLabelText('Material ID 10')).toHaveTextContent('#10');
    expect(screen.getByLabelText('8 unidades disponibles')).toHaveTextContent('8 DISPONIBLES');
    expect(screen.getByText('Aluminio')).toBeInTheDocument();
    expect(screen.getByText('Natural')).toBeInTheDocument();
    expect(screen.getByLabelText('Actualizar Aluminio variante Natural'))
      .toHaveTextContent('Actualizar Natural');

    expect(screen.getByLabelText('STOCK')).toHaveValue(15);
    expect(screen.getByLabelText('PRECIO')).toHaveValue(14.75);
    expect(screen.getAllByText('$12.50')).toHaveLength(1);
  });

  it('selecciona una variante y ejecuta onSeleccionar', () => {
    const onSeleccionar = vi.fn();

    render(
      <MatCardAdmin
        cardKey="aluminio"
        variantes={variantes}
        activo={activo}
        edit={edit}
        onSeleccionar={onSeleccionar}
        onCampo={vi.fn()}
        onGuardar={vi.fn()}
        guardando={false}
      />,
    );

    const activa = screen.getByRole('button', { name: 'Seleccionar color Natural' });
    const otra = screen.getByRole('button', { name: 'Seleccionar color Negro' });

    expect(activa).toHaveAttribute('aria-pressed', 'true');
    expect(otra).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(otra);

    expect(onSeleccionar).toHaveBeenCalledWith('aluminio', variantes[1]);
  });

  it('ejecuta onCampo al modificar stock y precio', () => {
    const onCampo = vi.fn();

    render(
      <MatCardAdmin
        cardKey="aluminio"
        variantes={variantes}
        activo={activo}
        edit={edit}
        onSeleccionar={vi.fn()}
        onCampo={onCampo}
        onGuardar={vi.fn()}
        guardando={false}
      />,
    );

    fireEvent.change(screen.getByLabelText('STOCK'), {
      target: { value: '20' },
    });

    fireEvent.change(screen.getByLabelText('PRECIO'), {
      target: { value: '18.50' },
    });

    expect(onCampo).toHaveBeenNthCalledWith(1, 'aluminio', 'stock', '20');
    expect(onCampo).toHaveBeenNthCalledWith(2, 'aluminio', 'precio', '18.50');
  });

  it('ejecuta onGuardar cuando se actualiza', () => {
    const onGuardar = vi.fn();

    render(
      <MatCardAdmin
        cardKey="aluminio"
        variantes={variantes}
        activo={activo}
        edit={edit}
        onSeleccionar={vi.fn()}
        onCampo={vi.fn()}
        onGuardar={onGuardar}
        guardando={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', {
      name: 'Actualizar Aluminio variante Natural',
    }));

    expect(onGuardar).toHaveBeenCalledWith('aluminio');
  });

  it('muestra estado guardando y deshabilita el botón', () => {
    render(
      <MatCardAdmin
        cardKey="aluminio"
        variantes={variantes}
        activo={activo}
        edit={edit}
        onSeleccionar={vi.fn()}
        onCampo={vi.fn()}
        onGuardar={vi.fn()}
        guardando
      />,
    );

    const boton = screen.getByRole('button', {
      name: 'Actualizar Aluminio variante Natural',
    });

    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-busy', 'true');
    expect(boton).toHaveTextContent('Guardando…');
  });

  it('usa valores por defecto cuando edit no existe', () => {
    render(
      <MatCardAdmin
        cardKey="aluminio"
        variantes={variantes}
        activo={{ ...activo, color_nombre: '' }}
        edit={undefined}
        onSeleccionar={vi.fn()}
        onCampo={vi.fn()}
        onGuardar={vi.fn()}
        guardando={false}
      />,
    );

    expect(screen.getByLabelText('STOCK')).toHaveValue(0);
    expect(screen.getByLabelText('PRECIO')).toHaveValue(0);
    expect(screen.queryByText('Natural')).not.toBeInTheDocument();
  });

  it('aplica la clase de stock vacío cuando el stock es cero', () => {
    render(
      <MatCardAdmin
        cardKey="aluminio"
        variantes={variantes}
        activo={{ ...activo, stock: 0 }}
        edit={edit}
        onSeleccionar={vi.fn()}
        onCampo={vi.fn()}
        onGuardar={vi.fn()}
        guardando={false}
      />,
    );

    expect(screen.getByLabelText('0 unidades disponibles'))
      .toHaveClass('mat-stock-tag--vacio');
  });
});
