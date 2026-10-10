import { memo } from 'react';
import './ToastContainer.css';

const ICONOS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export const ToastContainer = memo(function ToastContainer({
  toasts,
  onRemove,
  ariaLabel,
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="np-toast-container"
      role="region"
      aria-label={ariaLabel}
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
