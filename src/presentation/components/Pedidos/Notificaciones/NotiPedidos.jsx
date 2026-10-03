/**
 * @fileoverview Sistema de notificaciones toast para el módulo Pedidos
 * @module components/Pedidos/Notificaciones/NotiPedidos
 */

import { memo } from 'react';
import './NotiPedidos.css';

const ICONOS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: PedidoToastContainer
// ═══════════════════════════════════════════════════════════════════════════
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