// src/presentation/context/AuthContext.jsx
// ⭐ Sprint 10   — Security Hardening
// 🔒 Sprint 12   — Refresh proactivo + sessionExpired + visibilitychange + storage sync
// 🐛 Sprint 12 Fix — Resolución de dependencia circular tryRefreshSilent / scheduleProactiveRefresh
// 🐛 Sprint 13 Fix — 429 Too Many Requests en /auth/refresh
// 🍪 Sprint 12.5 — refreshToken migrado a httpOnly Cookie
// 🚀 Sprint 13.2 — Fix CLS: lazy initializer sincrónico (reemplaza optimistic render)
// 🔧 Sprint 14   — visibilitychange no agrega beforeunload (bloquearía bfcache)
//
// CAMBIO Sprint 13.2 — Lazy initializer (fix CLS 0.12):
//
//   PROBLEMA ANTERIOR (optimistic render con useEffect):
//     useState(null)  → render 1: user=null,    loading=true  → <LoadingFallback>
//     useEffect corre → render 2: user=cached,  loading=false → <Dashboard>
//     Browser pintó dos layouts distintos (spinner 400px → navbar+grid) → CLS 0.12
//
//   SOLUCIÓN — lazy initializer:
//     useState(() => JSON.parse(localStorage.getItem('user')))
//     Corre UNA VEZ sincrónicamente antes del render 1.
//     Render 1 ya tiene user=cached, loading=false → <Dashboard> directo → CLS 0.
//
//   EL useEffect de inicialización se simplifica:
//     Ya NO hace setUser ni setLoading (evita renders redundantes).
//     Solo lanza el refresh en background y programa el proactivo.
//
//   SEGURIDAD sin cambios:
//     El token se verifica en background (tryRefreshSilent).
//     Si el token expiró → expireSession() → Login.
//     El interceptor 401 sigue activo para cualquier request fallida.
//
// ⚠️  DEUDA TÉCNICA Sprint 15:
//     NO agregar beforeunload aquí — bloquea el bfcache en todos los
//     navegadores (confirmado en Lighthouse: bfcache failure reason).
//     Si se necesita limpiar al cerrar la pestaña, usar pagehide con
//     persisted=false en su lugar.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import api from '../api/api';

// ── accessToken en memoria del módulo ─────────────────────────────────────────
// No va a localStorage ni sessionStorage — vive solo en memoria JS.
// Si el usuario recarga la página, tryRefreshSilent lo restaura via cookie.
let _accessToken = null;

