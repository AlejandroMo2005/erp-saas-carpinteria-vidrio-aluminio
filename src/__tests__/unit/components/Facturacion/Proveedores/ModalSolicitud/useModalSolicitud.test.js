import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import useModalSolicitud from '../../../../../../presentation/components/Facturacion/Proveedores/ModalSolicitud/useModalSolicitud';
import api from '../../../../../../presentation/api/api';

vi.mock('../../../../../../presentation/api/api', () => ({
  default: {
    patch: vi.fn(),
  },
}));

describe('useModalSolicitud', () => {
  const plantilla = 'Hola, necesitamos materiales.';
  const solicitudId = 15;
  const onEnviada = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('inicializa sin teléfono', () => {
    const { result } = renderHook(() =>
      useModalSolicitud({
        plantilla,
        solicitudId,
        telefono_whatsapp: '',
        onEnviada,
      })
    );

    expect(result.current.paso).toBeNull();
    expect(result.current.copiado).toBe(false);
    expect(result.current.marcando).toBe(false);
    expect(result.current.telMostrar).toBeNull();
    expect(result.current.tieneTel).toBe(false);
  });

  it('normaliza el teléfono internacional y detecta que existe', () => {
    const { result } = renderHook(() =>
      useModalSolicitud({
        plantilla,
        solicitudId,
        telefono_whatsapp: '+593 987-654-321',
        onEnviada,
      })
    );

    expect(result.current.telMostrar).toBe('0987654321');
    expect(result.current.tieneTel).toBe(true);
  });

  it('copia el mensaje y pasa a instrucciones', async () => {
    const { result } = renderHook(() =>
      useModalSolicitud({
        plantilla,
        solicitudId,
        telefono_whatsapp: '593987654321',
        onEnviada,
      })
    );

    await act(async () => {
      await result.current.handleCopiarYEnviar();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(plantilla);
    expect(result.current.paso).toBe('instrucciones');
  });

  it('copia manualmente y activa el estado Copiado', async () => {
    const { result } = renderHook(() =>
      useModalSolicitud({
        plantilla,
        solicitudId,
        telefono_whatsapp: '593987654321',
        onEnviada,
      })
    );

    await act(async () => {
      await result.current.handleCopiarManual();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(plantilla);
    expect(result.current.copiado).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copiado).toBe(false);
  });

  it('usa el fallback de textarea cuando clipboard falla', async () => {
    navigator.clipboard.writeText.mockRejectedValueOnce(
      new Error('Clipboard no disponible')
    );

    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    const { result } = renderHook(() =>
      useModalSolicitud({
        plantilla,
        solicitudId,
        telefono_whatsapp: '593987654321',
        onEnviada,
      })
    );

    await act(async () => {
      await result.current.handleCopiarYEnviar();
    });

    expect(result.current.paso).toBe('instrucciones');
    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
    expect(execCommand).toHaveBeenCalledWith('copy');

    appendChild.mockRestore();
    removeChild.mockRestore();
    delete document.execCommand;
  });

  it('marca la solicitud como enviada correctamente', async () => {
    api.patch.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() =>
      useModalSolicitud({
        plantilla,
        solicitudId,
        telefono_whatsapp: '593987654321',
        onEnviada,
      })
    );

    await act(async () => {
      await result.current.handleConfirmar();
    });

    expect(api.patch).toHaveBeenCalledWith(
      `/proveedores/solicitudes/${solicitudId}/enviada`
    );
    expect(result.current.paso).toBe('confirmado');
    expect(result.current.marcando).toBe(false);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onEnviada).toHaveBeenCalledTimes(1);
  });

  it('confirma aunque falle el marcado en backend', async () => {
    api.patch.mockRejectedValueOnce(new Error('Error de red'));

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useModalSolicitud({
        plantilla,
        solicitudId,
        telefono_whatsapp: '593987654321',
        onEnviada,
      })
    );

    await act(async () => {
      await result.current.handleConfirmar();
    });

    expect(api.patch).toHaveBeenCalledWith(
      `/proveedores/solicitudes/${solicitudId}/enviada`
    );
    expect(warn).toHaveBeenCalledWith(
      'No se pudo marcar como enviada:',
      expect.any(Error)
    );
    expect(result.current.paso).toBe('confirmado');
    expect(result.current.marcando).toBe(false);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onEnviada).toHaveBeenCalledTimes(1);

    warn.mockRestore();
  });

  it('no falla cuando onEnviada no está definido', async () => {
    api.patch.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() =>
      useModalSolicitud({
        plantilla,
        solicitudId,
        telefono_whatsapp: '593987654321',
        onEnviada: undefined,
      })
    );

    await act(async () => {
      await result.current.handleConfirmar();
    });

    expect(result.current.paso).toBe('confirmado');

    act(() => {
      vi.advanceTimersByTime(400);
    });
  });
});
