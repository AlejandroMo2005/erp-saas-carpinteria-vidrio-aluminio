import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Buscador from '../../../../presentation/components/Materiales/Buscador/Buscador';

describe('Buscador', () => {
  it('renderiza el campo de búsqueda', () => {
    render(
      <Buscador
        busqueda=""
        setBusqueda={vi.fn()}
        gruposFiltrados={[]}
        busquedaDebounced=""
      />,
    );

    expect(
      screen.getByRole('searchbox', { name: 'Buscar material por nombre' }),
    ).toBeInTheDocument();
  });

  it('actualiza la búsqueda al escribir', () => {
    const setBusqueda = vi.fn();

    render(
      <Buscador
        busqueda=""
        setBusqueda={setBusqueda}
        gruposFiltrados={[]}
        busquedaDebounced=""
      />,
    );

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'aluminio' },
    });

    expect(setBusqueda).toHaveBeenCalledWith('aluminio');
  });

  it('muestra la cantidad en singular', () => {
    render(
      <Buscador
        busqueda="alu"
        setBusqueda={vi.fn()}
        gruposFiltrados={[['aluminio', []]]}
        busquedaDebounced="alu"
      />,
    );

    expect(screen.getByText('1 material para "alu"')).toBeInTheDocument();
  });

  it('muestra la cantidad en plural', () => {
    render(
      <Buscador
        busqueda="alu"
        setBusqueda={vi.fn()}
        gruposFiltrados={[
          ['aluminio', []],
          ['vidrio', []],
        ]}
        busquedaDebounced="alu"
      />,
    );

    expect(screen.getByText('2 materiales para "alu"')).toBeInTheDocument();
  });

  it('no muestra resultados cuando no hay materiales filtrados', () => {
    render(
      <Buscador
        busqueda=""
        setBusqueda={vi.fn()}
        gruposFiltrados={[]}
        busquedaDebounced=""
      />,
    );

    expect(screen.queryByText(/materiales?/)).not.toBeInTheDocument();
  });
});
