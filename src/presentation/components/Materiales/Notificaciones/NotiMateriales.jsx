/**
 * @fileoverview Sistema de notificaciones toast para el módulo Materiales
 * @module components/Materiales/Notificaciones/NotiMateriales
 */

import { memo } from 'react';
import './NotiMateriales.css';

const ICONOS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ToastContainer
// ═══════════════════════════════════════════════════════════════════════════
// Memoizado — solo se re-renderiza cuando cambia la lista de toasts
// ═══════════════════════════════════════════════════════════════════════════

export const ToastContainer = memo(function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="nm-toast-container"
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className={`nm-toast nm-toast--${t.tipo}`}
          role="status"
        >
          <span className="nm-toast__icono" aria-hidden="true">
            {ICONOS[t.tipo] ?? ICONOS.info}
          </span>
          <span className="nm-toast__msg">{t.mensaje}</span>
          <button
            className="nm-toast__close"
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