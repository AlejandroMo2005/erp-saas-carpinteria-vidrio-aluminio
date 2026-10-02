import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: { rol: 'ADMIN' },
  rawData: [],
  materialHook: {},
  filtros: {},
  actions: {},
  queryClient: {},
  pushToast: vi.fn(),
  removeToast: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mocks.queryClient,
}));

vi.mock('../../../../presentation/context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('../../../../presentation/hooks/useMateriales', () => ({
  useMaterialesConColores: () => mocks.materialHook,
  useActualizarVariante: () => mocks.actualizarVariante,
}));

vi.mock('../../../../presentation/components/Materiales/Notificaciones/NotiMateriales', () => ({
  useToasts: () => ({
    toasts: [],
    push: mocks.pushToast,
    remove: mocks.removeToast,
  }),
  ToastContainer: ({ toasts, onRemove }) => (
    <div data-testid="toast-container">
      <button onClick={() => onRemove('toast-1')}>remove-toast</button>
      <span>{toasts.length}</span>
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Materiales/hooks/useMaterialesFiltros', () => ({
  useMaterialesFiltros: () => mocks.filtros,
}));

vi.mock('../../../../presentation/components/Materiales/hooks/useMaterialesActions', () => ({
  useMaterialesActions: (args) => {
    mocks.actionsArgs = args;
    return mocks.actions;
  },
}));

vi.mock('../../../../presentation/components/Materiales/Buscador/Buscador', () => ({
  default: ({ busqueda, setBusqueda, gruposFiltrados, busquedaDebounced }) => (
    <div data-testid="buscador">
      <input
        aria-label="buscador-test"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
      <span>{gruposFiltrados.length}</span>
      <span>{busquedaDebounced}</span>
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Materiales/Paginacion/Paginacion', () => ({
  default: ({ pagina, totalPaginas, onChange }) => (
    <div data-testid="paginacion">
      <span>{pagina}</span>
      <span>{totalPaginas}</span>
      <button onClick={() => onChange(2)}>page-2</button>
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Materiales/MatCard/MatCardAdmin', () => ({
  default: ({ cardKey, onSeleccionar, onCampo, onGuardar, guardando }) => (
    <div data-testid={`admin-card-${cardKey}`}>
      <button onClick={() => onSeleccionar(cardKey, { variante_id: 2 })}>select</button>
      <button onClick={() => onCampo(cardKey, 'stock', '10')}>field</button>
      <button onClick={() => onGuardar(cardKey)}>save</button>
      <span>{String(guardando)}</span>
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Materiales/MatCard/MatCardVendedor', () => ({
  default: ({ cardKey, onSeleccionar }) => (
    <div data-testid={`vendor-card-${cardKey}`}>
      <button onClick={() => onSeleccionar(cardKey, { variante_id: 2 })}>
        select
      </button>
    </div>
  ),
}));

vi.mock('../../../../presentation/components/Materiales/MatCard/SkeletonCard', () => ({
  default: () => <div data-testid="skeleton-card" />,
}));

import Materiales from '../../../../presentation/components/Materiales/Materiales';

function configurar({
  rol = 'ADMIN',
  loading = false,
  error = false,
  gruposFiltrados = [],
  gruposPagina = [],
  seleccionEfectiva = {},
  editandoEfectivo = {},
  guardando = {},
  pagina = 1,
  totalPaginas = 1,
  busqueda = '',
  busquedaDebounced = '',
} = {}) {
  mocks.user = { rol };
  mocks.materialHook = {
    data: mocks.rawData,
    isLoading: loading,
    isError: error,
    refetch: mocks.refetch,
  };

  mocks.filtros = {
    grupos: [],
    gruposFiltrados,
    gruposPagina,
    totalPaginas,
    busqueda,
    setBusqueda: vi.fn(),
    busquedaDebounced,
    pagina,
    setPagina: vi.fn(),
  };

  mocks.actions = {
    seleccionEfectiva,
    editandoEfectivo,
    guardando,
    handleSeleccionar: vi.fn(),
    handleCampo: vi.fn(),
    handleGuardar: vi.fn(),
  };

  mocks.queryClient = {};
}

describe('Materiales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configurar();
  });

  it('renderiza el encabezado de administrador', () => {
    render(<Materiales />);

    expect(
      screen.getByRole('heading', { name: 'Inventario de Materiales' }),
    ).toBeInTheDocument();
  });

  it('renderiza modo consulta para vendedor', () => {
    configurar({ rol: 'VENDEDOR' });

    render(<Materiales />);

    expect(
      screen.getByRole('heading', { name: 'Consulta de Stock' }),
    ).toBeInTheDocument();

    expect(
      screen.getByText('📋 Modo consulta — solo puedes ver stock y precios'),
    ).toBeInTheDocument();
  });

  it('renderiza seis SkeletonCard durante la carga', () => {
    configurar({ loading: true });

    render(<Materiales />);

    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(6);
    expect(screen.getByRole('main').querySelector('#inv-grid'))
      .toHaveAttribute('aria-busy', 'true');
  });

  it('renderiza error y permite reintentar', () => {
    configurar({ error: true });

    render(<Materiales />);

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent('No se pudo cargar el inventario');

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('renderiza estado vacío sin búsqueda', () => {
    configurar({ gruposFiltrados: [], gruposPagina: [] });

    render(<Materiales />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'No se encontraron materiales.',
    );
  });

  it('renderiza estado vacío con búsqueda', () => {
    configurar({
      gruposFiltrados: [],
      gruposPagina: [],
      busquedaDebounced: 'aluminio',
    });

    render(<Materiales />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'No se encontraron materiales para "aluminio".',
    );
  });

  it('renderiza tarjetas de administrador activas', () => {
    const activo = {
      material_id: 1,
      variante_id: 10,
      nombre_material: 'Aluminio',
    };

    configurar({
      gruposFiltrados: [['aluminio', [activo]]],
      gruposPagina: [['aluminio', [activo]]],
      seleccionEfectiva: { aluminio: activo },
      editandoEfectivo: { aluminio: { stock: 5, precio: 10 } },
      guardando: { aluminio: true },
      totalPaginas: 2,
    });

    render(<Materiales />);

    expect(screen.getByTestId('admin-card-aluminio')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('omite grupos sin selección efectiva', () => {
    const activo = {
      material_id: 1,
      variante_id: 10,
      nombre_material: 'Aluminio',
    };

    configurar({
      gruposFiltrados: [['aluminio', [activo]]],
      gruposPagina: [['aluminio', [activo]]],
      seleccionEfectiva: {},
    });

    render(<Materiales />);

    expect(
      screen.queryByTestId('admin-card-aluminio'),
    ).not.toBeInTheDocument();
  });

  it('renderiza tarjeta de vendedor', () => {
    const activo = {
      material_id: 1,
      variante_id: 10,
      nombre_material: 'Aluminio',
    };

    configurar({
      rol: 'VENDEDOR',
      gruposFiltrados: [['aluminio', [activo]]],
      gruposPagina: [['aluminio', [activo]]],
      seleccionEfectiva: { aluminio: activo },
    });

    render(<Materiales />);

    expect(screen.getByTestId('vendor-card-aluminio')).toBeInTheDocument();
    expect(
      screen.queryByTestId('admin-card-aluminio'),
    ).not.toBeInTheDocument();
  });

  it('pasa la configuración correcta a useMaterialesActions', () => {
    configurar();

    render(<Materiales />);

    expect(mocks.actionsArgs).toEqual(
      expect.objectContaining({
        grupos: [],
        esAdmin: true,
        actualizarVariante: mocks.actualizarVariante,
        queryClient: mocks.queryClient,
        pushToast: mocks.pushToast,
      }),
    );
  });

  it('permite quitar un toast', () => {
    render(<Materiales />);

    fireEvent.click(screen.getByRole('button', { name: 'remove-toast' }));

    expect(mocks.removeToast).toHaveBeenCalledWith('toast-1');
  });
});
