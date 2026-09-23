// src/shared/services/proveedorService.js
// 📦 Sprint 20 — Movido de services/proveedorService.js (sin cambios, funciones puras)
'use strict';

const generarPlantilla = (nombreProveedor, items) => {
  const proveedor  = (nombreProveedor ?? '').toString().trim() || 'estimado/a';
  const listaItems = Array.isArray(items) ? items : [];
  const saludo = `Buenos dias ${proveedor},`;
  const intro  = `Por medio de la presente solicito que me facture los siguientes materiales:`;
  const cierre = `Quedo atento/a a su confirmacion.\nGracias.`;
  if (listaItems.length === 0) return [saludo, '', 'No se especificaron materiales.', '', cierre].join('\n');
  const lista = listaItems.map((item, i) => {
    const nombre   = (item?.nombre_material ?? 'Material sin nombre').toString().trim();
    const cantidad = item?.cantidad != null ? Number(item.cantidad) : 0;
    const unidad   = (item?.unidad ?? '').toString().trim();
    return `${i + 1}. ${nombre} - ${cantidad}${unidad ? ' ' + unidad : ''}`;
  }).join('\n');
  return [saludo, '', intro, '', lista, '', cierre].join('\n');
};

const generarUrlWhatsApp = (telefono, texto) => {
  if (!telefono) return null;
  const tel = telefono.toString().replace(/\D/g, '');
  if (tel.length < 7) return null;
  return `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(texto ?? '')}`;
};

module.exports = { generarPlantilla, generarUrlWhatsApp };