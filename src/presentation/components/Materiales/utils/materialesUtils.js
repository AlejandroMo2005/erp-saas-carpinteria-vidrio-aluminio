// src/presentation/components/Materiales/utils/materialesUtils.js
// Sprint 18 — Refactorización modular

import { useState, useEffect } from 'react';
import { COLOR_FALLBACK, STOCK_MAX } from '../constants/materialesConstants';

export function sanitizarTexto(str) {
  return String(str ?? '').replace(/[<>"'`]/g, '').trim();
}

export function validarNumero(valor, min = 0, max = STOCK_MAX) {
  const n = Number.parseFloat(valor);
  if (Number.isNaN(n) || n < min) return min;
  if (n > max) return max;
  return n;
}

export function normalizarColor(valor) {
  if (!valor || typeof valor !== 'string') return COLOR_FALLBACK;

  const v = valor.trim();

  if (/^#[0-9A-Fa-f]{3,6}$/.test(v)) return v;

  const minusculas = v.toLowerCase();
  const esRgb = minusculas.startsWith('rgb(') && minusculas.endsWith(')');
  const esRgba = minusculas.startsWith('rgba(') && minusculas.endsWith(')');

  if (esRgb || esRgba) {
    const inicio = esRgba ? 5 : 4;
    const contenido = v.slice(inicio, -1);
    const componentes = contenido.split(',').map(componente => componente.trim());
    const cantidadEsperada = esRgba ? 4 : 3;

    if (componentes.length !== cantidadEsperada) return COLOR_FALLBACK;

    const [r, g, b, a] = componentes;
    const valoresRGB = [r, g, b].map(Number);

    if (
      valoresRGB.some(numero => !Number.isFinite(numero)) ||
      valoresRGB.some(numero => numero < 0 || numero > 255)
    ) {
      return COLOR_FALLBACK;
    }

    const [rc, gc, bc] = valoresRGB;

    if (esRgba) {
      const alfa = Number(a);

      if (!Number.isFinite(alfa)) return COLOR_FALLBACK;

      return `rgba(${rc}, ${gc}, ${bc}, ${Math.min(1, Math.max(0, alfa))})`;
    }

    return `rgb(${rc}, ${gc}, ${bc})`;
  }

  return COLOR_FALLBACK;
}

export function esColorClaro(colorCSS) {
  if (!colorCSS || !colorCSS.startsWith('#')) return false;

  const h = colorCSS.replace('#', '');

  if (h.length < 6) return false;

  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);

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
