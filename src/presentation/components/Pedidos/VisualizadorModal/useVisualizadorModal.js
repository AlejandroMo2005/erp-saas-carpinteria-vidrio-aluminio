// src/presentation/components/Pedidos/VisualizadorModal/useVisualizadorModal.js
// Sprint 16 — Fix CLS: estados iniciales con placeholder evitan reflow
// Sprint 18 — Fix Context Lost: key en Canvas + resize dispatch
//             Extraído de VisualizadorModal.jsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../api/api';
import { PREVIEW_MAP } from './constants';
import { normalizarColor } from './utils';

export function useVisualizadorModal({ pedido, onClose }) {
  const [ancho,            setAncho]            = useState('1.50');
  const [alto,             setAlto]             = useState('1.20');
  const [colorMarcoHex,    setColorMarcoHex]    = useState('#808080');
  const [colorVidrioHex,   setColorVidrioHex]   = useState('#e0f2ff');
  const [detallesTrabajo,  setDetallesTrabajo]  = useState('');
  const [clienteInfo,      setClienteInfo]      = useState(pedido.cliente || '—');
  const [trabajoNombre,    setTrabajoNombre]    = useState(
    pedido.trabajos_nombres?.split(',')[0]?.trim() || '—'
  );
  const [cargandoDetalles, setCargandoDetalles] = useState(true);

  /* ── Cargar datos del pedido ─────────────────────────────────────────── */
  useEffect(() => {
    const cargar = async () => {
      try {
        setCargandoDetalles(true);

        const local = localStorage.getItem(`pedido_${pedido.id}_datos`);
        if (local) {
          const d = JSON.parse(local);
          if (d.trabajo_nombre) setTrabajoNombre(d.trabajo_nombre);
          if (d.ancho)          setAncho(d.ancho.toString());
          if (d.alto)           setAlto(d.alto.toString());
          if (d.color_nombre) {
            const hex = normalizarColor(d.color_nombre);
            setColorMarcoHex(hex);
            setColorVidrioHex(hex);
          }
          if (d.detalle) setDetallesTrabajo(d.detalle);
          if (d.cliente) setClienteInfo(d.cliente);
          setCargandoDetalles(false);
          return;
        }

        const res   = await api.get(`/pedidos/${pedido.id}`);
        const datos = res.data;

        if (datos?.items?.length > 0) {
          const item = datos.items[0];
          if (item.trabajo_nombre) setTrabajoNombre(item.trabajo_nombre);
          if (item.ancho)          setAncho(item.ancho.toString());
          if (item.alto)           setAlto(item.alto.toString());
          if (item.color_nombre) {
            const hex = normalizarColor(item.color_nombre);
            setColorMarcoHex(hex);
            setColorVidrioHex(hex);
          }
          if (item.detalle) setDetallesTrabajo(item.detalle);
          if (datos.cliente) setClienteInfo(datos.cliente);
        }
      } catch (err) {
        console.error('[VisualizadorModal] Error cargando pedido:', err);
      } finally {
        setCargandoDetalles(false);
      }
    };

    void cargar();
  }, [pedido.id]);

  /* ── Fix Context Lost: forzar resize cuando el Canvas ya montó ──────────
     R3F usa ResizeObserver sobre el contenedor. Si el modal todavía está
     calculando su layout cuando el Canvas monta, el observer puede reportar
     size=0 y el WebGLRenderer crea un contexto con dimensiones inválidas.
     Disparar resize en el siguiente frame fuerza la re-medición.           */
  useEffect(() => {
    if (cargandoDetalles) return;
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
    return () => cancelAnimationFrame(id);
  }, [cargandoDetalles, trabajoNombre]);

  /* ── Bloquear scroll del body mientras el modal está abierto ─────────── */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  /* ── Cerrar con Escape ───────────────────────────────────────────────── */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* ── Resolver tipo de trabajo y componente de preview ───────────────── */
  const tipoTrabajo = useMemo(() => {
    if (!trabajoNombre || trabajoNombre === '—') return null;
    if (PREVIEW_MAP[trabajoNombre]) return trabajoNombre;
    return Object.keys(PREVIEW_MAP).find(
      (key) => trabajoNombre.toLowerCase().includes(key.toLowerCase())
    ) ?? null;
  }, [trabajoNombre]);

  const PreviewComponent = tipoTrabajo ? PREVIEW_MAP[tipoTrabajo] : null;

  return {
    ancho, alto,
    colorMarcoHex, colorVidrioHex,
    detallesTrabajo, clienteInfo, trabajoNombre,
    cargandoDetalles,
    tipoTrabajo, PreviewComponent,
  };
}
