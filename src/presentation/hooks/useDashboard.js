// src/presentation/hooks/useDashboard.js
// Sprint 14 — React Query

import { useQuery } from '@tanstack/react-query';
import api from '../api/api';

export const dashboardKeys = {
  resumen: () => ['dashboard', 'resumen'],
};

// KPIs vacíos para placeholderData — evita que los contadores muestren
// "---" o undefined mientras carga. El componente recibe 0s en lugar de null.
const RESUMEN_PLACEHOLDER = {
  ingresos_totales:    0,
  total_pedidos:       0,
  pedidos_pendientes:  0,
  pedidos_completados: 0,
  total_proformas:     0,
  proformas_pendientes: 0,
};

export function useDashboardResumen() {
  return useQuery({
    queryKey: dashboardKeys.resumen(),
    queryFn:  async () => {
      const { data } = await api.get('/dashboard/resumen');

      // Maneja ambas formas de respuesta del backend:
      //   { success: true, data: { ingresos_totales, ... } }  → extrae data.data
      //   { ingresos_totales, ... }                           → usa directo
      // Evita el bug de KPIs en "---" por diferencia en contrato de datos.
      const resumen = data?.data ?? data;

      if (!resumen || typeof resumen !== 'object') {
        throw new Error('Respuesta inesperada del servidor');
      }

      return resumen;
    },
    staleTime: 2 * 60 * 1000, // 2 min — datos agregados, no críticos al segundo

    // Override explícito — el queryClient global tiene refetchOnWindowFocus: false.
    // El dashboard de admin es la excepción: conviene refrescar al volver
    // a la pestaña para ver métricas actualizadas sin acción manual.
    refetchOnWindowFocus: true,

    // placeholderData: muestra 0s mientras carga la primera vez.
    // Evita el flash de "---" en los KPIs sin necesidad de skeleton complejo.
    // React Query distingue placeholderData de data real → isPlaceholderData=true
    // mientras sigue la request en vuelo.
    placeholderData: RESUMEN_PLACEHOLDER,
  });
}