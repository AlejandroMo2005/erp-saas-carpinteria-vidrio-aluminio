import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: { rol: 'ADMIN' },

  usePedidos: vi.fn(),
  useActualizarEstadoPedido: vi.fn(),

  usePedidosFiltros: vi.fn(),

  usePedidoToasts: vi.fn(),
  PedidoToastContainer: vi.fn(),

  queryData: [],

  queryClient: {
    setQueryData: vi.fn((key, updater) => {
      const oldData = mocks.queryData ?? [];
      mocks.queryData = typeof updater === 'function'
        ? updater(oldData)
        : updater;
      return mocks.queryData;
    }),
    invalidateQueries: vi.fn(),
  },

  actualizarEstado: {
    mutateAsync: vi.fn(),
  },

  cargarPedidos: vi.fn(),

  setFiltroEstado: vi.fn(),
  setFiltroPeriodo: vi.fn(),

  toastOk: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
  removeToast: vi.fn(),

  setPedidoSeleccionado: vi.fn(),
}));

vi.mock('../../../../presentation/context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useQueryClient: () => mocks.queryClient,
  };
});

vi.mock('../../../../presentation/hooks/usePedidos', () => ({
  usePedidos: mocks.usePedidos,
  useActualizarEstadoPedido: mocks.useActualizarEstadoPedido,
  pedidosKeys: {
    list: vi.fn((params) => ['pedidos', 'list', params]),
    lists: vi.fn(() => ['pedidos', 'lists']),
  },
}));

vi.mock('../../../../presentation/components/Pedidos/hooks/usePedidosFiltros', () => ({
  usePedidosFiltros: mocks.usePedidosFiltros,
}));

