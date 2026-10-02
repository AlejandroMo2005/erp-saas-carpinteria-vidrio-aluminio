import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: {
    rol: 'ADMIN',
    nombre: 'Administrador',
    telefono: '0999999999',
  },

  useProformas: vi.fn(),

  proformas: null,

  toasts: [],
  removeToast: vi.fn(),
  toastOk: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
  toastInfo: vi.fn(),

  sanitizar: vi.fn((value) => String(value ?? '').trim()),
}));

vi.mock('../../../../presentation/context/AuthContext', () => ({
  useAuth: () => ({
    user: mocks.user,
  }),
}));

vi.mock('../../../../presentation/components/Proformas/hooks/useProformas', () => ({
  useProformas: (...args) => {
    mocks.useProformas(...args);
    return mocks.proformas;
  },
}));

vi.mock('../../../../presentation/components/Proformas/Notificaciones/NotiProformas', () => ({
  useProformaToasts: () => ({
    toasts: mocks.toasts,
    remove: mocks.removeToast,
    ok: mocks.toastOk,
    error: mocks.toastError,
    warning: mocks.toastWarning,
    info: mocks.toastInfo,
  }),
  ProformaToastContainer: ({ toasts, onRemove }) => (
    <div data-testid="toast-container">
      <span data-testid="toast-count">{toasts.length}</span>
      <button type="button" onClick={() => onRemove('toast-1')}>
        Quitar toast
      </button>
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Proformas/AutocompleteCliente/AutocompleteCliente', () => ({
  default: ({ value, onChange, onSelect, onClear, clienteVinculado }) => (
    <div data-testid="autocomplete-cliente">
      <input
        aria-label="Cliente autocomplete"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => onSelect({
          id: 10,
          nombre_completo: 'Cliente Seleccionado',
          telefono: '0987654321',
        })}
      >
        Seleccionar cliente
      </button>
      <button type="button" onClick={onClear}>
        Desvincular cliente
      </button>
      {clienteVinculado && (
        <span data-testid="cliente-vinculado">Vinculado</span>
      )}
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Proformas/ItemTrabajo/ItemTrabajo', () => ({
  default: ({ item, idx, onUpdate, onRemove, puedeEliminar }) => (
    <div data-testid={`item-trabajo-${idx}`}>
      <span>{item.nombre_trabajo || `Trabajo ${idx + 1}`}</span>
      <button
        type="button"
        onClick={() => onUpdate(item.id, 'ancho', '2.5')}
      >
        Actualizar item
      </button>
      {puedeEliminar && (
        <button type="button" onClick={() => onRemove(item.id)}>
          Eliminar item
        </button>
      )}
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Proformas/utils/proformaUtils', () => ({
  sanitizar: (...args) => mocks.sanitizar(...args),
}));

import Proformas from '../../../../presentation/components/Proformas/Proformas';

function crearProformas(overrides = {}) {
  return {
    esCliente: false,
    esSistema: true,
    user: mocks.user,

    trabajos: [
      { id: 1, nombre: 'Ventana' },
      { id: 2, nombre: 'Puerta' },
    ],
    loadingTrabajos: false,

    coloresDB: [
      { id: 1, nombre: 'Natural' },
    ],
    loadingColores: false,

    mapaColores: {
      1: { hex: '#ffffff', nombre: 'Natural' },
    },

    cliente: 'Cliente Demo',
    setCliente: vi.fn(),
    telefono: '0999999999',
    setTelefono: vi.fn(),

    fecha: '2026-09-25',
    fechaAgendamiento: '',
    setFechaAgendamiento: vi.fn(),

    clienteVinculado: null,

    items: [
      {
        id: 'item-1',
        trabajo_id: 1,
        nombre_trabajo: 'Ventana',
        ancho: 1,
        alto: 2,
        cantidad: 1,
        color_id: 1,
        nombre_color: 'Natural',
        subtotal: 0,
        detalle: '',
      },
    ],

    handleAddItem: vi.fn(),
    handleRemoveItem: vi.fn(),
    handleUpdate: vi.fn(),

    handleSeleccionarCliente: vi.fn(),
    handleDesvincular: vi.fn(),

    calculando: false,
    agendando: false,

    resumen: {
      subtotal: 0,
      iva: 0,
      total: 0,
      iva_valor: 0.15,
    },

    calcularProforma: vi.fn(),
    enviarWhatsApp: vi.fn(),
    agendar: vi.fn(),

    ...overrides,
  };
}

describe('Proformas', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.user = {
      rol: 'ADMIN',
      nombre: 'Administrador',
      telefono: '0999999999',
    };

    mocks.proformas = crearProformas();
    mocks.toasts = [];
  });

  it('renderiza el encabezado de Proformas para usuarios del sistema', () => {
    render(<Proformas />);

    expect(screen.getByRole('heading', { name: 'Proformas' })).toBeInTheDocument();
    expect(screen.queryByText('Solicitar Presupuesto')).not.toBeInTheDocument();
  });

  it('renderiza el encabezado y banner para CLIENTE', () => {
    mocks.proformas = crearProformas({
      esCliente: true,
      esSistema: false,
      cliente: 'Cliente Demo',
      telefono: '0999999999',
    });

    render(<Proformas />);

    expect(
      screen.getByRole('heading', { name: 'Solicitar Presupuesto' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('status', {
        name: '',
      })
    ).toHaveTextContent('Completa los detalles de tu trabajo');
  });

  it('muestra el campo de cliente como autocomplete para usuarios del sistema', () => {
    render(<Proformas />);

    expect(screen.getByTestId('autocomplete-cliente')).toBeInTheDocument();
    expect(screen.getByLabelText('Cliente autocomplete')).toHaveValue('Cliente Demo');
  });

  it('muestra el nombre como campo de solo lectura para CLIENTE', () => {
    mocks.proformas = crearProformas({
      esCliente: true,
      esSistema: false,
    });

    render(<Proformas />);

    const input = screen.getByLabelText('Tu nombre (no editable)');

    expect(input).toHaveValue('Cliente Demo');
    expect(input).toHaveAttribute('readonly');
  });

  it('renderiza teléfono y fecha de agendamiento', () => {
    render(<Proformas />);

    expect(screen.getByLabelText('Teléfono')).toHaveValue('0999999999');
    expect(screen.getByLabelText('Fecha de agendamiento')).toHaveValue('');
  });

  it('actualiza el teléfono mediante el callback del hook', () => {
    render(<Proformas />);

    fireEvent.change(screen.getByLabelText('Teléfono'), {
      target: { value: '0988888888' },
    });

    expect(mocks.proformas.setTelefono).toHaveBeenCalledWith('0988888888');
  });

  it('actualiza la fecha de agendamiento mediante el callback del hook', () => {
    render(<Proformas />);

    fireEvent.change(screen.getByLabelText('Fecha de agendamiento'), {
      target: { value: '2026-10-01' },
    });

    expect(mocks.proformas.setFechaAgendamiento).toHaveBeenCalledWith('2026-10-01');
  });

  it('renderiza todos los trabajos recibidos por el hook', () => {
    mocks.proformas = crearProformas({
      items: [
        {
          id: 'item-1',
          nombre_trabajo: 'Ventana',
        },
        {
          id: 'item-2',
          nombre_trabajo: 'Puerta',
        },
      ],
    });

    render(<Proformas />);

    expect(screen.getByTestId('item-trabajo-0')).toHaveTextContent('Ventana');
    expect(screen.getByTestId('item-trabajo-1')).toHaveTextContent('Puerta');
  });

  it('permite agregar otro trabajo', () => {
    render(<Proformas />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Agregar otro trabajo a la proforma' })
    );

    expect(mocks.proformas.handleAddItem).toHaveBeenCalledTimes(1);
  });

  it('permite actualizar un trabajo desde ItemTrabajo', () => {
    render(<Proformas />);

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar item' }));

    expect(mocks.proformas.handleUpdate).toHaveBeenCalledWith(
      'item-1',
      'ancho',
      '2.5'
    );
  });

  it('permite eliminar un trabajo cuando existen varios', () => {
    mocks.proformas = crearProformas({
      items: [
        { id: 'item-1', nombre_trabajo: 'Ventana' },
        { id: 'item-2', nombre_trabajo: 'Puerta' },
      ],
    });

    render(<Proformas />);

    const primerItem = screen.getByTestId('item-trabajo-0');

    fireEvent.click(
      primerItem.querySelector('button:nth-of-type(2)')
    );

    expect(mocks.proformas.handleRemoveItem).toHaveBeenCalledWith('item-1');
  });

  it('muestra el resumen inicial con total cero', () => {
    render(<Proformas />);

    expect(screen.getByText('TOTAL ESTIMADO')).toBeInTheDocument();
    expect(screen.getByLabelText('Total: $0.00')).toBeInTheDocument();
    expect(screen.getByText('IVA 15%')).toBeInTheDocument();

    const valores = screen.getAllByText('$0.00');
    expect(valores).toHaveLength(3);
  });

  it('muestra Recalcular cuando ya existe un total', () => {
    mocks.proformas = crearProformas({
      resumen: {
        subtotal: 100,
        iva: 15,
        total: 115,
        iva_valor: 0.15,
      },
    });

    render(<Proformas />);

    expect(
      screen.getByRole('button', { name: 'Recalcular' })
    ).toBeInTheDocument();
  });

  it('ejecuta el cálculo de la proforma', () => {
    render(<Proformas />);

    fireEvent.click(screen.getByRole('button', { name: 'Calcular' }));

    expect(mocks.proformas.calcularProforma).toHaveBeenCalledTimes(1);
  });

  it('muestra Calculando y deshabilita el botón durante el cálculo', () => {
    mocks.proformas = crearProformas({
      calculando: true,
    });

    render(<Proformas />);

    const button = screen.getByRole('button', { name: 'Calculando…' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('muestra el botón de WhatsApp para usuarios del sistema', () => {
    render(<Proformas />);

    expect(
      screen.getByRole('button', { name: 'Enviar proforma por WhatsApp' })
    ).toBeInTheDocument();
  });

  it('deshabilita WhatsApp si falta teléfono o el total es cero', () => {
    mocks.proformas = crearProformas({
      telefono: '',
      resumen: {
        subtotal: 0,
        iva: 0,
        total: 0,
        iva_valor: 0.15,
      },
    });

    render(<Proformas />);

    expect(
      screen.getByRole('button', { name: 'Enviar proforma por WhatsApp' })
    ).toBeDisabled();
  });

  it('ejecuta enviarWhatsApp cuando está disponible', () => {
    mocks.proformas = crearProformas({
      resumen: {
        subtotal: 100,
        iva: 15,
        total: 115,
        iva_valor: 0.15,
      },
    });

    render(<Proformas />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Enviar proforma por WhatsApp' })
    );

    expect(mocks.proformas.enviarWhatsApp).toHaveBeenCalledTimes(1);
  });

  it('muestra Agendar Pedido para usuarios del sistema', () => {
    render(<Proformas />);

    expect(
      screen.getByRole('button', { name: 'Agendar Pedido' })
    ).toBeInTheDocument();
  });

  it('muestra Enviar Solicitud para CLIENTE', () => {
    mocks.proformas = crearProformas({
      esCliente: true,
      esSistema: false,
    });

    render(<Proformas />);

    expect(
      screen.getByRole('button', { name: 'Enviar Solicitud' })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Enviar proforma por WhatsApp' })
    ).not.toBeInTheDocument();
  });

  it('ejecuta agendar', () => {
    render(<Proformas />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Agendar Pedido' })
    );

    expect(mocks.proformas.agendar).toHaveBeenCalledTimes(1);
  });

  it('muestra Enviando y deshabilita agendar mientras se procesa', () => {
    mocks.proformas = crearProformas({
      agendando: true,
    });

    render(<Proformas />);

    const button = screen.getByRole('button', { name: 'Enviando…' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('muestra el cliente vinculado y permite seleccionarlo', () => {
    mocks.proformas = crearProformas({
      clienteVinculado: {
        id: 7,
        nombre: 'Cliente Registrado',
      },
    });

    render(<Proformas />);

    expect(screen.getByTestId('cliente-vinculado')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Seleccionar cliente' })
    );

    expect(mocks.proformas.handleSeleccionarCliente).toHaveBeenCalledWith({
      id: 10,
      nombre_completo: 'Cliente Seleccionado',
      telefono: '0987654321',
    });
  });

  it('conecta la selección y desvinculación del autocomplete con el hook', () => {
    render(<Proformas />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Seleccionar cliente' })
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Desvincular cliente' })
    );

    expect(screen.getByTestId('autocomplete-cliente')).toBeInTheDocument();
  });

  it('renderiza el contador de notificaciones y permite quitarlas', () => {
    mocks.toasts = [
      { id: 'toast-1', type: 'success', message: 'Correcto' },
    ];

    render(<Proformas />);

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: 'Quitar toast' }));

    expect(mocks.removeToast).toHaveBeenCalledWith('toast-1');
  });

  it('pasa onAgendar al hook', () => {
    const onAgendar = vi.fn();

    render(<Proformas onAgendar={onAgendar} />);

    expect(mocks.useProformas).toHaveBeenCalledWith(
      expect.objectContaining({
        onAgendar,
        toastOk: mocks.toastOk,
        toastError: mocks.toastError,
        toastWarning: mocks.toastWarning,
        toastInfo: mocks.toastInfo,
      })
    );
  });
});
