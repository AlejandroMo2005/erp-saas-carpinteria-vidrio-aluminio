// src/presentation/components/Pedidos/utils/pedidosUtils.js
// Sprint 18 — Refactorización modular

export function sanitizeForDisplay(text) {
  if (!text) return 'Sin detalles especificados';
  const cleaned = String(text)
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g,  '&')
    .replace(/[<>"'`]/g, '');
  return cleaned.trim() || 'Sin detalles especificados';
}

export function mensajeError(err) {
  const status = err?.response?.status;
  const server = err?.response?.data?.message;
  if (server)         return server;
  if (status === 400) return 'Solicitud inválida.';
  if (status === 401) return 'Sesión expirada. Vuelve a iniciar sesión.';
  if (status === 403) return 'Sin permisos para esta acción.';
  if (status === 404) return 'Pedido no encontrado.';
  if (status === 409) return 'El pedido ya fue modificado por otro usuario.';
  if (status >= 500)  return 'Error del servidor. Intenta más tarde.';
  return err?.message || 'Error inesperado.';
}