vi.mock('../../../../presentation/components/Pedidos/Notificaciones/NotiPedidos', () => ({
  usePedidoToasts: mocks.usePedidoToasts,
  PedidoToastContainer: (props) => (
    <div data-testid="toast-container">
      {props.toasts.length}
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Pedidos/FiltrosBar/FiltrosBar', () => ({
  default: (props) => (
    <div data-testid="filtros-bar">
      <span data-testid="filtros-admin">{String(props.esAdmin)}</span>
      <span data-testid="filtros-cliente">{String(props.esCliente)}</span>

      <button onClick={() => props.setFiltroEstado('pendientes')}>
        Cambiar filtro estado
      </button>

      <button onClick={() => props.setFiltroPeriodo('semana')}>
        Cambiar filtro periodo
      </button>
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Pedidos/PedidoCard/PedidoCard', () => ({
  default: ({ pedido, onVerDetalle, onCambiarEstado, cambiando, soloLectura }) => (
    <div data-testid={`pedido-card-${pedido.id}`}>
      <span>{pedido.cliente}</span>
      <span data-testid={`estado-${pedido.id}`}>{pedido.estado}</span>
      <span data-testid={`cambiando-${pedido.id}`}>{String(cambiando)}</span>
      <span data-testid={`solo-lectura-${pedido.id}`}>{String(soloLectura)}</span>

      <button onClick={() => onVerDetalle(pedido)}>
        Ver detalle {pedido.id}
      </button>

      <button onClick={() => onCambiarEstado(pedido.id, 'ENTREGADO')}>
        Entregar {pedido.id}
      </button>

      <button onClick={() => onCambiarEstado(pedido.id, 'CANCELADO')}>
        Cancelar {pedido.id}
      </button>

      <button onClick={() => onCambiarEstado(pedido.id, 'PENDIENTE')}>
        Transición inválida {pedido.id}
      </button>
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Pedidos/VisualizadorModal', () => ({
  default: ({ pedido, onClose }) => (
    <div data-testid="visualizador-modal">
      <span>Visualizando {pedido.id}</span>
      <button onClick={onClose}>Cerrar visualizador</button>
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Pedidos/Notificaciones/NotiPedidos', () => ({
  usePedidoToasts: mocks.usePedidoToasts,
  PedidoToastContainer: ({ toasts }) => (
    <div data-testid="toast-container">{toasts.length}</div>
  ),
}));

import Pedidos from '../../../../presentation/components/Pedidos/Pedidos';

const pedidoPendiente = {
  id: 1,
  cliente: 'Cliente Uno',
  estado: 'PENDIENTE',
  fecha: new Date().toISOString(),
};

const pedidoEntregado = {
  id: 2,
  cliente: 'Cliente Dos',
  estado: 'ENTREGADO',
  fecha: new Date().toISOString(),
};

function configurarFiltros(overrides = {}) {
  const defaults = {
    filtroEstado: 'activos',
    setFiltroEstado: mocks.setFiltroEstado,
    filtroPeriodo: 'mes',
    setFiltroPeriodo: mocks.setFiltroPeriodo,
    pedidosFiltrados: [],
    contadores: {
      activos: 0,
      pendientes: 0,
      entregados: 0,
      cancelados: 0,
      todos: 0,
    },
    mensajeVacio: 'No hay pedidos activos en "este mes".',
  };

  mocks.usePedidosFiltros.mockReturnValue({
    ...defaults,
    ...overrides,
  });
}

function configurarPedidos(overrides = {}) {
  mocks.usePedidos.mockReturnValue({
    data: [],
    isLoading: false,
    refetch: mocks.cargarPedidos,
    ...overrides,
  });
}

function configurarToasts() {
  mocks.usePedidoToasts.mockReturnValue({
    toasts: [],
    remove: mocks.removeToast,
    ok: mocks.toastOk,
    error: mocks.toastError,
    warning: mocks.toastWarning,
  });
}

function renderPedidos() {
  return render(<Pedidos />);
}

describe('Pedidos', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.user = { rol: 'ADMIN' };

    mocks.actualizarEstado.mutateAsync.mockResolvedValue({});

    configurarPedidos();
    configurarFiltros();
    configurarToasts();
    mocks.useActualizarEstadoPedido.mockReturnValue(mocks.actualizarEstado);
  });

  it('renderiza el encabezado de gestión para ADMIN', () => {
    renderPedidos();

    expect(
      screen.getByRole('heading', { name: 'Gestión de Pedidos' }),
    ).toBeInTheDocument();

    expect(screen.getByTestId('filtros-admin')).toHaveTextContent('true');
    expect(screen.getByTestId('filtros-cliente')).toHaveTextContent('false');
  });

  it('renderiza el encabezado Mis Pedidos para CLIENTE', () => {
    mocks.user = { rol: 'CLIENTE' };

    configurarFiltros({
      mensajeVacio: 'Aún no tienes pedidos. Ve a "Mis Proformas" para solicitar un presupuesto.',
    });

    renderPedidos();

    expect(
      screen.getByRole('heading', { name: 'Mis Pedidos' }),
    ).toBeInTheDocument();

    expect(screen.getByTestId('filtros-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('filtros-cliente')).toHaveTextContent('true');
  });

  it('muestra el estado de carga cuando no hay pedidos cargados', () => {
    configurarPedidos({
      data: [],
      isLoading: true,
    });

    renderPedidos();

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('muestra la lista vacía cuando termina la carga sin resultados', () => {
    configurarPedidos({
      data: [],
      isLoading: false,
    });

    configurarFiltros({
      pedidosFiltrados: [],
      mensajeVacio: 'No hay pedidos pendientes.',
    });

    renderPedidos();

    expect(screen.getByRole('status')).toHaveTextContent(
      'No hay pedidos pendientes.',
    );
  });

  it('no muestra estado vacío mientras carga si ya existen pedidos', () => {
    configurarPedidos({
      data: [pedidoPendiente],
      isLoading: true,
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente],
    });

    renderPedidos();

    expect(screen.queryByText('Cargando…')).not.toBeInTheDocument();
    expect(screen.getByTestId('pedido-card-1')).toBeInTheDocument();
  });

  it('renderiza las tarjetas filtradas y sus estados iniciales', () => {
    configurarPedidos({
      data: [pedidoPendiente, pedidoEntregado],
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente, pedidoEntregado],
    });

    renderPedidos();

    expect(screen.getByTestId('pedido-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('pedido-card-2')).toBeInTheDocument();

    expect(screen.getByTestId('estado-1')).toHaveTextContent('PENDIENTE');
    expect(screen.getByTestId('estado-2')).toHaveTextContent('ENTREGADO');
    expect(screen.getByTestId('solo-lectura-1')).toHaveTextContent('false');
  });

  it('permite recargar la lista', () => {
    renderPedidos();

    fireEvent.click(
      screen.getByRole('button', { name: 'Recargar lista de pedidos' }),
    );

    expect(mocks.cargarPedidos).toHaveBeenCalledTimes(1);
  });

  it('deshabilita la recarga mientras está cargando', () => {
    configurarPedidos({ isLoading: true });

    renderPedidos();

    expect(
      screen.getByRole('button', { name: 'Recargar lista de pedidos' }),
    ).toBeDisabled();
  });

  it('permite cambiar los filtros desde FiltrosBar', () => {
    renderPedidos();

    fireEvent.click(
      screen.getByRole('button', { name: 'Cambiar filtro estado' }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Cambiar filtro periodo' }),
    );

    expect(mocks.setFiltroEstado).toHaveBeenCalledWith('pendientes');
    expect(mocks.setFiltroPeriodo).toHaveBeenCalledWith('semana');
  });

  it('abre y cierra el visualizador del pedido seleccionado', () => {
    configurarPedidos({
      data: [pedidoPendiente],
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente],
    });

    renderPedidos();

    fireEvent.click(
      screen.getByRole('button', { name: 'Ver detalle 1' }),
    );

    expect(screen.getByTestId('visualizador-modal')).toBeInTheDocument();
    expect(screen.getByText('Visualizando 1')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar visualizador' }),
    );

    expect(
      screen.queryByTestId('visualizador-modal'),
    ).not.toBeInTheDocument();
  });

  it('actualiza correctamente un pedido a ENTREGADO', async () => {
    configurarPedidos({
      data: [pedidoPendiente],
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente],
    });

    renderPedidos();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Entregar 1' }),
      );
    });

    expect(mocks.queryClient.setQueryData).toHaveBeenCalled();

    expect(mocks.actualizarEstado.mutateAsync).toHaveBeenCalledWith({
      id: 1,
      estado: 'ENTREGADO',
    });

    expect(mocks.toastOk).toHaveBeenCalledWith(
      'Pedido #1 entregado correctamente.',
    );
  });

  it('actualiza correctamente un pedido a CANCELADO', async () => {
    configurarPedidos({
      data: [pedidoPendiente],
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente],
    });

    renderPedidos();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Cancelar 1' }),
      );
    });

    expect(mocks.actualizarEstado.mutateAsync).toHaveBeenCalledWith({
      id: 1,
      estado: 'CANCELADO',
    });

    expect(mocks.toastOk).toHaveBeenCalledWith(
      'Pedido #1 cancelado.',
    );
  });

  it('rechaza el cambio de estado para un cliente', async () => {
    mocks.user = { rol: 'CLIENTE' };

    configurarPedidos({
      data: [pedidoPendiente],
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente],
    });

    renderPedidos();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Entregar 1' }),
      );
    });

    expect(mocks.actualizarEstado.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.queryClient.setQueryData).not.toHaveBeenCalled();
  });

  it('muestra error cuando el pedido no existe', async () => {
    configurarPedidos({
      data: [],
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente],
    });

    renderPedidos();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Entregar 1' }),
      );
    });

    expect(mocks.toastError).toHaveBeenCalledWith(
      'Pedido no encontrado.',
    );

    expect(mocks.actualizarEstado.mutateAsync).not.toHaveBeenCalled();
  });

  it('rechaza una transición de estado no permitida', async () => {
    configurarPedidos({
      data: [pedidoPendiente],
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente],
    });

    renderPedidos();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Transición inválida 1' }),
      );
    });

    expect(mocks.toastWarning).toHaveBeenCalledWith(
      'No se puede cambiar de PENDIENTE a PENDIENTE.',
    );

    expect(mocks.actualizarEstado.mutateAsync).not.toHaveBeenCalled();
  });

  it('revierte el cambio optimista y muestra error 409', async () => {
    mocks.actualizarEstado.mutateAsync.mockRejectedValue({
      response: { status: 409 },
    });

    configurarPedidos({
      data: [pedidoPendiente],
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente],
    });

    renderPedidos();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Entregar 1' }),
      );
    });

    expect(mocks.queryClient.setQueryData).toHaveBeenCalledTimes(2);
    expect(mocks.queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['pedidos', 'lists'],
    });

    expect(mocks.toastError).toHaveBeenCalledWith(
      'El pedido #1 fue modificado por otro usuario.',
    );
  });

  it('revierte el cambio optimista y muestra error 403', async () => {
    mocks.actualizarEstado.mutateAsync.mockRejectedValue({
      response: { status: 403 },
    });

    configurarPedidos({
      data: [pedidoPendiente],
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente],
    });

    renderPedidos();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Entregar 1' }),
      );
    });

    expect(mocks.toastError).toHaveBeenCalledWith(
      'Sin permisos para cambiar el estado.',
    );
  });

  it('revierte el cambio optimista y muestra error genérico', async () => {
    mocks.actualizarEstado.mutateAsync.mockRejectedValue(
      new Error('Fallo de conexión'),
    );

    configurarPedidos({
      data: [pedidoPendiente],
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente],
    });

    renderPedidos();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Entregar 1' }),
      );
    });

    expect(mocks.toastError).toHaveBeenCalledWith(
      'No se pudo actualizar el pedido #1: Fallo de conexión',
    );
  });

  it('restaura cambiando a false después de completar una actualización', async () => {
    let resolver;

    mocks.actualizarEstado.mutateAsync.mockImplementation(
      () => new Promise((resolve) => {
        resolver = resolve;
      }),
    );

    configurarPedidos({
      data: [pedidoPendiente],
    });

    configurarFiltros({
      pedidosFiltrados: [pedidoPendiente],
    });

    renderPedidos();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Entregar 1' }),
      );
    });

    expect(screen.getByTestId('cambiando-1')).toHaveTextContent('true');

    await act(async () => {
      resolver({});
    });

    await waitFor(() => {
      expect(screen.getByTestId('cambiando-1')).toHaveTextContent('false');
    });
  });
});
