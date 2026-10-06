export function buildDescripcion(item) {
  const partes = [];
  const nombre = item.trabajo_nombre ?? item.descripcion ?? item.material?.nombre;

  if (nombre) partes.push(nombre);

  if (Number(item.ancho) > 0 && Number(item.alto) > 0)
    partes.push(`${item.ancho}×${item.alto} cm`);

  if (item.color_nombre) partes.push(item.color_nombre);

  if (item.detalle && item.detalle !== nombre) partes.push(item.detalle);

  return partes.join(' — ') || 'Servicio';
}

export function distribuirTotal(items, total) {
  if (!total || total <= 0) return items.map(() => 0);

  const conArea = items.every(
    i => Number(i.ancho) > 0 && Number(i.alto) > 0
  );

  if (conArea) {
    const sumaAreas = items.reduce(
      (s, i) =>
        s +
        Number(i.ancho) *
        Number(i.alto) *
        (Number(i.cantidad) || 1),
      0
    );

    if (sumaAreas > 0) {
      return items.map(i => {
        const area =
          Number(i.ancho) *
          Number(i.alto) *
          (Number(i.cantidad) || 1);

        return Number.parseFloat(
          ((total * area / sumaAreas) / (Number(i.cantidad) || 1)).toFixed(2)
        );
      });
    }
  }

  const sumaCant = items.reduce(
    (s, i) => s + (Number(i.cantidad) || 1),
    0
  );

  return items.map(_i =>
    Number.parseFloat((total / sumaCant).toFixed(2))
  );
}

export function calcularItem(item, tasaIva) {
  const cant = Number.parseFloat(item.cantidad) || 0;
  const precio = Number.parseFloat(item.precio_unitario) || 0;
  const desc = Number.parseFloat(item.descuento) || 0;

  const subtotal = cant * precio - desc;
  const iva = item.aplica_iva ? subtotal * tasaIva : 0;

  return {
    subtotal: Math.max(0, subtotal),
    iva: Math.max(0, iva),
    total: Math.max(0, subtotal + iva),
  };
}

export function calcularTotales(items, tasaIva) {
  return items.reduce(
    (acc, item) => {
      const { subtotal, iva } = calcularItem(item, tasaIva);

      return {
        subtotal_sin_iva:
          acc.subtotal_sin_iva + (item.aplica_iva ? 0 : subtotal),
        subtotal_con_iva:
          acc.subtotal_con_iva + (item.aplica_iva ? subtotal : 0),
        iva: acc.iva + iva,
        total: acc.total + subtotal + iva,
      };
    },
    {
      subtotal_sin_iva: 0,
      subtotal_con_iva: 0,
      iva: 0,
      total: 0,
    }
  );
}
