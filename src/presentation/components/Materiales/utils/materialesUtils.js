// src/presentation/components/Materiales/utils/materialesUtils.js
// Sprint 18 — Refactorización modular

import { useState, useEffect } from 'react';
import { COLOR_FALLBACK, STOCK_MAX } from '../constants/materialesConstants';

export function sanitizarTexto(str) {
  return String(str ?? '').replace(/[<>"'`]/g, '').trim();
}

export function validarNumero(valor, min = 0, max = STOCK_MAX) {
  const n = parseFloat(valor);
  if (isNaN(n) || n < min) return min;
  if (n > max)              return max;
  return n;
}

export function normalizarColor(valor) {
  if (!valor || typeof valor !== 'string') return COLOR_FALLBACK;
  const v = valor.trim();
  if (/^#[0-9A-Fa-f]{3,6}$/.test(v)) return v;
  const rgbaMatch = v.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+))?\s*\)$/i
  );
  if (rgbaMatch) {
    const [, r, g, b, a] = rgbaMatch;
    const rc = Math.min(255, Math.max(0, Number(r)));
    const gc = Math.min(255, Math.max(0, Number(g)));
    const bc = Math.min(255, Math.max(0, Number(b)));
    if (a !== undefined)
      return `rgba(${rc}, ${gc}, ${bc}, ${Math.min(1, Math.max(0, Number(a)))})`;
    return `rgb(${rc}, ${gc}, ${bc})`;
  }
  return COLOR_FALLBACK;
}

export function esColorClaro(colorCSS) {
  if (!colorCSS || !colorCSS.startsWith('#')) return false;
  const h = colorCSS.replace('#', '');
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}

export function useDebounce(valor, ms) {
  const [val, setVal] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setVal(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return val;
}