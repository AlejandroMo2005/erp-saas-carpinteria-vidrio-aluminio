// src/presentation/hooks/useProformas.js
// Sprint 14 — React Query

import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/api';
import queryClient from '../api/queryClient';
import { pedidosKeys } from './usePedidos';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const proformasKeys = {
  all:    ()             => ['proformas'],
  lists:  ()             => ['proformas', 'list'],
  list:   (filters = {}) => ['proformas', 'list', filters],
  detail: (id)           => ['proformas', 'detail', id],
};

// ── useProformas — lista con filtros opcionales (estado, cliente, fecha) ──────
export function useProformas(filters = {}) {
  return useQuery({
    queryKey: proformasKeys.list(filters),
    queryFn:  async () => {
      const { data } = await api.get('/proformas', { params: filters });
      return data;
    },
  });
}

// ── useProforma — detalle ─────────────────────────────────────────────────────
export function useProforma(id) {
  return useQuery({
    queryKey: proformasKeys.detail(id),
    queryFn:  async () => {
      const { data } = await api.get(`/proformas/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ── useCrearProforma ──────────────────────────────────────────────────────────
export function useCrearProforma() {
  return useMutation({
    mutationFn: async (nuevaProforma) => {
      const { data } = await api.post('/proformas', nuevaProforma);
      return data;
    },
    onSuccess: () => {
      // Invalida todas las listas de proformas (con y sin filtros)
      queryClient.invalidateQueries({ queryKey: proformasKeys.lists() });
    },
  });
}

// ── useActualizarProforma ─────────────────────────────────────────────────────
export function useActualizarProforma() {
  return useMutation({
    mutationFn: async ({ id, ...cambios }) => {
      const { data } = await api.put(`/proformas/${id}`, cambios);
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(proformasKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: proformasKeys.lists() });
    },
  });
}

// ── useConvertirProformaAPedido ───────────────────────────────────────────────
// Mutación especial: crea un pedido a partir de una proforma aprobada.
// Invalida tanto proformas como pedidos usando sus respectivas query keys.
export function useConvertirProformaAPedido() {
  return useMutation({
    mutationFn: async (proformaId) => {
      const { data } = await api.post(`/proformas/${proformaId}/convertir`);
      return data;
    },
    onSuccess: () => {
      // Invalida listas de proformas (la proforma cambia de estado)
      queryClient.invalidateQueries({ queryKey: proformasKeys.lists() });
      // Invalida listas de pedidos (se creó uno nuevo)
      // Usa pedidosKeys importado — consistente con usePedidos.js
      queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
    },
  });
}

// ── useEliminarProforma ───────────────────────────────────────────────────────
export function useEliminarProforma() {
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/proformas/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: proformasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: proformasKeys.lists() });
    },
  });
}