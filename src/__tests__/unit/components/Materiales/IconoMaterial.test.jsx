import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import IconoMaterial from '../../../../presentation/components/Materiales/IconoMaterial/IconoMaterial';

describe('IconoMaterial', () => {
  it('renderiza el ícono de vidrio cuando el nombre contiene vidrio', () => {
    const { container } = render(
      <IconoMaterial nombre="Vidrio templado" colorHex="#000000" />,
    );

    expect(container.querySelector('rect')).toBeInTheDocument();
    expect(container.querySelector('path')).toHaveAttribute(
      'd',
      'M15 3v18M8 8l3 3',
    );
  });

  it('renderiza el ícono de vidrio cuando el nombre contiene espejo', () => {
    const { container } = render(
      <IconoMaterial nombre="Espejo decorativo" colorHex="#000000" />,
    );

    expect(container.querySelector('rect')).toBeInTheDocument();
  });

  it('renderiza el ícono de material cuando no es vidrio ni espejo', () => {
    const { container } = render(
      <IconoMaterial nombre="Aluminio" colorHex="#000000" />,
    );

    expect(container.querySelector('path')).toHaveAttribute(
      'd',
      'M21 8l-9-5-9 5v8l9 5 9-5V8zM3.3 7l8.7 5 8.7-5M12 22V12',
    );
    expect(container.querySelector('rect')).not.toBeInTheDocument();
  });

  it('usa un trazo oscuro para colores claros', () => {
    const { container } = render(
      <IconoMaterial nombre="Aluminio" colorHex="#ffffff" />,
    );

    expect(container.querySelector('svg')).toHaveAttribute('stroke', '#333333');
  });

  it('usa el color normalizado para colores oscuros', () => {
    const { container } = render(
      <IconoMaterial nombre="Aluminio" colorHex="#000000" />,
    );

    expect(container.querySelector('svg')).toHaveAttribute('stroke', '#000000');
  });
});
