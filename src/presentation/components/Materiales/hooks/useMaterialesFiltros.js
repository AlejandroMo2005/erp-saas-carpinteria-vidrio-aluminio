// src/presentation/components/Materiales/hooks/useMaterialesFiltros.js
// Sprint 18 — Refactorización modular
// Responsabilidad: derivar grupos desde rawData, filtrar y paginar.
// Sin side effects de escritura — todos los resultados son derivados puros.

import { useState, useEffect, useMemo } from 'react';
import { POR_PAGINA, DEBOUNCE_MS } from '../constants/materialesConstants';
import { sanitizarTexto, useDebounce } from '../utils/materialesUtils';

export function useMaterialesFiltros(rawData) {
  const [busqueda, setBusqueda] = useState('');
  const [pagina,   setPagina]   = useState(1);

  const busquedaDebounced = useDebounce(busqueda, DEBOUNCE_MS);

  // Agrupar por nombre_material
  const grupos = useMemo(() => {
    const acc = {};
    rawData.forEach((item) => {
      const key = sanitizarTexto(item.nombre_material);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
    });
    return Object.entries(acc);
  }, [rawData]);

  const gruposFiltrados = useMemo(() => {
    if (!busquedaDebounced.trim()) return grupos;
    const q = busquedaDebounced.toLowerCase();
    return grupos.filter(([n]) => n.toLowerCase().includes(q));
  }, [grupos, busquedaDebounced]);

  const totalPaginas = useMemo(
    () => Math.max(1, Math.ceil(gruposFiltrados.length / POR_PAGINA)),
    [gruposFiltrados]
  );

  const gruposPagina = useMemo(() => {
    const desde = (pagina - 1) * POR_PAGINA;
    return gruposFiltrados.slice(desde, desde + POR_PAGINA);
  }, [gruposFiltrados, pagina]);

  // Reset a página 1 al cambiar la búsqueda
  useEffect(() => { setPagina(1); }, [busquedaDebounced]);

  return {
    grupos,
    gruposFiltrados,
    gruposPagina,
    totalPaginas,
    busqueda,
    setBusqueda,
    busquedaDebounced,
    pagina,
    setPagina,
  };
}