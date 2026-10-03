// src/presentation/components/common/AccessibilityPanel/useAccessibilityPanel.js

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAccessibility } from '../../../context/useAccessibility';

export function useAccessibilityPanel() {
  const {
    darkMode,
    fontSize,
    highContrast,
    reduceMotion,
    toggleDarkMode,
    changeFontSize,
    toggleHighContrast,
    toggleReduceMotion,
    resetPreferences,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  // Ref al botón trigger — para devolver el foco al cerrar el panel.
  // Sin esto, al cerrar el panel el foco queda en el body y el usuario
  // de teclado tiene que navegar toda la página de nuevo.
  const triggerRef = useRef(null);

  // Ref al panel — para trap de foco y mover el foco al abrir.
  const panelRef = useRef(null);

  /* ── Abrir / cerrar ──────────────────────────────────────────────────────── */
  const abrirPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const cerrarPanel = useCallback(() => {
    setIsOpen(false);
    // Devolver el foco al trigger en el SIGUIENTE tick para que el panel
    // ya no esté visible antes de mover el foco (si se hace síncronamente,
    // el browser puede ignorarlo porque inert aún no se aplicó).
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  /* ── Mover foco al primer elemento al abrir (WAI-ARIA dialog pattern) ───── */
  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });
  }, [isOpen]);

  /* ── Trap de foco (Tab/Shift+Tab se quedan dentro del panel) ─────────────
     Sin esto, Tab desde el último elemento salta al resto de la página
     que está detrás del overlay — violación WCAG 2.1 criterio 2.1.2.     */
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      cerrarPanel();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusables = Array.from(
      panelRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), ' +
        '[tabindex]:not([tabindex="-1"])'
      ) ?? []
    );

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }, [isOpen, cerrarPanel]);

  /* ── Anuncio a lector de pantalla ────────────────────────────────────────── */
  const announce = useCallback((msg) => {
    const el = document.getElementById('accessibility-announcement');
    if (el) el.textContent = msg;
  }, []);

  /* ── Handlers de configuración ───────────────────────────────────────────── */
  const handleDarkMode = useCallback(() => {
    if (highContrast) return;
    toggleDarkMode();
    announce(darkMode ? 'Modo oscuro desactivado' : 'Modo oscuro activado');
  }, [highContrast, darkMode, toggleDarkMode, announce]);

  const handleFontSize = useCallback((size) => {
    changeFontSize(size);
    announce(
      `Tamaño de fuente cambiado a ${
        size === 'small' ? 'pequeño' : size === 'large' ? 'grande' : 'mediano'
      }`
    );
  }, [changeFontSize, announce]);

  const handleHighContrast = useCallback(() => {
    toggleHighContrast();
    announce(highContrast
      ? 'Alto contraste desactivado'
      : 'Alto contraste activado — modo oscuro seleccionado'
    );
  }, [highContrast, toggleHighContrast, announce]);

  const handleReduceMotion = useCallback(() => {
    toggleReduceMotion();
    announce(reduceMotion ? 'Animaciones habilitadas' : 'Animaciones reducidas');
  }, [reduceMotion, toggleReduceMotion, announce]);

  const handleReset = useCallback(() => {
    resetPreferences();
    announce('Preferencias de accesibilidad reiniciadas');
  }, [resetPreferences, announce]);

  return {
    /* estado accesibilidad */
    darkMode, fontSize, highContrast, reduceMotion,
    /* estado panel */
    isOpen,
    /* refs */
    triggerRef, panelRef,
    /* handlers panel */
    abrirPanel, cerrarPanel, handleKeyDown,
    /* handlers configuración */
    handleDarkMode, handleFontSize,
    handleHighContrast, handleReduceMotion, handleReset,
  };
}