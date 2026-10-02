import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemTrabajo from '@/presentation/components/Proformas/ItemTrabajo/ItemTrabajo';

const itemBase = {
  id: 10,
  trabajo_id: '',
  nombre_trabajo: '',
  ancho: 1,
  alto: 1,
  cantidad: 1,
  color_id: '',
  nombre_color: '',
  color_hex: '',
  detalle: '',
  subtotal: 0,
};

const trabajos = [
  { id: 1, nombre: 'Ventana' },
  { id: 2, nombre: 'Puerta' },
];

const coloresDB = [
  { id: 10, nombre: 'Blanco' },
  { id: 20, nombre: 'Negro' },
];

const mapaColores = {
  '10': { hex: '#ffffff', nombre: 'Blanco' },
  '20': { hex: '#111111', nombre: 'Negro' },
};

function renderItem(overrides = {}) {
  const props = {
    item: { ...itemBase, ...overrides.item },
    idx: 0,
    trabajos,
    coloresDB,
    mapaColores,
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
    puedeEliminar: true,
    loadingTrabajos: false,
    loadingColores: false,
    ...overrides,
  };

  return {
    ...render(<ItemTrabajo {...props} />),
    props,
  };
}

describe('ItemTrabajo', () => {
  it('renderiza los campos principales y las opciones de catálogos', () => {
    renderItem();

    expect(screen.getByRole('heading', { name: 'Trabajo #1' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de trabajo')).toBeInTheDocument();
    expect(screen.getByLabelText('Ancho')).toBeInTheDocument();
    expect(screen.getByLabelText('Alto')).toBeInTheDocument();
    expect(screen.getByLabelText('Cantidad')).toBeInTheDocument();
    expect(screen.getByLabelText('Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Detalle')).toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'Ventana' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Puerta' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Blanco' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Negro' })).toBeInTheDocument();
  });

  it('envía la actualización del tipo de trabajo', async () => {
    const user = userEvent.setup();
    const { props } = renderItem();

    await user.selectOptions(screen.getByLabelText('Tipo de trabajo'), '1');

    expect(props.onUpdate).toHaveBeenCalledWith(10, 'trabajo_id', '1');
  });

  it('envía actualizaciones de medidas y cantidad', () => {
    const { props } = renderItem();

    fireEvent.change(screen.getByLabelText('Ancho'), {
      target: { value: '2.5' },
    });

    fireEvent.change(screen.getByLabelText('Alto'), {
      target: { value: '3' },
    });

    fireEvent.change(screen.getByLabelText('Cantidad'), {
      target: { value: '4' },
    });

    expect(props.onUpdate).toHaveBeenCalledWith(10, 'ancho', '2.5');
    expect(props.onUpdate).toHaveBeenCalledWith(10, 'alto', '3');
    expect(props.onUpdate).toHaveBeenCalledWith(10, 'cantidad', '4');
  });

  it('envía la actualización del color', async () => {
    const user = userEvent.setup();
    const { props } = renderItem();

    await user.selectOptions(screen.getByLabelText('Color'), '20');

    expect(props.onUpdate).toHaveBeenCalledWith(10, 'color_id', '20');
  });

  it('envía la actualización del detalle', async () => {
    const user = userEvent.setup();
    const { props } = renderItem();

    const detalle = screen.getByLabelText('Detalle');

    await user.type(detalle, 'Personalizado');

    expect(props.onUpdate).toHaveBeenCalledWith(
      10,
      'detalle',
      'P'
    );

    expect(props.onUpdate).toHaveBeenLastCalledWith(
      10,
      'detalle',
      'o'
    );
  });

  it('permite eliminar el trabajo cuando puedeEliminar es true', async () => {
    const user = userEvent.setup();
    const { props } = renderItem();

    await user.click(
      screen.getByRole('button', { name: 'Eliminar trabajo 1' })
    );

    expect(props.onRemove).toHaveBeenCalledWith(10);
  });

  it('oculta el botón de eliminar cuando puedeEliminar es false', () => {
    renderItem({ puedeEliminar: false });

    expect(
      screen.queryByRole('button', { name: 'Eliminar trabajo 1' })
    ).not.toBeInTheDocument();
  });

  it('deshabilita los selectores mientras cargan los catálogos', () => {
    renderItem({
      loadingTrabajos: true,
      loadingColores: true,
    });

    expect(screen.getByLabelText('Tipo de trabajo')).toBeDisabled();
    expect(screen.getByLabelText('Color')).toBeDisabled();

    expect(
      screen.getByRole('option', { name: 'Cargando tipos…' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('option', { name: 'Cargando colores…' })
    ).toBeInTheDocument();
  });

  it('usa el color del item cuando está disponible', () => {
    renderItem({
      item: {
        color_id: '20',
        color_hex: '#abcdef',
        nombre_color: 'Azul',
      },
    });

    const preview = document.querySelector('.color-circle-preview');

    expect(preview).toHaveStyle({ backgroundColor: '#abcdef' });
    expect(preview).toHaveAttribute('title', 'Azul');
  });

  it('usa el color del mapa cuando el item no tiene color_hex', () => {
    renderItem({
      item: {
        color_id: '10',
        color_hex: '',
        nombre_color: 'Blanco',
      },
    });

    const preview = document.querySelector('.color-circle-preview');

    expect(preview).toHaveStyle({ backgroundColor: '#ffffff' });
    expect(preview).toHaveClass('color-circle-preview--claro');
  });

  it('usa el color gris por defecto cuando no existe color seleccionado', () => {
    renderItem({
      item: {
        color_id: '',
        color_hex: '',
        nombre_color: '',
      },
    });

    const preview = document.querySelector('.color-circle-preview');

    expect(preview).toHaveStyle({ backgroundColor: '#d1d5db' });
    expect(preview).toHaveAttribute('title', 'Sin color seleccionado');
  });

  it('muestra los valores actuales del item', () => {
    renderItem({
      item: {
        trabajo_id: '2',
        ancho: 2.5,
        alto: 3,
        cantidad: 4,
        color_id: '20',
        detalle: 'Vidrio templado',
      },
    });

    expect(screen.getByLabelText('Tipo de trabajo')).toHaveValue('2');
    expect(screen.getByLabelText('Ancho')).toHaveValue(2.5);
    expect(screen.getByLabelText('Alto')).toHaveValue(3);
    expect(screen.getByLabelText('Cantidad')).toHaveValue(4);
    expect(screen.getByLabelText('Color')).toHaveValue('20');
    expect(screen.getByLabelText('Detalle')).toHaveValue('Vidrio templado');
  });
});
