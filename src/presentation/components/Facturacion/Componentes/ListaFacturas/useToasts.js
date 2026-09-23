import { useState, useCallback } from 'react';

export default function useToasts() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((msg, tipo = 'error') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, tipo }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const remove = useCallback(id =>
    setToasts(prev => prev.filter(t => t.id !== id)), []);

  return {
    toasts,
    remove,
    error:   (msg) => add(msg, 'error'),
    success: (msg) => add(msg, 'success'),
    warning: (msg) => add(msg, 'warning'),
  };
}