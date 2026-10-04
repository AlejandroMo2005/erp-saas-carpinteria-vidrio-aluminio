import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ModalSolicitud from '../../../../../../presentation/components/Facturacion/Proveedores/ModalSolicitud/ModalSolicitud';
import useModalSolicitud from '../../../../../../presentation/components/Facturacion/Proveedores/ModalSolicitud/useModalSolicitud';

vi.mock('../../../../../../presentation/components/Facturacion/Proveedores/ModalSolicitud/useModalSolicitud');

describe('ModalSolicitud', () => {
  const onClose = vi.fn();
  const onEnviada = vi.fn();

  const baseHook = {
    paso: null,
    copiado: false,
    marcando: false,
    telMostrar: '0987654321',
    tieneTel: true,
    handleCopiarYEnviar: vi.fn(),
    handleCopiarManual: vi.fn(),
    handleConfirmar: vi.fn(),
  };

  const baseProps = {
    _proveedor_id: 1,
    nombreProveedor: 'Alumex Ecuador',
    telefono_whatsapp: '593987654321',
    plantilla: 'Hola, necesitamos los siguientes materiales.',
    solicitudId: 15,
    onClose,
    onEnviada,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useModalSolicitud.mockReturnValue(baseHook);
  });

  it('renderiza el proveedor y la plantilla', () => {
    render(<ModalSolicitud {...baseProps} />);

    expect(screen.getByRole('heading', {
      name: 'Solicitud de materiales',
    })).toBeInTheDocument();

    expect(screen.getByText('Para: Alumex Ecuador')).toBeInTheDocument();
    expect(
      screen.getByText('Hola, necesitamos los siguientes materiales.')
    ).toBeInTheDocument();
  });

  it('pasa los datos correctos al hook', () => {
    render(<ModalSolicitud {...baseProps} />);

    expect(useModalSolicitud).toHaveBeenCalledWith({
      plantilla: baseProps.plantilla,
      solicitudId: baseProps.solicitudId,
      telefono_whatsapp: baseProps.telefono_whatsapp,
      onEnviada,
    });
  });

  it('cierra el modal desde el botón superior', () => {
    render(<ModalSolicitud {...baseProps} />);

    fireEvent.click(screen.getByRole('button', {
      name: 'Cerrar modal',
    }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra el modal desde el botón Cerrar', () => {
    render(<ModalSolicitud {...baseProps} />);

    fireEvent.click(screen.getByRole('button', {
      name: 'Cerrar',
    }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ejecuta la copia manual', () => {
    render(<ModalSolicitud {...baseProps} />);

    fireEvent.click(screen.getByRole('button', {
      name: 'Copiar',
    }));

    expect(baseHook.handleCopiarManual).toHaveBeenCalledTimes(1);
  });

  it('muestra el estado Copiado', () => {
    useModalSolicitud.mockReturnValue({
      ...baseHook,
      copiado: true,
    });

    render(<ModalSolicitud {...baseProps} />);

    expect(screen.getByRole('button', {
      name: 'Copiado',
    })).toBeInTheDocument();
  });

  it('muestra Copiar y enviar cuando hay teléfono y el paso es inicial', () => {
    render(<ModalSolicitud {...baseProps} />);

    const button = screen.getByRole('button', {
      name: 'Copiar y enviar',
    });

    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(baseHook.handleCopiarYEnviar).toHaveBeenCalledTimes(1);
  });

  it('muestra instrucciones después de copiar y enviar', () => {
    useModalSolicitud.mockReturnValue({
      ...baseHook,
      paso: 'instrucciones',
      telMostrar: '0987654321',
    });

    render(<ModalSolicitud {...baseProps} />);

    expect(
      screen.getByRole('status')
    ).toHaveTextContent('Mensaje copiado — 3 pasos:');

    expect(screen.getByText('0987654321')).toBeInTheDocument();

    expect(screen.getByRole('button', {
      name: 'Ya lo envié ✓',
    })).toBeInTheDocument();
  });

  it('muestra el nombre del proveedor en instrucciones cuando no hay teléfono mostrado', () => {
    useModalSolicitud.mockReturnValue({
      ...baseHook,
      paso: 'instrucciones',
      telMostrar: null,
      tieneTel: false,
    });

    render(
      <ModalSolicitud
        {...baseProps}
        telefono_whatsapp=""
      />
    );

    expect(screen.getByText('Alumex Ecuador')).toBeInTheDocument();
    expect(screen.queryByText('0987654321')).not.toBeInTheDocument();
  });

  it('ejecuta la confirmación', () => {
    useModalSolicitud.mockReturnValue({
      ...baseHook,
      paso: 'instrucciones',
    });

    render(<ModalSolicitud {...baseProps} />);

    fireEvent.click(screen.getByRole('button', {
      name: 'Ya lo envié ✓',
    }));

    expect(baseHook.handleConfirmar).toHaveBeenCalledTimes(1);
  });

  it('muestra Guardando cuando está marcando', () => {
    useModalSolicitud.mockReturnValue({
      ...baseHook,
      paso: 'instrucciones',
      marcando: true,
    });

    render(<ModalSolicitud {...baseProps} />);

    const button = screen.getByRole('button', {
      name: 'Guardando…',
    });

    expect(button).toBeDisabled();
  });

  it('muestra el estado confirmado', () => {
    useModalSolicitud.mockReturnValue({
      ...baseHook,
      paso: 'confirmado',
    });

    render(<ModalSolicitud {...baseProps} />);

    expect(
      screen.getByRole('status')
    ).toHaveTextContent('Solicitud marcada como enviada.');

    expect(screen.getByRole('button', {
      name: 'Enviado ✓',
    })).toBeDisabled();
  });

  it('muestra aviso cuando no hay teléfono registrado', () => {
    useModalSolicitud.mockReturnValue({
      ...baseHook,
      tieneTel: false,
      telMostrar: null,
    });

    render(
      <ModalSolicitud
        {...baseProps}
        telefono_whatsapp=""
      />
    );

    expect(
      screen.getByText(
        'Sin número registrado. Copia el mensaje y envíalo manualmente.'
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Copiar y enviar' })
    ).not.toBeInTheDocument();
  });
});