const setAccessToken = (token) => {
  _accessToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

const getAccessToken = () => _accessToken;

// ── Parsear expiresIn a milisegundos ──────────────────────────────────────────
const parseExpiresIn = (expiresIn) => {
  if (!expiresIn) return 15 * 60 * 1000;
  if (typeof expiresIn === 'number') return expiresIn * 1000;
  const match = String(expiresIn).match(/^(\d+)(m|s|h)?$/);
  if (!match) return 15 * 60 * 1000;
  const value = parseInt(match[1]);
  const unit  = match[2] || 'm';
  return unit === 'h' ? value * 3600000
       : unit === 's' ? value * 1000
       :                value * 60000;
};

// ── Cooldown entre refreshes exitosos ─────────────────────────────────────────
// Evita el 429 Too Many Requests del Sprint 13 Fix.
// Si el último refresh fue hace menos de 30s y hay token en memoria,
// se devuelve el token actual sin llamar al backend.
const REFRESH_COOLDOWN_MS = 30_000;

// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {

  // 🚀 Sprint 13.2 — Lazy initializer: corre sincrónicamente antes del render 1.
  //
  // ANTES:  useState(null)  → render 1 siempre empieza con user=null
  //         useEffect       → render 2 con user=cached → CLS 0.12
  //
  // AHORA:  el lazy initializer lee localStorage UNA VEZ antes del primer render.
  //         render 1 ya tiene el estado correcto → un solo render → CLS 0.
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  // loading=false desde el inicio — el lazy initializer ya resolvió el estado.
  // No hay nada que "esperar" antes de pintar la UI.
  const [loading,        setLoading]        = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const isRefreshing   = useRef(false);
  const refreshPromise = useRef(null);
  const refreshQueue   = useRef([]);
  const refreshTimer   = useRef(null);
  const lastRefreshAt  = useRef(0);

  // ── Limpiar timer de refresh proactivo ────────────────────────────────────
  const clearRefreshTimer = () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  // ── expireSession ─────────────────────────────────────────────────────────
  const expireSession = useCallback(() => {
    clearRefreshTimer();
    setAccessToken(null);
    localStorage.removeItem('user');
    setUser(null);
    setSessionExpired(true);
  }, []);

  // ── Procesar cola de requests pendientes durante refresh ──────────────────
  const processQueue = (error, token = null) => {
    refreshQueue.current.forEach(({ resolve, reject }) => {
      error ? reject(error) : resolve(token);
    });
    refreshQueue.current = [];
  };

  // ── Logout voluntario ─────────────────────────────────────────────────────
  const logout = useCallback(async (callBackend = true) => {
    clearRefreshTimer();
    if (callBackend) {
      // Fire-and-forget: no bloquear el logout local si el backend falla.
      api.post('/auth/logout').catch(() => {});
    }
    setAccessToken(null);
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // ── tryRefreshSilent ──────────────────────────────────────────────────────
  const tryRefreshSilent = useCallback(async () => {
    // Guard 1: cooldown — evita 429 por múltiples refreshes en ráfaga
    const msSinceLastRefresh = Date.now() - lastRefreshAt.current;
    if (msSinceLastRefresh < REFRESH_COOLDOWN_MS && _accessToken) {
      const remainingMs = REFRESH_COOLDOWN_MS - msSinceLastRefresh;
      return {
        accessToken: _accessToken,
        expiresIn:   Math.ceil(remainingMs / 1000),
      };
    }

    // Guard 2: si ya hay un refresh en curso, encolar y esperar esa Promise
    if (isRefreshing.current && refreshPromise.current) {
      return refreshPromise.current;
    }

    isRefreshing.current = true;

    refreshPromise.current = (async () => {
      try {
        // Usar fetch nativo (no axios) para evitar que el interceptor 401
        // de axios capture esta request y genere un loop infinito.
        const baseURL  = (api.defaults.baseURL || '').replace(/\/$/, '');
        const response = await fetch(`${baseURL}/auth/refresh`, {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include', // 🍪 envía la cookie httpOnly
        });

        if (!response.ok) return null;

        const data = await response.json();

        if (data.success && data.accessToken) {
          setAccessToken(data.accessToken);
          lastRefreshAt.current = Date.now();
          return {
            accessToken: data.accessToken,
            expiresIn:   data.expiresIn || '15m',
          };
        }

        return null;
      } catch {
        return null;
      } finally {
        isRefreshing.current   = false;
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, []);

  // ── scheduleProactiveRefresh ──────────────────────────────────────────────
  // Programa un refresh 60s antes de que expire el token.
  // Así el usuario nunca experimenta un 401 en mid-request.
  const scheduleProactiveRefresh = useCallback((expiresIn) => {
    clearRefreshTimer();
    const tokenMs   = parseExpiresIn(expiresIn);
    const refreshEn = Math.max(tokenMs - 60000, 10000); // mínimo 10s

    refreshTimer.current = setTimeout(async () => {
      const result = await tryRefreshSilent();
      if (!result) {
        expireSession();
      } else {
        scheduleProactiveRefresh(result.expiresIn);
      }
    }, refreshEn);
  }, [tryRefreshSilent, expireSession]);

  // ── Inicialización — verificación en background ───────────────────────────
  //
  // El estado YA está inicializado por el lazy initializer.
  // Este useEffect SOLO:
  //   1. Verifica el refreshToken con el backend (no bloquea el render)
  //   2. Si válido  → programa el refresh proactivo
  //   3. Si expirado → expireSession() → Login
  //
  // setTimeout(fn, 0): cede el control al browser para que pinte
  // el primer frame ANTES de hacer la request de red.
  useEffect(() => {
    const hasUser = !!localStorage.getItem('user');
    if (!hasUser) return;

    const timerId = setTimeout(async () => {
      try {
        const result = await tryRefreshSilent();
        if (!result) {
          expireSession();
        } else {
          scheduleProactiveRefresh(result.expiresIn);
        }
      } catch {
        await logout(false);
      }
    }, 0);

    return () => clearTimeout(timerId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── visibilitychange ──────────────────────────────────────────────────────
  // Verifica el token cuando el usuario vuelve a la pestaña.
  // ⚠️ NO usar beforeunload aquí — bloquea el bfcache (Sprint 15 deuda técnica).
  //    Si se necesita limpiar al cerrar, usar 'pagehide' con persisted=false.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || !user) return;
      const result = await tryRefreshSilent();
      if (!result) {
        expireSession();
      } else {
        scheduleProactiveRefresh(result.expiresIn);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, tryRefreshSilent, expireSession, scheduleProactiveRefresh]);

  // ── storage event: sincronizar logout entre pestañas ─────────────────────
  // Si el usuario cierra sesión en otra pestaña, esta también se desautentica.
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' && !e.newValue && user) {
        clearRefreshTimer();
        setAccessToken(null);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // ── Axios interceptor: manejo reactivo de 401 ────────────────────────────
  // Cuando una request falla con 401, intenta refrescar el token y reintenta.
  // Si el refresh también falla → expireSession().
  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,

      async (error) => {
        const originalRequest = error.config;

        // Solo manejar 401 no reintentados
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        // Si el 401 viene del propio refresh o login → no reintentar
        if (
          originalRequest.url?.includes('/auth/refresh') ||
          originalRequest.url?.includes('/auth/login')
        ) {
          expireSession();
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        // Si ya hay un refresh en curso → encolar esta request
        if (isRefreshing.current) {
          return new Promise((resolve, reject) => {
            refreshQueue.current.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        try {
          const result = await tryRefreshSilent();

          if (result) {
            scheduleProactiveRefresh(result.expiresIn);
            processQueue(null, result.accessToken);
            originalRequest.headers['Authorization'] = `Bearer ${result.accessToken}`;
            return api(originalRequest);
          } else {
            processQueue(new Error('Sesión expirada'), null);
            expireSession();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          expireSession();
          return Promise.reject(refreshError);
        }
      }
    );

    return () => api.interceptors.response.eject(interceptorId);
  }, [tryRefreshSilent, expireSession, scheduleProactiveRefresh]);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback((userData) => {
    const { user: userInfo, accessToken, expiresIn } = userData;
    setAccessToken(accessToken);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    setSessionExpired(false);
    lastRefreshAt.current = Date.now();
    scheduleProactiveRefresh(expiresIn || '15m');
  }, [scheduleProactiveRefresh]);

  // ── updateUser ────────────────────────────────────────────────────────────
  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  // ── Limpiar timer al desmontar el provider ────────────────────────────────
  useEffect(() => () => clearRefreshTimer(), []);

  // ── Valor expuesto al árbol de componentes ────────────────────────────────
  const value = {
    user,
    loading,
    isAuthenticated:     !!user,
    isAdmin:             user?.rol === 'ADMIN',
    isVendedor:          user?.rol === 'VENDEDOR',
    isCliente:           user?.rol === 'CLIENTE',
    isAlmacen:           user?.rol === 'ALMACEN',
    isVisor:             user?.rol === 'VISOR',
    sessionExpired,
    clearSessionExpired: () => setSessionExpired(false),
    getAccessToken,
    login,
    logout:              () => logout(true),
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};