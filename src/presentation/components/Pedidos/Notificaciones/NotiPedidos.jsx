/**
 * @fileoverview Sistema de notificaciones toast para el módulo Pedidos
 * @module components/Pedidos/Notificaciones/NotiPedidos
 */

import { useState, useCallback, useRef, memo } from 'react';
import './NotiPedidos.css';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const DURACION_MS = 4000;

const ICONOS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ'
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: usePedidoToasts
// ═══════════════════════════════════════════════════════════════════════════

export function usePedidoToasts() {
  const [toasts, setToasts] = useState([]);
  const contadorRef         = useRef(0);

  const push = useCallback((mensaje, tipo = 'info') => {
    const id = ++contadorRef.current;
    setToasts(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, DURACION_MS);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ok      = useCallback((msg) => push(msg, 'success'), [push]);
  const error   = useCallback((msg) => push(msg, 'error'),   [push]);
  const warning = useCallback((msg) => push(msg, 'warning'), [push]);
  const info    = useCallback((msg) => push(msg, 'info'),    [push]);

  return { toasts, push, remove, ok, error, warning, info };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: PedidoToastContainer
// ═══════════════════════════════════════════════════════════════════════════

export const PedidoToastContainer = memo(function PedidoToastContainer({
  toasts,
  onRemove
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="np-toast-container"
      role="region"
      aria-label="Notificaciones de pedidos"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className={`np-toast np-toast--${t.tipo}`}
          role="status"
        >
          <span className="np-toast__icono" aria-hidden="true">
            {ICONOS[t.tipo] ?? ICONOS.info}
          </span>
          <span className="np-toast__msg">{t.mensaje}</span>
          <button
            className="np-toast__close"
            onClick={() => onRemove(t.id)}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
});