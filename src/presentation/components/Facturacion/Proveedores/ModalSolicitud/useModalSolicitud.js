import { useState } from 'react';
import api from '../../../../api/api';

export default function useModalSolicitud({ plantilla, solicitudId, telefono_whatsapp, onEnviada }) {
  const [paso,     setPaso]     = useState(null); // null | 'instrucciones' | 'confirmado'
  const [copiado,  setCopiado]  = useState(false);
  const [marcando, setMarcando] = useState(false);

  const telMostrar = telefono_whatsapp
    ? telefono_whatsapp.replace(/\D/g, '').replace(/^593/, '0')
    : null;

  const tieneTel = !!telefono_whatsapp?.trim();

  const copiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(plantilla);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = plantilla;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const handleCopiarYEnviar = async () => {
    await copiarTexto();
    setPaso('instrucciones');
  };

  const handleCopiarManual = async () => {
    await copiarTexto();
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleConfirmar = async () => {
    setMarcando(true);
    try {
      await api.patch(`/proveedores/solicitudes/${solicitudId}/enviada`);
    } catch (e) {
      console.warn('No se pudo marcar como enviada:', e);
    }
    setPaso('confirmado');
    setMarcando(false);
    setTimeout(() => onEnviada?.(), 400);
  };

  return {
    paso,
    copiado,
    marcando,
    telMostrar,
    tieneTel,
    handleCopiarYEnviar,
    handleCopiarManual,
    handleConfirmar,
  };
}