// src/presentation/api/api.js
// Sprint 12.5 — refreshToken migrado a httpOnly Cookie
// Sprint 14   — baseURL dinámica por entorno
// Sprint 16   — Fix red local: baseURL relativa en DEV para proxy Vite
// Sprint 17   — CSRF: header X-CSRF-Token en requests mutantes

import axios from 'axios';

// Dev: ruta relativa → el proxy de Vite (vite.config.js) redirige /api → :5000.
// Funciona desde localhost Y desde cualquier dispositivo en la red local.
// Prod: VITE_API_URL apunta directo al backend (https://tudominio.com/api).
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  timeout:         10000,
  headers:         { 'Content-Type': 'application/json' },
  withCredentials: true, // 🍪 Sprint 12.5 — cookie httpOnly refreshToken
});

// ── Helper: leer csrf-token de las cookies ───────────────────────────────────
// La cookie NO es httpOnly — el backend la emite legible por JS
// para que podamos hacer el double-submit.
function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf-token='))
    ?.split('=')[1] ?? null;
}

// ── Interceptor de request — adjuntar X-CSRF-Token en mutantes ──────────────
// Sprint 17: CSRF formal mediante double-submit cookie.
// Solo se añade el header en métodos que mutan estado en el servidor.
// GET, HEAD y OPTIONS quedan sin header (no lo necesitan).
const METODOS_MUTANTES = new Set(['post', 'put', 'patch', 'delete']);

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Si es FormData, dejamos que el navegador ponga el Content-Type con boundary.
    delete config.headers['Content-Type'];
  }
  
  if (METODOS_MUTANTES.has(config.method?.toLowerCase())) {
    const token = getCsrfToken();
    if (token) {
      config.headers['X-CSRF-Token'] = token;
    }
  }
  return config;
});

// ── Interceptor de respuesta — solo propagación de errores ──────────────────
// El manejo de 401 + refresh vive en AuthContext (interceptor reactivo).
// React Query maneja el cache — este interceptor ya no almacena nada.
api.interceptors.response.use(
  (response) => response,
  (error)    => Promise.reject(error)
);

export default api;