export function agruparPorProveedor(alertas) {
  const mapa = new Map();
  for (const a of alertas) {
    const key = a.proveedor_id ?? 'null';
    if (!mapa.has(key)) {
      mapa.set(key, {
        proveedor_id:      a.proveedor_id,
        proveedor:         a.proveedor,
        ciudad:            a.ciudad,
        telefono_whatsapp: a.telefono_whatsapp,
        items:             [],
      });
    }
    mapa.get(key).items.push(a);
  }
  return [...mapa.values()];
}