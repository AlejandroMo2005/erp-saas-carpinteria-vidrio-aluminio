import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectorCliente from '../../../../../../presentation/components/Facturacion/Componentes/SelectorCliente/SelectorCliente';
import useSelectorCliente from '../../../../../../presentation/components/Facturacion/Componentes/SelectorCliente/useSelectorCliente';

vi.mock(
  '../../../../../../presentation/components/Facturacion/Componentes/SelectorCliente/useSelectorCliente',
  () => ({
    default: vi.fn(),
  })
);

const crearEstadoHook = (overrides = {}) => ({
  modo: 'buscar',
  setModo: vi.fn(),
  query: '',
  resultados: [],
  buscando: false,
  mostrarLista: false,
  focusedIndex: -1,
  errorBusqueda: null,
  nuevoCliente: {
    nombre: '',
    telefono: '',
    identificacion: '',
    tipo_identificacion: 'CONSUMIDOR_FINAL',
    direccion: '',
    email: '',
  },
  erroresForm: {},
  guardando: false,
  inputRef: { current: null },
  listRef: { current: null },
  handleQueryChange: vi.fn(),
  handleKeyDown: vi.fn(),
  handleSeleccionar: vi.fn(),
  handleLimpiar: vi.fn(),
  handleGuardarCliente: vi.fn(),
  handleCampoNuevo: vi.fn(),
  cancelarCreacion: vi.fn(),
  ...overrides,
});

