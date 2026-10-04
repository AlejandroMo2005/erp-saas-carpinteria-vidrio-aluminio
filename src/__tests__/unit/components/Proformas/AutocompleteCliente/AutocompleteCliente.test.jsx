import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/presentation/api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '@/presentation/api/api';
import AutocompleteCliente from '@/presentation/components/Proformas/AutocompleteCliente/AutocompleteCliente';

const clientes = [
  {
    id: 1,
    nombre_completo: 'Juan Pérez',
    telefono: '0999999999',
    cedula_ruc: '1234567890',
  },
  {
    id: 2,
    nombre: 'María López',
    telefono: '0988888888',
    cedula_ruc: '',
  },
  {
    id: 3,
    nombre_completo: '',
    nombre: '',
  },
];

const baseProps = {
  value: '',
  onChange: vi.fn(),
  onSelect: vi.fn(),
  onClear: vi.fn(),
  clienteVinculado: null,
};

function renderAutocomplete(overrides = {}) {
  const props = {
    ...baseProps,
    onChange: vi.fn(),
    onSelect: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<AutocompleteCliente {...props} />),
    props,
  };
}

function ControlledAutocomplete(overrides = {}) {
  const [value, setValue] = useState(overrides.value ?? '');

  const props = {
    ...baseProps,
    ...overrides,
    value,
    onChange: (nextValue) => {
      overrides.onChange?.(nextValue);
      setValue(nextValue);
    },
  };

  return <AutocompleteCliente {...props} />;
}

function renderControlledAutocomplete(overrides = {}) {
  const props = {
    ...baseProps,
    onChange: vi.fn(),
    onSelect: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<ControlledAutocomplete {...props} />),
    props,
  };
}

async function ejecutarBusqueda(
  value = 'Juan',
  response = {
    data: {
      success: true,
      data: clientes,
    },
  },
) {
  api.get.mockResolvedValueOnce(response);

  let input = screen.queryByRole('combobox');

  if (!input) {
    renderControlledAutocomplete();
    input = screen.getByRole('combobox');
  }

  fireEvent.change(input, { target: { value } });

  await act(async () => {
    vi.advanceTimersByTime(350);
  });

  await act(async () => {});
}

