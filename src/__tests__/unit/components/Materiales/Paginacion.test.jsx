import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Paginacion from '../../../../presentation/components/Materiales/Paginacion/Paginacion';

describe('Paginacion', () => {
  it('no renderiza cuando solo existe una página', () => {
    const { container } = render(
      <Paginacion pagina={1} totalPaginas={1} onChange={vi.fn()} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renderiza navegación básica y cambia de página', () => {
    const onChange = vi.fn();

    render(
      <Paginacion pagina={2} totalPaginas={3} onChange={onChange} />,
    );

    expect(screen.getByRole('navigation', {
      name: 'Paginación de materiales',
    })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(onChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(onChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('deshabilita anterior en la primera página', () => {
    render(
      <Paginacion pagina={1} totalPaginas={3} onChange={vi.fn()} />,
    );

    expect(
      screen.getByRole('button', { name: 'Página anterior' }),
    ).toBeDisabled();

    expect(
      screen.getByRole('button', { name: 'Página siguiente' }),
    ).not.toBeDisabled();
  });

  it('deshabilita siguiente en la última página', () => {
    render(
      <Paginacion pagina={3} totalPaginas={3} onChange={vi.fn()} />,
    );

    expect(
      screen.getByRole('button', { name: 'Página anterior' }),
    ).not.toBeDisabled();

    expect(
      screen.getByRole('button', { name: 'Página siguiente' }),
    ).toBeDisabled();
  });

  it('muestra elipsis cuando existen muchas páginas', () => {
    render(
      <Paginacion pagina={5} totalPaginas={10} onChange={vi.fn()} />,
    );

    expect(screen.getAllByText('…')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
  });
});
