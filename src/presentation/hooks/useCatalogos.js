// src/presentation/hooks/useCatalogos.js
// Sprint 14 — React Query
// Sprint 18 — useTrabajos acepta soloBase para filtrar variantes

import { useQuery } from '@tanstack/react-query';
import api from '../api/api';

export const catalogosKeys = {
  trabajos:          (soloBase) => ['catalogos', 'trabajos', soloBase ? 'base' : 'todos'],
  colores:           ()         => ['catalogos', 'colores'],
  coloresTrabajo:    ()         => ['catalogos', 'colores-trabajo'],
};

// ── useTrabajos ───────────────────────────────────────────────────────────────
// soloBase=true  → solo registros sin variante (Proformas, VisualizadorIA, etc.)
// soloBase=false → todos incluidas variantes (Referencias)
export function useTrabajos(soloBase = true) {
  return useQuery({
    queryKey: catalogosKeys.trabajos(soloBase),
    queryFn:  async () => {
      const url = soloBase ? '/trabajos?activo=1&solo_base=1' : '/trabajos?activo=1';
      const { data } = await api.get(url);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── useColores (Previsualizacion — endpoint /colores) ─────────────────────────
export function useColores() {
  return useQuery({
    queryKey: catalogosKeys.colores(),
    queryFn:  async () => {
      const { data } = await api.get('/colores');
      if (data?.success) return Array.isArray(data.data) ? data.data : [];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── useColoresTrabajo (Proformas — endpoint /trabajos/colores) ─────────────────
export function useColoresTrabajo() {
  return useQuery({
    queryKey: catalogosKeys.coloresTrabajo(),
    queryFn:  async () => {
      const { data } = await api.get('/trabajos/colores');
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}