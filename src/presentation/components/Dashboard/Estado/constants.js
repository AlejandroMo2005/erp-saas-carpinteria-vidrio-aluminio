// Los colores de cada estado se manejan enteramente por CSS
// mediante selectores [data-estado="X"] + variables de global.css.
// No se necesitan constantes de color aquí.

export const fmt = (n) => {
  if (!n && n !== 0) return '—';
  const num = Number(n);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `$${(num / 1_000).toFixed(1)}k`;
  return `$${num.toFixed(0)}`;
};