describe('AutocompleteCliente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza el campo de cliente con atributos de combobox', () => {
    renderAutocomplete({ value: 'Juan' });

    const input = screen.getByRole('combobox');

    expect(input).toHaveValue('Juan');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('maxLength', '200');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('propaga el cambio del texto mediante onChange', () => {
    const { props } = renderAutocomplete();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Pedro' },
    });

    expect(props.onChange).toHaveBeenCalledWith('Pedro');
  });

  it('no busca cuando el valor está vacío o tiene menos de dos caracteres', () => {
    renderControlledAutocomplete();

    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: '' } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.change(input, { target: { value: 'A' } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(api.get).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('consulta clientes después del debounce', async () => {
    await ejecutarBusqueda('Juan');

    expect(api.get).toHaveBeenCalledWith(
      '/usuarios/buscar?q=Juan&limite=6',
    );
  });

  it('codifica correctamente el término de búsqueda', async () => {
    await ejecutarBusqueda('José Pérez');

    expect(api.get).toHaveBeenCalledWith(
      '/usuarios/buscar?q=Jos%C3%A9%20P%C3%A9rez&limite=6',
    );
  });

  it('muestra las sugerencias cuando la API responde correctamente', async () => {
    await ejecutarBusqueda();

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();
  });

  it('muestra teléfono y cédula/RUC disponibles', async () => {
    await ejecutarBusqueda();

    expect(screen.getByText('0999999999')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('0988888888')).toBeInTheDocument();
  });

  it('usa nombre cuando nombre_completo no existe', async () => {
    await ejecutarBusqueda('Maria', {
      data: {
        success: true,
        data: [{ id: 2, nombre: 'María López' }],
      },
    });

    expect(screen.getByText('María López')).toBeInTheDocument();
  });

  it('usa guion cuando no existe nombre_completo ni nombre', async () => {
    await ejecutarBusqueda('Cliente', {
      data: {
        success: true,
        data: [clientes[2]],
      },
    });

    expect(screen.getByRole('option')).toHaveTextContent('—');
  });

  it('no muestra el dropdown cuando la respuesta es exitosa pero no contiene clientes', async () => {
    await ejecutarBusqueda('Juan', {
      data: {
        success: true,
        data: [],
      },
    });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('maneja una respuesta exitosa sin data usando una lista vacía', async () => {
    await ejecutarBusqueda('Juan', {
      data: {
        success: true,
      },
    });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('maneja respuestas sin success sin mostrar sugerencias', async () => {
    await ejecutarBusqueda('Juan', {
      data: {
        success: false,
        data: clientes,
      },
    });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('maneja errores de la API limpiando las sugerencias', async () => {
    api.get.mockRejectedValueOnce(new Error('Error de red'));

    renderControlledAutocomplete();

    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'Juan' } });

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    await act(async () => {});

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('muestra el spinner mientras la búsqueda está pendiente', async () => {
    let resolver;

    api.get.mockReturnValueOnce(new Promise((resolve) => {
      resolver = resolve;
    }));

    renderControlledAutocomplete();

    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'Juan' } });

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(
      document.querySelector('.autocomplete-spinner'),
    ).toBeInTheDocument();

    await act(async () => {
      resolver({
        data: {
          success: true,
          data: clientes,
        },
      });
    });

    expect(
      document.querySelector('.autocomplete-spinner'),
    ).not.toBeInTheDocument();
  });

  it('selecciona un cliente mediante click y limpia las sugerencias', async () => {
    const { props } = renderControlledAutocomplete();

    await ejecutarBusqueda();

    fireEvent.mouseDown(screen.getByText('Juan Pérez'));

    expect(props.onSelect).toHaveBeenCalledWith(clientes[0]);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('navega hacia abajo y arriba con el teclado', async () => {
    await ejecutarBusqueda();

    const input = screen.getByRole('combobox');
    const options = screen.getAllByRole('option');

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[0]).toHaveClass('is-active');

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(options[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('selecciona la sugerencia activa con Enter', async () => {
    const { props } = renderControlledAutocomplete();

    await ejecutarBusqueda();

    const input = screen.getByRole('combobox');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(props.onSelect).toHaveBeenCalledWith(clientes[0]);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('cierra las sugerencias con Escape', async () => {
    await ejecutarBusqueda();

    const input = screen.getByRole('combobox');

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('ignora teclas de navegación cuando no hay sugerencias visibles', () => {
    const { props } = renderAutocomplete();

    const input = screen.getByRole('combobox');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('permite volver a mostrar sugerencias mediante focus', async () => {
    await ejecutarBusqueda();

    const input = screen.getByRole('combobox');

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.focus(input);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('cierra el dropdown al hacer click fuera del componente', async () => {
    await ejecutarBusqueda();

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('mantiene el dropdown al hacer click dentro del componente', async () => {
    await ejecutarBusqueda();

    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('muestra el cliente vinculado y permite desvincularlo', () => {
    const { props } = renderAutocomplete({
      value: 'Juan Pérez',
      clienteVinculado: {
        id: 1,
        nombre: 'Juan Pérez',
      },
    });

    expect(screen.getByText('✓ Registrado')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Desvincular cliente registrado',
      }),
    );

    expect(props.onClear).toHaveBeenCalledTimes(1);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('no realiza búsqueda cuando el valor coincide con el cliente vinculado', () => {
    renderAutocomplete({
      value: 'Juan Pérez',
      clienteVinculado: {
        id: 1,
        nombre: 'Juan Pérez',
      },
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(api.get).not.toHaveBeenCalled();
  });

  it('cancela una búsqueda pendiente cuando cambia el valor antes del debounce', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: clientes,
      },
    });

    renderControlledAutocomplete();

    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'Ju' } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.change(input, { target: { value: 'Juan' } });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(api.get).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    await act(async () => {});

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith(
      '/usuarios/buscar?q=Juan&limite=6',
    );
  });

  it('limpia el timeout al desmontarse', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = renderAutocomplete({
      value: 'Juan',
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
