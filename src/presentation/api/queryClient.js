// src/presentation/api/queryClient.js
// Sprint 14 — Configuración central de React Query
//
// Un solo QueryClient compartido por toda la app.
// Se importa en:
//   - src/index.jsx       → <QueryClientProvider client={queryClient}>
//   - hooks (usePedidos, etc.) → queryClient.invalidateQueries()
//   - mutaciones          → queryClient.setQueryData() para optimistic updates

import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: 30s — equivalente al CACHE_DURATION del cache manual anterior.
      // Durante este tiempo React Query devuelve datos cacheados sin refetch.
      // Al vencer, el próximo mount/focus hace refetch en background.
      staleTime: 30 * 1000,

      // gcTime (antes cacheTime): cuánto tiempo se mantienen datos en memoria
      // después de que el último componente que los usa se desmonta.
      // 5 min → si el usuario regresa a una vista, tiene datos inmediatos.
      gcTime: 5 * 60 * 1000,

      // retry: cubre todo el rango 4xx — estos errores son deterministas,
      // repetir la request no los va a resolver. Solo reintenta errores de red
      // o 5xx (servidor temporalmente caído).
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status >= 400 && status < 500) return false;
        return failureCount < 1;
      },

      // refetchOnWindowFocus: false — evita refetch automático al hacer
      // alt+tab. Puede activarse a true si se necesita data muy fresca.
      refetchOnWindowFocus: false,

      // placeholderData: mantiene los datos anteriores visibles mientras
      // se hace un refetch en background. Evita el flash de skeleton/spinner
      // cuando el usuario navega entre vistas que ya tienen datos en cache.
      placeholderData: (previousData) => previousData,
    },
    mutations: {
      // Sin retry en mutaciones — no repetir POST/PUT/DELETE automáticamente.
      retry: false,
    },
  },
});

export default queryClient;