import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalProveedor from '../../../../../../presentation/components/Facturacion/Proveedores/ModalProveedor/ModalProveedor';
import useModalProveedor from '../../../../../../presentation/components/Facturacion/Proveedores/ModalProveedor/useModalProveedor';

vi.mock(
  '../../../../../../presentation/components/Facturacion/Proveedores/ModalProveedor/useModalProveedor',
  () => ({
    default: vi.fn(),
  })
);

const baseHook = {
  esEdicion: false,
  form: {
    nombre: '',
    ciudad: '',
    telefono_whatsapp: '',
    email: '',
    notas: '',
  },
  cambiar: vi.fn(),
  materiales: [],
  seleccionados: [],
  toggleMaterial: vi.fn(),
  guardando: false,
  error: null,
  guardar: vi.fn(),
};

const crearProveedor = () => ({
  id: 10,
  nombre: 'Proveedor A',
  ciudad: 'Manta',
  telefono_whatsapp: '0991111111',
  email: 'proveedor@example.com',
  notas: 'Entrega semanal',
  materiales: [
    { id: 1, nombre: 'Vidrio 6mm' },
  ],
});

const crearHook = (overrides = {}) => ({
  ...baseHook,
  cambiar: vi.fn(),
  toggleMaterial: vi.fn(),
  guardar: vi.fn(),
  ...overrides,
});

describe('ModalProveedor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModalProveedor.mockReturnValue(crearHook());
  });

  it('muestra el formulario para nuevo proveedor', () => {
    render(
      <ModalProveedor
        proveedor={null}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nuevo proveedor' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del proveedor *')).toHaveValue('');
    expect(screen.getByLabelText(/Ciudad/)).toHaveValue('');
    expect(screen.getByLabelText(/WhatsApp/)).toHaveValue('');
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue('');
    expect(screen.getByLabelText(/Notas/)).toHaveValue('');
  });

  it('muestra el formulario para editar proveedor', () => {
    useModalProveedor.mockReturnValue(
      crearHook({
        esEdicion: true,
        form: {
          nombre: 'Proveedor A',
          ciudad: 'Manta',
          telefono_whatsapp: '0991111111',
          email: 'proveedor@example.com',
          notas: 'Entrega semanal',
        },
        materiales: [
          { id: 1, nombre: 'Vidrio 6mm', stock: 5 },
        ],
        seleccionados: [1],
      })
    );

    render(
      <ModalProveedor
        proveedor={crearProveedor()}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Editar proveedor' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del proveedor *')).toHaveValue('Proveedor A');
    expect(screen.getByLabelText(/Ciudad/)).toHaveValue('Manta');
    expect(screen.getByLabelText(/WhatsApp/)).toHaveValue('0991111111');
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue('proveedor@example.com');
    expect(screen.getByLabelText(/Notas/)).toHaveValue('Entrega semanal');
  });

  it('muestra un error cuando el hook lo proporciona', () => {
    useModalProveedor.mockReturnValue(
      crearHook({ error: 'No se pudieron cargar los materiales' })
    );

    render(
      <ModalProveedor
        proveedor={null}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los materiales'
    );
  });

  it('muestra los materiales y refleja los seleccionados', () => {
    useModalProveedor.mockReturnValue(
      crearHook({
        materiales: [
          { id: 1, nombre: 'Vidrio 6mm', stock: 5 },
          { id: 2, nombre: 'Aluminio', stock: 8 },
        ],
        seleccionados: [1],
      })
    );

    render(
      <ModalProveedor
        proveedor={null}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
      />
    );

    expect(screen.getByText('Vidrio 6mm')).toBeInTheDocument();
    expect(screen.getByText('Aluminio')).toBeInTheDocument();
    expect(screen.getByLabelText('Stock actual: 5')).toBeInTheDocument();
    expect(screen.getByLabelText('Stock actual: 8')).toBeInTheDocument();

    const checks = screen.getAllByRole('checkbox');
    expect(checks).toHaveLength(2);
    expect(checks[0]).toBeChecked();
    expect(checks[1]).not.toBeChecked();

  });

  it('permite cambiar los campos mediante el handler del hook', () => {
    const cambiar = vi.fn();

    useModalProveedor.mockReturnValue(crearHook({ cambiar }));

    render(
      <ModalProveedor
        proveedor={null}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
      />
    );

    const nombre = screen.getByRole('textbox', {
      name: 'Nombre del proveedor *',
    });
    fireEvent.change(nombre, { target: { name: 'nombre', value: 'Nuevo proveedor' } });

    expect(cambiar).toHaveBeenCalledTimes(1);

    const evento = cambiar.mock.calls[0][0];

    expect(evento.target).toBe(nombre);
    expect(evento.target.name).toBe('nombre');
  });

  it('llama a toggleMaterial al cambiar un material', () => {
    const toggleMaterial = vi.fn();

    useModalProveedor.mockReturnValue(
      crearHook({
        materiales: [{ id: 7, nombre: 'Aluminio', stock: 3 }],
        seleccionados: [],
        toggleMaterial,
      })
    );

    render(
      <ModalProveedor
        proveedor={null}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(toggleMaterial).toHaveBeenCalledTimes(1);
    expect(toggleMaterial).toHaveBeenCalledWith(7);
  });

  it('muestra el estado de guardado', () => {
    const guardar = vi.fn();

    useModalProveedor.mockReturnValue(
      crearHook({
        guardando: true,
        guardar,
      })
    );

    render(
      <ModalProveedor
        proveedor={null}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
      />
    );

    const boton = screen.getByRole('button', { name: /Guardando/ });

    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-busy', 'true');
    expect(guardar).not.toHaveBeenCalled();
  });

  it('llama a guardar al pulsar Guardar', () => {
    const guardar = vi.fn();

    useModalProveedor.mockReturnValue(crearHook({ guardar }));

    render(
      <ModalProveedor
        proveedor={null}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(guardar).toHaveBeenCalledTimes(1);
  });

  it('llama a onClose desde cerrar y cancelar', () => {
    const onClose = vi.fn();

    render(
      <ModalProveedor
        proveedor={null}
        onClose={onClose}
        onGuardado={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('muestra el mensaje cuando no hay materiales', () => {
    render(
      <ModalProveedor
        proveedor={null}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
      />
    );

    expect(
      screen.getByText('No hay materiales registrados')
    ).toBeInTheDocument();
  });
});
