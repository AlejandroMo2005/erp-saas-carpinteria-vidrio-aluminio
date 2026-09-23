// utils/proformaUtils.js

import { TEXTO_MAX } from '../constants/proformaConstants';

export function sanitizar(str) {
  return String(str ?? '').replace(/[<>"'`]/g, '').slice(0, TEXTO_MAX).trim();
}

export function normalizarTelefono(tel) {
  let digits = tel.replace(/\D/g, '');
  if (digits.startsWith('09') && digits.length === 10) digits = '593' + digits.slice(1);
  else if (digits.length === 9 && digits.startsWith('9'))  digits = '593' + digits;
  return digits;
}

export function mensajeError(err) {
  const status = err?.response?.status;
  const server = err?.response?.data?.message || err?.response?.data?.error || '';

  if (
    server.toLowerCase().includes('stock insuficiente') ||
    server.toLowerCase().includes('stock') ||
    status === 422
  ) {
    const matchColor     = server.match(/\(([^)]+)\)/);
    const colorMencionado = matchColor ? matchColor[1] : null;
    return colorMencionado
      ? `Material insuficiente para el color "${colorMencionado}". Intenta con otro color o indícalo en el campo Detalle para coordinar con nosotros.`
      : 'Material insuficiente para este color. Intenta con otro color o indícalo en el campo Detalle y nos pondremos en contacto.';
  }

  if (server)         return server;
  if (status === 400) return 'Datos inválidos. Revisa los campos del formulario.';
  if (status === 401) return 'Sesión expirada. Vuelve a iniciar sesión.';
  if (status === 403) return 'Sin permisos para realizar esta acción.';
  if (status === 404) return 'Recurso no encontrado en el servidor.';
  if (status === 409) return 'Conflicto: ya existe un registro similar.';
  if (status >= 500)  return 'Error interno del servidor. Intenta más tarde.';
  return err?.message || 'Error inesperado. Intenta de nuevo.';
}

export function extraerColor(colorObj) {
  if (!colorObj) return '';
  const campos = ['valor', 'hex', 'color_hex', 'codigo_hex'];
  for (const campo of campos) {
    if (colorObj[campo]) return colorObj[campo].trim();
  }
  for (const val of Object.values(colorObj)) {
    if (typeof val !== 'string') continue;
    const v = val.trim();
    if (/^#[0-9A-Fa-f]{3,6}$/.test(v)) return v;
    if (/^rgba?\s*\(/.test(v))          return v;
    if (/^hsl/.test(v))                 return v;
  }
  return '';
}

export function generarMensajeWA(cliente, items, resumen) {
  const lineas = items
    .filter((it) => it.nombre_trabajo)
    .map((it, i) =>
      `${i + 1}. ${it.nombre_trabajo}` +
      (it.nombre_color ? ` — ${it.nombre_color}` : '') +
      ` (${it.ancho}×${it.alto}, x${it.cantidad})` +
      (it.subtotal > 0 ? ` $${it.subtotal.toFixed(2)}` : '')
    );

  return (
    `Hola ${sanitizar(cliente) || 'estimado/a'}, su proforma:\n\n` +
    lineas.join('\n') +
    `\n\nSubtotal: $${resumen.subtotal.toFixed(2)}` +
    `\nIVA ${(resumen.iva_valor * 100).toFixed(0)}%: $${resumen.iva.toFixed(2)}` +
    `\n*TOTAL: $${resumen.total.toFixed(2)}*`
  );
}

// Determina si un color de fondo es claro (para decidir el borde del circle)
export function esColorClaro(color) {
  if (!color) return false;
  const rgbaMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (rgbaMatch) {
    const alpha = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    if (alpha < 0.45) return true;
    const [r, g, b] = [+rgbaMatch[1], +rgbaMatch[2], +rgbaMatch[3]];
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 180;
  }
  const hex = color.replace('#', '');
  if (!/^[0-9a-fA-F]{3,6}$/.test(hex)) return false;
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 180;
}