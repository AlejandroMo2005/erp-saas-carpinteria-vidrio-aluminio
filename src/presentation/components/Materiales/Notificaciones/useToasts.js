import { useState, useCallback, useRef } from 'react';

const DURACION_MS = 3500;

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const contadorRef = useRef(0);

  const push = useCallback((mensaje, tipo = 'success') => {
    const id = ++contadorRef.current;
    setToasts(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, DURACION_MS);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, push, remove };
}
