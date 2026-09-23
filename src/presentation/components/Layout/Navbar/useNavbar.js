// src/presentation/components/Layout/Navbar/useNavbar.js

import { useState, useEffect, useCallback } from 'react';
import { buildNavItems, ROL_LABELS } from './constants';

export function useNavbar({ usuario, onAbrirPerfil, onCerrarSesion }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const navItems = buildNavItems(usuario?.rol || 'CLIENTE');

  const inicial = (usuario?.nombre_completo || usuario?.nombre || '?')
    .charAt(0).toUpperCase();

  const rolLabel = ROL_LABELS[usuario?.rol] ?? usuario?.rol ?? '—';

  /* ── Cerrar con Escape ───────────────────────────────────────────────────── */
  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);

  useEffect(() => {
    if (!menuAbierto) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') cerrarMenu(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuAbierto, cerrarMenu]);

  /* ── Handlers ────────────────────────────────────────────────────────────── */
  const toggleMenu = useCallback(() => setMenuAbierto((v) => !v), []);

  const handlePerfilClick = useCallback(() => {
    cerrarMenu();
    onAbrirPerfil?.();
  }, [cerrarMenu, onAbrirPerfil]);

  const handleLogout = useCallback(() => {
    cerrarMenu();
    onCerrarSesion?.();
  }, [cerrarMenu, onCerrarSesion]);

  return {
    navItems,
    inicial,
    rolLabel,
    menuAbierto,
    toggleMenu,
    cerrarMenu,
    handlePerfilClick,
    handleLogout,
  };
}