describe('SelectorCliente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSelectorCliente.mockReturnValue(crearEstadoHook());
  });

  it('renderiza el modo buscar por defecto', () => {
    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /buscar cliente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo cliente/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /buscar cliente/i })).toBeInTheDocument();
  });

  it('cambia al modo crear al pulsar Nuevo cliente', () => {
    const setModo = vi.fn();

    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        setModo,
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /nuevo cliente/i })
    );

    expect(setModo).toHaveBeenCalledWith('crear');
  });

  it('cambia al modo buscar al pulsar Buscar cliente', () => {
    const setModo = vi.fn();

    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        modo: 'crear',
        setModo,
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /buscar cliente/i })
    );

    expect(setModo).toHaveBeenCalledWith('buscar');
  });

  it('muestra el cliente seleccionado', () => {
    const handleLimpiar = vi.fn();

    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        handleLimpiar,
      })
    );

    render(
      <SelectorCliente
        clienteSeleccionado={{
          id: 1,
          nombre: 'Juan Pérez',
          tipo_identificacion: 'CEDULA',
          identificacion: '1710034065',
          telefono: '0991234567',
        }}
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('CEDULA: 1710034065')).toBeInTheDocument();
    expect(screen.getByText('0991234567')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /quitar cliente seleccionado/i })
    );

    expect(handleLimpiar).toHaveBeenCalledTimes(1);
  });

  it('muestra el spinner mientras busca clientes', () => {
    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        buscando: true,
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    expect(document.querySelector('.sc-buscar__spinner')).toBeInTheDocument();
  });

  it('muestra el error de búsqueda', () => {
    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        errorBusqueda: 'No se pudo conectar',
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo conectar');
  });

  it('renderiza los resultados de búsqueda', () => {
    const handleSeleccionar = vi.fn();

    const clientes = [
      {
        id: 1,
        nombre: 'Juan Pérez',
        telefono: '0991234567',
        identificacion: '1710034065',
      },
      {
        id: 2,
        nombre: 'María López',
        telefono: '0987654321',
      },
    ];

    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        resultados: clientes,
        mostrarLista: true,
        handleSeleccionar,
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();
    expect(screen.getByText(/0991234567 · 1710034065/)).toBeInTheDocument();
    expect(screen.getByText('0987654321')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Juan Pérez'));

    expect(handleSeleccionar).toHaveBeenCalledWith(clientes[0]);
  });

  it('marca el resultado enfocado y configura aria-activedescendant', () => {
    const clientes = [
      {
        id: 1,
        nombre: 'Juan Pérez',
        telefono: '0991234567',
        identificacion: '1710034065',
      },
      {
        id: 2,
        nombre: 'María López',
        telefono: '0987654321',
      },
    ];

    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        resultados: clientes,
        mostrarLista: true,
        focusedIndex: 1,
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /buscar cliente/i });
    const opciones = screen.getAllByRole('option');

    expect(input).toHaveAttribute('aria-activedescendant', 'sc-option-1');
    expect(opciones[1]).toHaveClass('sc-lista__item--focused');
    expect(opciones[0]).not.toHaveClass('sc-lista__item--focused');
  });

  it('muestra mensaje cuando la búsqueda no tiene resultados', () => {
    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        mostrarLista: true,
        resultados: [],
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Sin resultados — prueba con otro nombre o crea el cliente/i)
    ).toBeInTheDocument();
  });

  it('envía el cambio del campo de búsqueda al hook', () => {
    const handleQueryChange = vi.fn();

    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        handleQueryChange,
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /buscar cliente/i });

    fireEvent.change(input, {
      target: { value: 'Juan' },
    });

    expect(handleQueryChange).toHaveBeenCalledTimes(1);

    const evento = handleQueryChange.mock.calls[0][0];

    expect(evento).toBeDefined();
    expect(evento.target).toBe(input);
  });

  it('envía el evento de teclado al hook', () => {
    const handleKeyDown = vi.fn();

    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        handleKeyDown,
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /buscar cliente/i });

    fireEvent.keyDown(input, {
      key: 'ArrowDown',
    });

    expect(handleKeyDown).toHaveBeenCalledTimes(1);
    expect(handleKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'ArrowDown',
      })
    );
  });


  it('renderiza el formulario de nuevo cliente', () => {
    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        modo: 'crear',
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    expect(
      screen.getByRole('form', { name: /formulario nuevo cliente/i })
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/nombre \/ razón social/i))
      .toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i))
      .toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de identificación/i))
      .toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i))
      .toBeInTheDocument();
    expect(screen.getByLabelText(/dirección/i))
      .toBeInTheDocument();

    expect(screen.getByRole('button', { name: /crear cliente/i }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i }))
      .toBeInTheDocument();
  });


  it('envía los cambios de los campos del nuevo cliente al hook', () => {
    const handleCampoNuevo = vi.fn();

    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        modo: 'crear',
        handleCampoNuevo,
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    const nombre = screen.getByLabelText(/nombre/i);

    fireEvent.change(nombre, {
      target: {
        name: 'nombre',
        value: 'Juan Pérez',
      },
    });

    expect(handleCampoNuevo).toHaveBeenCalledTimes(1);
    expect(handleCampoNuevo).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          name: 'nombre',
        }),
      })
    );
  });

  it('envía el formulario al hook para guardar el cliente', () => {
    const handleGuardarCliente = vi.fn((e) => e.preventDefault());

    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        modo: 'crear',
        handleGuardarCliente,
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /crear cliente/i })
    );

    expect(handleGuardarCliente).toHaveBeenCalledTimes(1);
  });

  it('muestra los errores del formulario', () => {
    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        modo: 'crear',
        erroresForm: {
          general: 'Error general',
          nombre: 'El nombre es obligatorio',
          telefono: 'El teléfono es obligatorio',
          email: 'Correo electrónico inválido',
        },
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    expect(screen.getByText('Error general')).toBeInTheDocument();
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('El teléfono es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('Correo electrónico inválido'))
      .toBeInTheDocument();
  });


  it('muestra el error de identificación y el estado guardando', () => {
    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        modo: 'crear',
        guardando: true,
        erroresForm: {
          identificacion: 'La identificación no es válida',
        },
        nuevoCliente: {
          nombre: 'Juan Pérez',
          telefono: '0991234567',
          identificacion: '1710034065',
          tipo_identificacion: 'CEDULA',
          direccion: '',
          email: '',
        },
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    const identificacion = screen.getByLabelText(/cédula/i);
    const guardar = screen.getByRole('button', { name: /guardando/i });
    const cancelar = screen.getByRole('button', { name: /cancelar/i });

    expect(identificacion).toHaveClass('sc-form__input--error');
    expect(screen.getByText('La identificación no es válida')).toBeInTheDocument();
    expect(guardar).toBeDisabled();
    expect(guardar).toHaveTextContent('Guardando...');
    expect(cancelar).toBeDisabled();
  });

  it('cancela la creación del cliente', () => {
    const cancelarCreacion = vi.fn();

    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        modo: 'crear',
        cancelarCreacion,
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /cancelar/i })
    );

    expect(cancelarCreacion).toHaveBeenCalledTimes(1);
  });


  it('muestra el campo de identificación según el tipo seleccionado', () => {
    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        modo: 'crear',
        nuevoCliente: {
          nombre: '',
          telefono: '',
          identificacion: '',
          tipo_identificacion: 'CEDULA',
          direccion: '',
          email: '',
        },
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    const identificacion = screen.getByLabelText(/cédula/i);

    expect(identificacion).toBeInTheDocument();
    expect(identificacion).toHaveAttribute('name', 'identificacion');
    expect(identificacion).toHaveAttribute('maxlength', '10');
    expect(identificacion).toHaveAttribute(
      'placeholder',
      'Ej: 1712345678'
    );
  });


  it('configura correctamente el campo para RUC', () => {
    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        modo: 'crear',
        nuevoCliente: {
          nombre: '',
          telefono: '',
          identificacion: '',
          tipo_identificacion: 'RUC',
          direccion: '',
          email: '',
        },
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    const identificacion = screen.getByLabelText(/ruc/i);

    expect(identificacion).toHaveAttribute('maxlength', '13');
    expect(identificacion).toHaveAttribute(
      'placeholder',
      'Ej: 1234567890001'
    );
  });

  it('configura correctamente el campo para pasaporte', () => {
    useSelectorCliente.mockReturnValue(
      crearEstadoHook({
        modo: 'crear',
        nuevoCliente: {
          nombre: '',
          telefono: '',
          identificacion: '',
          tipo_identificacion: 'PASAPORTE',
          direccion: '',
          email: '',
        },
      })
    );

    render(
      <SelectorCliente
        onSeleccionar={vi.fn()}
        onLimpiar={vi.fn()}
      />
    );

    const identificacion = screen.getByLabelText(/pasaporte/i);

    expect(identificacion).toHaveAttribute(
      'placeholder',
      'Número de pasaporte'
    );
    expect(identificacion).toHaveAttribute('maxlength', '20');
  });

});
