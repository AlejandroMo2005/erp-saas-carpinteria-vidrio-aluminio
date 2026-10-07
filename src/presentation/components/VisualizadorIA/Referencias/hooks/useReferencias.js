import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/useAuth';
import api from '../../../../api/api';

export function useReferencias() {
  const { isAdmin, isVendedor } = useAuth();
  const [grupos,  setGrupos]  = useState({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filtro,  setFiltro]  = useState('');

  useEffect(() => {
    if (!isAdmin && !isVendedor) { setLoading(false); return; }
    let cancelled = false;

    void (async () => {
      try {
        const { data } = await api.get('/trabajos?activo=1');
        const lista = Array.isArray(data) ? data : (data.trabajos ?? []);

        const agrupado = lista.reduce((acc, t) => {
          const categoria = t.nombre.split(' - ')[0].trim();
          const variante  = t.variante?.trim() || '';
          if (!acc[categoria])           acc[categoria] = {};
          if (!acc[categoria][variante]) acc[categoria][variante] = [];
          acc[categoria][variante].push(t);
          return acc;
        }, {});

        // Si un tipo ya tiene variantes definidas, descartar la entrada sin variante
        // (el registro original id=1..10 queda oculto — solo sirve como plantilla)
        const grupos = {};
        for (const [tipo, variantes] of Object.entries(agrupado)) {
          const tieneVariantes = Object.keys(variantes).some(v => v !== '');
          if (tieneVariantes) {
            const { '': _base, ...soloVariantes } = variantes;
            grupos[tipo] = soloVariantes;
          } else {
            grupos[tipo] = variantes;
          }
        }

        if (!cancelled) setGrupos(grupos);

        const limpio = {};
        for (const [tipo, variantes] of Object.entries(agrupado)) {
          const tieneVariantes = Object.keys(variantes).some(v => v !== '');
          if (tieneVariantes) {
            // Descartar la entrada vacía (el original sin variante)
            const { '': _descartado, ...soloVariantes } = variantes;
            limpio[tipo] = soloVariantes;
          } else {
            limpio[tipo] = variantes;
          }
        }

        if (!cancelled) setGrupos(agrupado);
      } catch {
        if (!cancelled) setError('No se pudo cargar la lista de trabajos.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isAdmin, isVendedor]);

  const tiposTodos = Object.keys(grupos);

  const tiposVisibles = filtro
    ? tiposTodos.filter((cat) =>
        cat.toLowerCase().includes(filtro.toLowerCase()) ||
        Object.values(grupos[cat])
          .flat()
          .some((w) =>
            w.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
            (w.variante ?? '').toLowerCase().includes(filtro.toLowerCase())
          )
      )
    : tiposTodos;

  return {
    isAdmin, isVendedor,
    grupos, loading, error,
    filtro, setFiltro,
    tiposTodos, tiposVisibles,
  };
}
