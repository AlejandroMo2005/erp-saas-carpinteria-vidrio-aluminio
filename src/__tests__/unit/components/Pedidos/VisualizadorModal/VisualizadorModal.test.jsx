import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useVisualizadorModal: vi.fn(),
}));

vi.mock('../../../../../presentation/components/Pedidos/VisualizadorModal/useVisualizadorModal', () => ({
  useVisualizadorModal: mocks.useVisualizadorModal,
}));

import VisualizadorModal from '../../../../../presentation/components/Pedidos/VisualizadorModal/VisualizadorModal';

const pedido = {
  id: 42,
  cliente: 'Cliente Demo',
  trabajos_nombres: 'Ventanas',
};

function hookData(overrides = {}) {
  return {
    ancho: '1.50',
    alto: '1.20',
    colorMarcoHex: '#808080',
    colorVidrioHex: '#e0f2ff',
    detallesTrabajo: '',
    clienteInfo: 'Cliente Demo',
    trabajoNombre: 'Ventanas',
    cargandoDetalles: false,
    tipoTrabajo: 'Ventanas',
    PreviewComponent: function PreviewMock(props) {
      return (
        <div data-testid="preview-3d">
          Preview {props.ancho}x{props.alto} {props.colorMarcoHex}
        </div>
      );
    },
    ...overrides,
  };
}

describe('VisualizadorModal', () => {
  beforeEach(() => {
    mocks.useVisualizadorModal.mockReset();
    mocks.useVisualizadorModal.mockReturnValue(hookData());
  });

  it('renderiza la información principal del pedido', () => {
    render(
      <VisualizadorModal
        pedido={pedido}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', {
      name: 'Visualización 3D del pedido 42',
    })).toBeInTheDocument();

    expect(screen.getByText('Visualización 3D')).toBeInTheDocument();
    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getByText('Cliente Demo')).toBeInTheDocument();
    expect(screen.getByText('Ventanas')).toBeInTheDocument();
    expect(screen.getByText('1.50m × 1.20m')).toBeInTheDocument();
  });

  it('muestra el detalle del trabajo cuando existe', () => {
    mocks.useVisualizadorModal.mockReturnValue(
      hookData({
        detallesTrabajo: 'Ventana corrediza de dos hojas',
      })
    );

    render(
      <VisualizadorModal
        pedido={pedido}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText('Ventana corrediza de dos hojas')
    ).toBeInTheDocument();
    expect(screen.getByText('Detalle:')).toBeInTheDocument();
  });

  it('no muestra el bloque de detalle cuando está vacío', () => {
    render(
      <VisualizadorModal
        pedido={pedido}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText('Detalle:')).not.toBeInTheDocument();
  });

  it('muestra el estado de carga mientras obtiene los datos', () => {
    mocks.useVisualizadorModal.mockReturnValue(
      hookData({
        cargandoDetalles: true,
        tipoTrabajo: null,
        PreviewComponent: null,
      })
    );

    render(
      <VisualizadorModal
        pedido={pedido}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText('Cargando visualización 3D...')
    ).toBeInTheDocument();

    expect(screen.queryByTestId('preview-3d')).not.toBeInTheDocument();
  });

  it('renderiza el PreviewComponent cuando existe', () => {
    render(
      <VisualizadorModal
        pedido={pedido}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('preview-3d')).toBeInTheDocument();
    expect(screen.getByText(/Preview 1.5x1.2/)).toBeInTheDocument();
    expect(screen.getByText(/#808080/)).toBeInTheDocument();
  });

  it('muestra el mensaje cuando no existe preview para el trabajo', () => {
    mocks.useVisualizadorModal.mockReturnValue(
      hookData({
        tipoTrabajo: null,
        PreviewComponent: null,
        trabajoNombre: 'Trabajo desconocido',
      })
    );

    render(
      <VisualizadorModal
        pedido={pedido}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText('No se pudo identificar el tipo de trabajo')
    ).toBeInTheDocument();
    expect(screen.getByText('Trabajo desconocido', { selector: 'p' })).toBeInTheDocument();
  });

  it('ejecuta onClose al hacer clic en el botón de cerrar', () => {
    const onClose = vi.fn();

    render(
      <VisualizadorModal
        pedido={pedido}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', {
      name: 'Cerrar visualizador',
    }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ejecuta onClose al hacer clic sobre el overlay', () => {
    const onClose = vi.fn();

    const { container } = render(
      <VisualizadorModal
        pedido={pedido}
        onClose={onClose}
      />
    );

    fireEvent.click(
      container.querySelector('.visualizador-modal-overlay')
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('no cierra el modal al hacer clic dentro del contenido', () => {
    const onClose = vi.fn();

    render(
      <VisualizadorModal
        pedido={pedido}
        onClose={onClose}
      />
    );

    fireEvent.click(
      screen.getByRole('dialog', {
        name: 'Visualización 3D del pedido 42',
      })
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it('pasa pedido y onClose al hook', () => {
    const onClose = vi.fn();

    render(
      <VisualizadorModal
        pedido={pedido}
        onClose={onClose}
      />
    );

    expect(mocks.useVisualizadorModal).toHaveBeenCalledWith({
      pedido,
      onClose,
    });
  });
});
