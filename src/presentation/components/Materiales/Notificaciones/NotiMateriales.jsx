/**
 * @fileoverview Sistema de notificaciones toast para el módulo Materiales
 * @module components/Materiales/Notificaciones/NotiMateriales
 */

import { useState, useCallback, useRef, memo } from 'react';
import './NotiMateriales.css';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const DURACION_MS = 3500;

const ICONOS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ'
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useToasts
// Exportado para usarse en Materiales.jsx
// ═══════════════════════════════════════════════════════════════════════════

export function useToasts() {
  const [toasts, setToasts]  = useState([]);
  const contadorRef          = useRef(0);

  /**
   * Agrega un toast y lo elimina automáticamente tras DURACION_MS
   * @param {string} mensaje
   * @param {'success'|'error'|'info'} tipo
   */
  const push = useCallback((mensaje, tipo = 'success') => {
    const id = ++contadorRef.current;
    setToasts(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, DURACION_MS);
  }, []);

  /** Elimina un toast manualmente (botón ×) */
  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, push, remove };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ToastContainer
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