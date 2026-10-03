/**
 * @fileoverview Sistema de notificaciones toast para el módulo Previsualizacion
 * @module components/Previsualizacion/Notificaciones/NotiPrevisualizacion
 */

import { memo } from 'react';
import './NotiPrevisualizacion.css';

const ICONOS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: PreviewToastContainer
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════

export const PreviewToastContainer = memo(function PreviewToastContainer({
  toasts,
  onRemove
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="npv-toast-container"
      role="region"
      aria-label="Notificaciones del visualizador"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className={`npv-toast npv-toast--${t.tipo}`}
          role="status"
        >
          <span className="npv-toast__icono" aria-hidden="true">
            {ICONOS[t.tipo] ?? ICONOS.info}
          </span>
          <span className="npv-toast__msg">{t.mensaje}</span>
          <button
            className="npv-toast__close"
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