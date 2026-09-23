// src/presentation/context/AccessibilityContext.jsx
// 🚀 Sprint 13.2 — Fix CLS 0.18: lazy initializers + useLayoutEffect

import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useCallback,
} from 'react';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility debe usarse dentro de AccessibilityProvider');
  }
  return context;
};

const THEME_TRANSITION_MS = 220;

// Claves de preferencias en localStorage — centralizadas para evitar typos
const PREF_KEYS = {
  theme:         'theme',
  fontSize:      'fontSize',
  highContrast:  'highContrast',
  reduceMotion:  'reduceMotion',
};

export const AccessibilityProvider = ({ children }) => {

  // 🚀 Lazy initializers — leen localStorage sincrónicamente antes del render 1.
  // Render 1 ya tiene los valores correctos → no hay segundo render por preferencias
  // → html.style.fontSize nunca cambia después del primer paint → CLS 0.
  const [theme, setTheme] = useState(() =>
    localStorage.getItem(PREF_KEYS.theme) || 'dark'
  );
  const [fontSize, setFontSize] = useState(() =>
    localStorage.getItem(PREF_KEYS.fontSize) || 'medium'
  );
  const [highContrast, setHighContrast] = useState(() =>
    localStorage.getItem(PREF_KEYS.highContrast) === 'true'
  );
  const [reduceMotion, setReduceMotion] = useState(() =>
    localStorage.getItem(PREF_KEYS.reduceMotion) === 'true'
  );

  // 🚀 useLayoutEffect — aplica clases y fontSize ANTES del primer paint.
  //
  // useEffect  → corre DESPUÉS de que el browser pinta → el usuario ve
  //              brevemente el estado incorrecto → CLS.
  //
  // useLayoutEffect → corre sincrónicamente ANTES de que el browser
  //              pinte (mismo frame que el commit de React) → el browser
  //              nunca ve el estado incorrecto → CLS 0.
  useLayoutEffect(() => {
  const body = document.body;
  const html = document.documentElement;

  // Limpiar ambas clases de tema antes de aplicar la correcta
  body.classList.remove('theme-light', 'high-contrast');

  if (highContrast) {
    // HC tiene prioridad — anula cualquier tema de color
    body.classList.add('high-contrast');
  } else if (theme === 'light') {
    body.classList.add('theme-light');
  }
  // theme === 'dark' → ninguna clase extra, es el default de :root

  body.classList.remove('font-small', 'font-medium', 'font-large');
  body.classList.add(`font-${fontSize}`);

  html.style.fontSize =
    fontSize === 'small'  ? '14px' :
    fontSize === 'large'  ? '18px' : '16px';

  body.classList.toggle('reduce-motion', reduceMotion);
}, [theme, fontSize, highContrast, reduceMotion]);

  // ── Helper: overlay de transición ────────────────────────────────────────
  const withTransitionOverlay = useCallback((fn) => {
    const body = document.body;
    if (!body.classList.contains('reduce-motion')) {
      body.classList.add('theme-switching');
      setTimeout(() => {
        body.classList.remove('theme-switching');
      }, THEME_TRANSITION_MS);
    }
    fn();
  }, []);

  // ── Acciones ──────────────────────────────────────────────────────────────
  const toggleDarkMode = useCallback(() => {
    withTransitionOverlay(() => {
      setTheme((prev) => {
        const next = prev === 'dark' ? 'light' : 'dark';
        localStorage.setItem(PREF_KEYS.theme, next);
        return next;
      });
      // Desactivar HC al cambiar tema — no pueden coexistir
      setHighContrast(false);
      localStorage.setItem(PREF_KEYS.highContrast, 'false');
    });
  }, [withTransitionOverlay]);

  const changeFontSize = useCallback((size) => {
    setFontSize(size);
    localStorage.setItem(PREF_KEYS.fontSize, size);
  }, []);

  const toggleHighContrast = useCallback(() => {
    withTransitionOverlay(() => {
      setHighContrast((prev) => {
        const next = !prev;
        localStorage.setItem(PREF_KEYS.highContrast, next);
        if (next) {
          // HC activo → theme-light debe desactivarse
          setTheme('dark');
          localStorage.setItem(PREF_KEYS.theme, 'dark');
        }
        return next;
      });
    });
  }, [withTransitionOverlay]);

  const toggleReduceMotion = useCallback(() => {
    setReduceMotion((prev) => {
      const next = !prev;
      localStorage.setItem(PREF_KEYS.reduceMotion, next);
      return next;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    withTransitionOverlay(() => {
      // ⚠️ FIX: NO usar localStorage.clear() — eliminaría también 'user'
      // y desautenticaría al usuario en mitad de sesión.
      // Solo eliminar las claves de preferencias.
      Object.values(PREF_KEYS).forEach((key) => localStorage.removeItem(key));

      setTheme('dark');
      setFontSize('medium');
      setHighContrast(false);
      setReduceMotion(false);
      document.documentElement.style.fontSize = '16px';
    });
  }, [withTransitionOverlay]);

  return (
    <AccessibilityContext.Provider
      value={{
        darkMode: theme === 'dark',
        fontSize,
        highContrast,
        reduceMotion,
        toggleDarkMode,
        changeFontSize,
        toggleHighContrast,
        toggleReduceMotion,
        resetPreferences,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};