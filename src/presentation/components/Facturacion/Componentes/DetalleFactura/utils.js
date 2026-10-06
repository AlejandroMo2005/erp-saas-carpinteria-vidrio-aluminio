export function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-EC', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

export function formatearFechaHora(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-EC', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatearMoneda(valor) {
  return `$${Number.parseFloat(valor ?? 0).toFixed(2)}`;
}
