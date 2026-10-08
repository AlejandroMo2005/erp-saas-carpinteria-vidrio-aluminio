import { useState, useCallback, useRef } from 'react';

const DURACION_DEFAULT_MS = 3500;

export function useToasts({
  duracion = DURACION_DEFAULT_MS,
  tipoPorDefecto = 'info',
  helpers = false,
} = {}) {
  const [toasts, setToasts] = useState([]);
  const contadorRef = useRef(0);

  const push = useCallback((mensaje, tipo = tipoPorDefecto) => {
    const id = ++contadorRef.current;

    setToasts(prev => [...prev, { id, mensaje, tipo }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duracion);
  }, [duracion, tipoPorDefecto]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ok = useCallback((msg) => push(msg, 'success'), [push]);
  const error = useCallback((msg) => push(msg, 'error'), [push]);
  const warning = useCallback((msg) => push(msg, 'warning'), [push]);
  const info = useCallback((msg) => push(msg, 'info'), [push]);

  return helpers
    ? { toasts, push, remove, ok, error, warning, info }
    : { toasts, push, remove };
}
