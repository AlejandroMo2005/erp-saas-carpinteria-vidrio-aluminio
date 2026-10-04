import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GrupoProveedor from '../../../../../../presentation/components/Facturacion/Proveedores/AlertasStock/GrupoProveedor';

const crearGrupo = (overrides = {}) => ({
  proveedor_id: 10,
  proveedor: 'Proveedor A',
  ciudad: 'Manta',
  telefono_whatsapp: '0991111111',
  items: [
    {
      variante_id: 101,
      material: 'Vidrio 6mm',
      color: 'Claro',
      stock: 2,
      stock_minimo: 10,
    },
    {
      variante_id: 102,
      material: 'Aluminio',
      color: null,
      stock: 4,
      stock_minimo: 8,
    },
  ],
  ...overrides,
});

describe('GrupoProveedor', () => {
  it('muestra el grupo expandido con sus materiales', () => {
    render(
      <GrupoProveedor
        grupo={crearGrupo()}
        onGenerarPedido={vi.fn()}
      />
    );

    expect(screen.getByText('Proveedor A')).toBeInTheDocument();
    expect(screen.getByText('Manta')).toBeInTheDocument();
    expect(screen.getByText('Vidrio 6mm - Claro')).toBeInTheDocument();
    expect(screen.getByText('Aluminio')).toBeInTheDocument();
    expect(screen.getByText('Hay 2 — mínimo 10')).toBeInTheDocument();
    expect(screen.getByText('Hay 4 — mínimo 8')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generar solicitud/ })).toBeInTheDocument();
  });

  it('colapsa y vuelve a expandir el grupo', () => {
    render(
      <GrupoProveedor
        grupo={crearGrupo()}
        onGenerarPedido={vi.fn()}
      />
    );

    const header = screen.getByRole('button', { name: /Proveedor A/ });

    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Vidrio 6mm - Claro')).toBeInTheDocument();

    fireEvent.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Vidrio 6mm - Claro')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Generar solicitud/ })).not.toBeInTheDocument();

    fireEvent.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Vidrio 6mm - Claro')).toBeInTheDocument();
  });

  it('permite seleccionar y deseleccionar materiales', () => {
    render(
      <GrupoProveedor
        grupo={crearGrupo()}
        onGenerarPedido={vi.fn()}
      />
    );

    const checks = screen.getAllByRole('checkbox');

    expect(checks).toHaveLength(2);
    expect(checks[0]).toBeChecked();
    expect(checks[1]).toBeChecked();

    fireEvent.click(checks[0]);

    expect(checks[0]).not.toBeChecked();

    fireEvent.click(checks[0]);

    expect(checks[0]).toBeChecked();
  });

  it('permite cambiar la cantidad solicitada', () => {
    render(
      <GrupoProveedor
        grupo={crearGrupo()}
        onGenerarPedido={vi.fn()}
      />
    );

    const input = screen.getAllByRole('spinbutton')[0];

    expect(input).toHaveValue(20);

    fireEvent.change(input, { target: { value: '15' } });

    expect(input).toHaveValue(15);
  });

  it('genera la solicitud con los materiales seleccionados y sus cantidades', () => {
    const onGenerarPedido = vi.fn();

    render(
      <GrupoProveedor
        grupo={crearGrupo()}
        onGenerarPedido={onGenerarPedido}
      />
    );

    const inputs = screen.getAllByRole('spinbutton');

    fireEvent.change(inputs[1], { target: { value: '12' } });
    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    fireEvent.click(screen.getByRole('button', { name: /Generar solicitud/ }));

    expect(onGenerarPedido).toHaveBeenCalledTimes(1);
    expect(onGenerarPedido).toHaveBeenCalledWith(
      10,
      'Proveedor A',
      '0991111111',
      [
        {
          material_id: 102,
          nombre_material: 'Aluminio',
          cantidad: '12',
          unidad: 'unidad',
        },
      ]
    );
  });

  it('deshabilita generar solicitud cuando no hay materiales seleccionados', () => {
    const onGenerarPedido = vi.fn();

    render(
      <GrupoProveedor
        grupo={crearGrupo()}
        onGenerarPedido={onGenerarPedido}
      />
    );

    screen.getAllByRole('checkbox').forEach(check => {
      fireEvent.click(check);
    });

    const boton = screen.getByRole('button', { name: /Generar solicitud/ });

    expect(boton).toBeDisabled();

    fireEvent.click(boton);

    expect(onGenerarPedido).not.toHaveBeenCalled();
  });

  it('muestra WhatsApp cuando el proveedor tiene teléfono', () => {
    render(
      <GrupoProveedor
        grupo={crearGrupo()}
        onGenerarPedido={vi.fn()}
      />
    );

    expect(screen.getByText('→ WhatsApp')).toBeInTheDocument();
  });

  it('oculta WhatsApp cuando el proveedor no tiene teléfono', () => {
    render(
      <GrupoProveedor
        grupo={crearGrupo({ telefono_whatsapp: null })}
        onGenerarPedido={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Generar solicitud/ })).toBeInTheDocument();
    expect(screen.queryByText('→ WhatsApp')).not.toBeInTheDocument();
  });

  it('muestra el estado sin proveedor y no permite generar solicitud', () => {
    render(
      <GrupoProveedor
        grupo={crearGrupo({
          proveedor_id: null,
          proveedor: null,
          ciudad: null,
          telefono_whatsapp: null,
        })}
        onGenerarPedido={vi.fn()}
      />
    );

    expect(screen.getByText('Sin proveedor asignado')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Asigna un proveedor a estos materiales para poder generar una solicitud.'
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: /Generar solicitud/ })
    ).not.toBeInTheDocument();
  });

  it('incluye el color en el nombre del material al generar la solicitud', () => {
    const onGenerarPedido = vi.fn();

    render(
      <GrupoProveedor
        grupo={crearGrupo()}
        onGenerarPedido={onGenerarPedido}
      />
    );

    fireEvent.click(screen.getAllByRole('checkbox')[1]);

    fireEvent.click(screen.getByRole('button', { name: /Generar solicitud/ }));

    expect(onGenerarPedido).toHaveBeenCalledWith(
      10,
      'Proveedor A',
      '0991111111',
      [
        {
          material_id: 101,
          nombre_material: 'Vidrio 6mm - Claro',
          cantidad: 20,
          unidad: 'unidad',
        },
      ]
    );
  });


  it('usa los valores de respaldo cuando aparece una variante no presente en el estado inicial', () => {
    const onGenerarPedido = vi.fn();

    const grupoInicial = crearGrupo();

    const { rerender } = render(
      <GrupoProveedor
        grupo={grupoInicial}
        onGenerarPedido={onGenerarPedido}
      />
    );

    const grupoActualizado = crearGrupo({
      items: [
        {
          variante_id: 999,
          material: 'Vidrio nuevo',
          color: null,
          stock: 1,
          stock_minimo: 7,
        },
      ],
    });

    rerender(
      <GrupoProveedor
        grupo={grupoActualizado}
        onGenerarPedido={onGenerarPedido}
      />
    );

    const input = screen.getByRole('spinbutton');

    expect(input).toHaveValue(null);

    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.click(screen.getByRole('button', { name: /Generar solicitud/ }));

    expect(onGenerarPedido).toHaveBeenCalledWith(
      10,
      'Proveedor A',
      '0991111111',
      [
        {
          material_id: 999,
          nombre_material: 'Vidrio nuevo',
          cantidad: 14,
          unidad: 'unidad',
        },
      ]
    );
  });

});
