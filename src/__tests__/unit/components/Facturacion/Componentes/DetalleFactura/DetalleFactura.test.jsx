import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';

vi.mock(
  '../../../../../../presentation/components/Facturacion/Componentes/DetalleFactura/useDetalleFactura',
  () => ({
    default: vi.fn(),
  })
);

import useDetalleFactura from '../../../../../../presentation/components/Facturacion/Componentes/DetalleFactura/useDetalleFactura';
import DetalleFactura from '../../../../../../presentation/components/Facturacion/Componentes/DetalleFactura/DetalleFactura';

describe('DetalleFactura', () => {
  const onCerrar = vi.fn();
  const onAnulada = vi.fn();

  const crearEstadoBase = (overrides = {}) => ({
    factura: null,
    loading: false,
    error: null,
    anulando: false,
    modalAnular: false,
    motivo: '',
    setMotivo: vi.fn(),
    errorMotivo: '',
    cargarFactura: vi.fn(),
    handleAnular: vi.fn(),
    handleDescargarPDF: vi.fn(),
    handleImprimir: vi.fn(),
    abrirModalAnular: vi.fn(),
    cerrarModalAnular: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el estado de carga', () => {
    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        loading: true,
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    expect(screen.getByRole('heading', { name: 'Cargando...' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando factura...');
  });

  it('muestra el error y permite reintentar la carga', () => {
    const cargarFactura = vi.fn();

    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        error: 'Factura no encontrada',
        cargarFactura,
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Factura no encontrada');

    screen.getByRole('button', { name: /reintentar/i }).click();

    expect(cargarFactura).toHaveBeenCalledTimes(1);
  });

  it('muestra el detalle de la factura correctamente', () => {
    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        factura: {
          id: 25,
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          fecha_emision: '2026-09-15T12:00:00',
          created_at: '2026-09-15T12:00:00',
          updated_at: '2026-09-16T12:00:00',
          cliente_nombre: 'Juan Pérez',
          cliente_tipo_identificacion: 'Cédula',
          cliente_identificacion: '1301234567',
          cliente_telefono: '0999999999',
          cliente_email: 'juan@example.com',
          cliente_direccion: 'Flavio Alfaro',
          usuario_nombre: 'Administrador',
          clave_acceso: '1234567890123456789012345678901234567890123456789012',
          subtotal_sin_iva: 100,
          subtotal_con_iva: 100,
          iva: 15,
          descuento: 5,
          total: 110,
          observaciones: 'Entrega coordinada con el cliente.',
          detalle: [
            {
              id: 1,
              descripcion: 'Ventana de aluminio',
              codigo_principal: 'V001',
              cantidad: 2,
              precio_unitario: 50,
              descuento: 5,
              porcentaje_iva: 15,
              precio_total_sin_iva: 100,
              valor_iva: 15,
            },
          ],
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    expect(
      screen.getByRole('heading', { name: '001-001-000000025' })
    ).toBeInTheDocument();

    expect(screen.getAllByText('Autorizada')).toHaveLength(2);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('1301234567')).toBeInTheDocument();
    expect(screen.getByText('0999999999')).toBeInTheDocument();
    expect(screen.getByText('juan@example.com')).toBeInTheDocument();
    expect(screen.getByText('Flavio Alfaro')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();

    expect(screen.getByText('1234567890123456789012345678901234567890123456789012')).toBeInTheDocument();
    expect(screen.getByText('Ventana de aluminio')).toBeInTheDocument();
    expect(screen.getByText('Cód: V001')).toBeInTheDocument();
    expect(screen.getByText('Subtotal sin IVA')).toBeInTheDocument();
    expect(screen.getByText('TOTAL')).toBeInTheDocument();
    expect(screen.getByText('Entrega coordinada con el cliente.')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /imprimir/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /descargar pdf/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /anular/i })
    ).toBeInTheDocument();
  });
    it('cierra el detalle al pulsar el botón cerrar', () => {
    useDetalleFactura.mockReturnValue(crearEstadoBase());

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar detalle' })
    );

    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('cierra el detalle al pulsar Escape', () => {
    useDetalleFactura.mockReturnValue(crearEstadoBase());

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('cierra el detalle al pulsar sobre el overlay', () => {
    useDetalleFactura.mockReturnValue(crearEstadoBase());

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    const overlay = screen.getByRole('dialog', {
      name: 'Detalle de factura',
    });

    fireEvent.click(overlay);

    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('expande y contrae la sección de datos del cliente', () => {
    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          cliente_nombre: 'Juan Pérez',
          detalle: [],
          subtotal_sin_iva: 0,
          subtotal_con_iva: 0,
          iva: 0,
          descuento: 0,
          total: 0,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    const boton = screen.getByRole('button', {
      name: /datos del cliente/i,
    });

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();

    fireEvent.click(boton);

    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();

    fireEvent.click(boton);

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('expande y contrae la sección de productos y servicios', () => {
    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          cliente_nombre: 'Juan Pérez',
          detalle: [
            {
              id: 1,
              descripcion: 'Ventana',
              cantidad: 1,
              precio_unitario: 100,
              descuento: 0,
              porcentaje_iva: 15,
              precio_total_sin_iva: 100,
              valor_iva: 15,
            },
          ],
          subtotal_sin_iva: 100,
          subtotal_con_iva: 100,
          iva: 15,
          descuento: 0,
          total: 115,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    const boton = screen.getByRole('button', {
      name: /detalle de productos \/ servicios/i,
    });

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Ventana')).toBeInTheDocument();

    fireEvent.click(boton);

    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Ventana')).not.toBeInTheDocument();

    fireEvent.click(boton);

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Ventana')).toBeInTheDocument();
  });

  it('delega la impresión y descarga del PDF al hook', () => {
    const handleImprimir = vi.fn();
    const handleDescargarPDF = vi.fn();

    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        handleImprimir,
        handleDescargarPDF,
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          cliente_nombre: 'Juan Pérez',
          detalle: [],
          subtotal_sin_iva: 0,
          subtotal_con_iva: 0,
          iva: 0,
          descuento: 0,
          total: 0,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /imprimir/i })
    );

    fireEvent.click(
      screen.getByRole('button', { name: /descargar pdf/i })
    );

    expect(handleImprimir).toHaveBeenCalledTimes(1);
    expect(handleDescargarPDF).toHaveBeenCalledWith(
      '001-001-000000025'
    );
  });

  it('abre el modal de anulación al pulsar Anular', () => {
    const abrirModalAnular = vi.fn();

    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        abrirModalAnular,
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          cliente_nombre: 'Juan Pérez',
          detalle: [],
          subtotal_sin_iva: 0,
          subtotal_con_iva: 0,
          iva: 0,
          descuento: 0,
          total: 0,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /anular/i })
    );

    expect(abrirModalAnular).toHaveBeenCalledTimes(1);
  });

  it('muestra el modal de anulación y permite editar el motivo', () => {
    const setMotivo = vi.fn();

    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        modalAnular: true,
        motivo: '',
        setMotivo,
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          detalle: [],
          subtotal_sin_iva: 0,
          subtotal_con_iva: 0,
          iva: 0,
          descuento: 0,
          total: 0,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    expect(
      screen.getByRole('dialog', { name: 'Confirmar anulación' })
    ).toBeInTheDocument();

    expect(screen.getAllByText('001-001-000000025')).not.toHaveLength(0);

    const textarea = screen.getByLabelText(/motivo de anulación/i);

    fireEvent.change(textarea, {
      target: { value: 'Error en los datos del cliente' },
    });

    expect(setMotivo).toHaveBeenCalledWith(
      'Error en los datos del cliente'
    );
  });

  it('muestra el error del motivo de anulación', () => {
    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        modalAnular: true,
        motivo: 'Motivo inválido',
        errorMotivo: 'El motivo debe tener al menos 10 caracteres',
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          detalle: [],
          subtotal_sin_iva: 0,
          subtotal_con_iva: 0,
          iva: 0,
          descuento: 0,
          total: 0,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    expect(
      screen.getByRole('alert')
    ).toHaveTextContent(
      'El motivo debe tener al menos 10 caracteres'
    );
  });

  it('delega la confirmación de anulación al hook', () => {
    const handleAnular = vi.fn();

    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        modalAnular: true,
        motivo: 'Error en los datos del cliente',
        handleAnular,
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          detalle: [],
          subtotal_sin_iva: 0,
          subtotal_con_iva: 0,
          iva: 0,
          descuento: 0,
          total: 0,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /confirmar anulación/i })
    );

    expect(handleAnular).toHaveBeenCalledTimes(1);
  });

  it('delega el cierre del modal de anulación al hook', () => {
    const cerrarModalAnular = vi.fn();

    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        modalAnular: true,
        cerrarModalAnular,
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          detalle: [],
          subtotal_sin_iva: 0,
          subtotal_con_iva: 0,
          iva: 0,
          descuento: 0,
          total: 0,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Cancelar' })
    );

    expect(cerrarModalAnular).toHaveBeenCalledTimes(1);
  });

  it('deshabilita los controles mientras se anula la factura', () => {
    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        modalAnular: true,
        anulando: true,
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          detalle: [],
          subtotal_sin_iva: 0,
          subtotal_con_iva: 0,
          iva: 0,
          descuento: 0,
          total: 0,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    expect(
      screen.getByLabelText(/motivo de anulación/i)
    ).toBeDisabled();

    expect(
      screen.getByRole('button', { name: 'Cancelar' })
    ).toBeDisabled();

    expect(
      screen.getByRole('button', { name: 'Anulando...' })
    ).toBeDisabled();
  });


  it('usa items como respaldo y valores cero para datos numéricos inválidos', () => {
    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          cliente_nombre: 'Juan Pérez',
          items: [{
            descripcion: 'Vidrio especial',
            cantidad: 1,
            precio_unitario: 25,
            porcentaje_iva: 15,
            precio_total_sin_iva: 'no válido',
            valor_iva: 'no válido',
          }],
          subtotal_sin_iva: 0,
          subtotal_con_iva: 0,
          iva: 0,
          descuento: 0,
          total: 0,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    expect(screen.getByText('Vidrio especial')).toBeInTheDocument();
    expect(screen.getAllByText('$0.00').length).toBeGreaterThan(0);
  });

  it('usa una lista vacía cuando no recibe detalle ni items', () => {
    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'AUTORIZADA',
          estado_sri: 'AUTORIZADA',
          cliente_nombre: 'Juan Pérez',
          subtotal_sin_iva: 0,
          subtotal_con_iva: 0,
          iva: 0,
          descuento: 0,
          total: 0,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    const tabla = screen.getByRole('table', { name: 'Detalle de ítems' });

    expect(tabla.querySelector('tbody')).toBeEmptyDOMElement();
  });

  it('usa los estados por defecto cuando recibe estados desconocidos', () => {
    useDetalleFactura.mockReturnValue(
      crearEstadoBase({
        factura: {
          numero_factura: '001-001-000000025',
          estado: 'ESTADO_DESCONOCIDO',
          estado_sri: 'ESTADO_SRI_DESCONOCIDO',
          cliente_nombre: 'Juan Pérez',
          detalle: [],
          subtotal_sin_iva: 0,
          subtotal_con_iva: 0,
          iva: 0,
          descuento: 0,
          total: 0,
        },
      })
    );

    render(
      <DetalleFactura
        facturaId={25}
        onCerrar={onCerrar}
        onAnulada={onAnulada}
      />
    );

    expect(screen.getByText('Borrador')).toBeInTheDocument();
    expect(screen.getByText('Sin enviar')).toBeInTheDocument();
  });

});
