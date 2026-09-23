// src/presentation/components/Previsualizacion/utils.js

export const MEDIDA_MIN = 0.10;
export const MEDIDA_MAX = 20.00;
export const DECIMALES  = 2;

/**
 * Normaliza cualquier formato de color CSS a hex o rgb/rgba canónico.
 * Devuelve '#888888' si el valor no es reconocible.
 */
export function normalizarColor(valor) {
  if (!valor || typeof valor !== 'string') return '#888888';
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
  if (/^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/.test(v)) {
    const [r, g, b] = v.split(',').map((x) => Math.min(255, Math.max(0, Number(x.trim()))));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return '#888888';
}

/**
 * Separa el canal hex y el alpha de cualquier formato de color CSS.
 * Devuelve { hex: string, alpha: number }.
 */
export function separarColorYAlpha(valor) {
  if (!valor || typeof valor !== 'string') return { hex: '#888888', alpha: 1 };
  const v = valor.trim();
  if (/^#[0-9A-Fa-f]{3,6}$/.test(v)) return { hex: v, alpha: 1 };
  const rgbaMatch = v.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+))?\s*\)$/i
  );
  if (rgbaMatch) {
    const [, r, g, b, a] = rgbaMatch;
    const rc    = Math.min(255, Math.max(0, Number(r)));
    const gc    = Math.min(255, Math.max(0, Number(g)));
    const bc    = Math.min(255, Math.max(0, Number(b)));
    const alpha = a !== undefined ? Math.min(1, Math.max(0, Number(a))) : 1;
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return { hex: `#${toHex(rc)}${toHex(gc)}${toHex(bc)}`, alpha };
  }
  if (/^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/.test(v)) {
    const [r, g, b] = v.split(',').map((x) => Math.min(255, Math.max(0, Number(x.trim()))));
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, alpha: 1 };
  }
  return { hex: '#888888', alpha: 1 };
}

/**
 * Valida y normaliza una medida en metros.
 * Devuelve null si inválida, MEDIDA_MAX si supera el límite, o el valor clampado.
 */
export function validarMedida(valor) {
  const n = parseFloat(valor);
  if (isNaN(n) || n < MEDIDA_MIN) return null;
  if (n > MEDIDA_MAX) return MEDIDA_MAX;
  return parseFloat(n.toFixed(DECIMALES));
}