// src/presentation/hooks/usePedidos.js
// Sprint 14 — React Query
// 🐛 Fix Sprint 18 — useActualizarEstadoPedido: ruta corregida a /pedidos/:id/estado
//                    useActualizarPedido llamaba a PUT /pedidos/:id (404)
//                    La ruta del backend es PUT /pedidos/:id/estado

import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/api';
import queryClient from '../api/queryClient';

// ── Query Keys ────────────────────────────────────────────────────────────────
// Centralizadas aquí para evitar typos y facilitar invalidaciones.
//
// Estructura jerárquica:
//   ['pedidos']                    → invalida TODO lo relacionado a pedidos
//   ['pedidos', 'list', filters]   → invalida solo listas (con o sin filtros)
//   ['pedidos', 'detail', id]      → invalida solo el detalle de un pedido
export const pedidosKeys = {
  all:    ()             => ['pedidos'],
  lists:  ()             => ['pedidos', 'list'],
  list:   (filters = {}) => ['pedidos', 'list', filters],
  detail: (id)           => ['pedidos', 'detail', id],
};

// ── usePedidos — lista completa ───────────────────────────────────────────────
export function usePedidos(filters = {}) {
  return useQuery({
    queryKey: pedidosKeys.list(filters),
    queryFn:  async () => {
      const { data } = await api.get('/pedidos', { params: filters });
      return data;
    },
    // staleTime heredado del QueryClient (30s).
    // Sobreescribir aquí si pedidos necesitan estar más frescos:
    // staleTime: 10_000,
  });
}

// ── usePedido — detalle de un pedido ─────────────────────────────────────────
export function usePedido(id) {
  return useQuery({
    queryKey: pedidosKeys.detail(id),
    queryFn:  async () => {
      const { data } = await api.get(`/pedidos/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ── useCrearPedido ────────────────────────────────────────────────────────────
export function useCrearPedido() {
  return useMutation({
    mutationFn: async (nuevoPedido) => {
      const { data } = await api.post('/pedidos', nuevoPedido);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
    },
  });
}

// ── useActualizarEstadoPedido ─────────────────────────────────────────────────
// 🐛 Fix Sprint 18: ruta corregida de PUT /pedidos/:id → PUT /pedidos/:id/estado
//
// El backend expone:
//   PUT   /api/pedidos/:id/estado  → updateEstado (con inactivityGuard)
//   PATCH /api/pedidos/:id/estado  → updateEstado (alias)
//
// Body esperado: { estado: 'PROCESADO' | 'ENTREGADO' | 'CANCELADO' }
// Transiciones válidas (definidas en el controller):
//   PENDIENTE → PROCESADO, ENTREGADO, CANCELADO
//   PROCESADO → ENTREGADO, CANCELADO
//   ENTREGADO → (ninguna)
//   CANCELADO → (ninguna)
export function useActualizarEstadoPedido() {
  return useMutation({
    mutationFn: async ({ id, estado }) => {
      const { data } = await api.put(`/pedidos/${id}/estado`, { estado });
      return data;
    },
    onSuccess: (data, { id }) => {
      // Actualiza el detalle en cache con el nuevo estado (sin refetch)
      queryClient.setQueryData(pedidosKeys.detail(id), (prev) =>
        prev ? { ...prev, estado: data.estado_nuevo } : prev
      );
      // Invalida todas las listas para que reflejen el cambio
      queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
    },
  });
}

// ── useActualizarPedido ───────────────────────────────────────────────────────
export function useActualizarPedido() {
  return useMutation({
    mutationFn: async ({ id, ...cambios }) => {
      const { data } = await api.put(`/pedidos/${id}`, cambios);
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(pedidosKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
    },
  });
}

// ── useEliminarPedido ─────────────────────────────────────────────────────────
export function useEliminarPedido() {
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/pedidos/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: pedidosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
    },
  });
}