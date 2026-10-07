// src/presentation/hooks/useMateriales.js
// Sprint 14 — React Query

import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/api';
import queryClient from '../api/queryClient';

// ── Query Keys ────────────────────────────────────────────────────────────────
// lists() como clave padre cubre todas las listas con y sin filtros.
// materialesKeys.list() sin args daba ['materiales','list',{}] — no matcheaba
// listas con filtros activos → esas quedaban stale después de mutaciones.
export const materialesKeys = {
  all:        ()             => ['materiales'],
  lists:      ()             => ['materiales', 'list'],
  list:       (filters = {}) => ['materiales', 'list', filters],
  conColores: ()             => ['materiales', 'con-colores'],
  detail:     (id)           => ['materiales', 'detail', id],
  variante:   (id)           => ['materiales', 'variante', id],
};

// ── useMateriales — lista con filtros opcionales (categoría, búsqueda) ────────
export function useMateriales(filters = {}) {
  return useQuery({
    queryKey: materialesKeys.list(filters),
    queryFn:  async () => {
      const { data } = await api.get('/materiales', { params: filters });
      return data;
    },
    staleTime: 60 * 1000, // 1 min — materiales cambian menos frecuentemente
  });
}

// ── useMaterial — detalle de un material ──────────────────────────────────────
export function useMaterial(id) {
  return useQuery({
    queryKey: materialesKeys.detail(id),
    queryFn:  async () => {
      const { data } = await api.get(`/materiales/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ── useCrearMaterial ──────────────────────────────────────────────────────────
export function useCrearMaterial() {
  return useMutation({
    mutationFn: async (nuevoMaterial) => {
      const { data } = await api.post('/materiales', nuevoMaterial);
      return data;
    },
    onSuccess: () => {
      // Invalida todas las listas y también con-colores
      // (el nuevo material puede aparecer en ambas vistas)
      void queryClient.invalidateQueries({ queryKey: materialesKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: materialesKeys.conColores() });
    },
  });
}

// ── useActualizarMaterial ─────────────────────────────────────────────────────
export function useActualizarMaterial() {
  return useMutation({
    mutationFn: async ({ id, ...cambios }) => {
      const { data } = await api.put(`/materiales/${id}`, cambios);
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(materialesKeys.detail(id), data);
      // Usar lists() — invalida cualquier combinación de filtros activos
      void queryClient.invalidateQueries({ queryKey: materialesKeys.lists() });
    },
  });
}

// ── useActualizarStock ────────────────────────────────────────────────────────
// Mutación específica para ajustes de stock (entrada/salida de inventario)
export function useActualizarStock() {
  return useMutation({
    mutationFn: async ({ id, cantidad, tipo }) => {
      // tipo: 'entrada' | 'salida'
      const { data } = await api.patch(`/materiales/${id}/stock`, { cantidad, tipo });
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(materialesKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: materialesKeys.lists() });
    },
  });
}

// ── useEliminarMaterial ───────────────────────────────────────────────────────
export function useEliminarMaterial() {
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/materiales/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: materialesKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: materialesKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: materialesKeys.conColores() });
    },
  });
}

// ── useMaterialesConColores — endpoint específico de Materiales.jsx ───────────
// Devuelve el array flat de variantes con color_valor incluido.
// staleTime: 60s — stock puede cambiar al guardar una variante.
export function useMaterialesConColores() {
  return useQuery({
    queryKey: materialesKeys.conColores(),
    queryFn:  async () => {
      const { data } = await api.get('/materiales/con-colores');
      if (!data.success) throw new Error('Respuesta inesperada del servidor');
      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 60 * 1000,
  });
}

// ── useActualizarVariante — PUT /materiales/variante/:id ──────────────────────
// Usado en Materiales.jsx para actualizar stock y precio de una variante.
// El componente hace optimistic update manual con setQueryData antes de llamar
// esta mutación. onError fuerza refetch limpio para revertir si falla el backend.
export function useActualizarVariante() {
  return useMutation({
    mutationFn: async ({ varianteId, stock, precio }) => {
      const { data } = await api.put(`/materiales/variante/${varianteId}`, { stock, precio });
      return data;
    },
    onError: () => {
      // Rollback visual: invalida el cache para que el próximo render
      // obtenga datos frescos del servidor con el stock/precio original.
      void queryClient.invalidateQueries({ queryKey: materialesKeys.conColores() });
    },
    // onSuccess: no invalida — el componente ya hizo setQueryData optimista.
    // Si se necesita verificar contra el servidor, agregar:
    // onSuccess: () => queryClient.invalidateQueries({ queryKey: materialesKeys.conColores() }),
  });
}
