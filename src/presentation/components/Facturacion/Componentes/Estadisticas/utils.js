export function calcularFechas(periodo) {
  const hasta = new Date();
  const desde = new Date();
  const meses = { '3m': 3, '6m': 6, '12m': 12 }[periodo] ?? 6;
  desde.setMonth(desde.getMonth() - meses);
  return {
    fechaDesde: desde.toISOString().split('T')[0],
    fechaHasta: hasta.toISOString().split('T')[0],
  };
}

export function formatearMoneda(valor) {
  return `$${Number.parseFloat(valor ?? 0).toLocaleString('es-EC', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatearMes(mesStr) {
  if (!mesStr) return '';
  const [anio, mes] = mesStr.split('-');
  const fecha = new Date(Number.parseInt(anio), Number.parseInt(mes) - 1, 1);
  return fecha.toLocaleDateString('es-EC', { month: 'short', year: '2-digit' });
}

export function luminosidad(hex) {
  if (!hex?.startsWith('#')) return 0.5;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const gamma = (n) => {
    const v = Number.parseInt(n, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * gamma(c.slice(0, 2)) +
    0.7152 * gamma(c.slice(2, 4)) +
    0.0722 * gamma(c.slice(4, 6))
  );
}

export function estiloLinea(hex, darkMode, highContrast) {
  const filter = (() => {
    if (highContrast)
      return 'drop-shadow(0 0 2px #ffff00) drop-shadow(0 0 1.5px #ffff00)';
    const lum = luminosidad(hex);
    if (!darkMode && lum > 0.55)
      return 'drop-shadow(0 0 1.5px #000000) drop-shadow(0 0 1px #000000)';
    if (darkMode && lum < 0.12)
      return 'drop-shadow(0 0 1.5px #ffffff) drop-shadow(0 0 1px #ffffff)';
    return undefined;
  })();

  const bordeDot = highContrast
    ? '#000000'
    : (luminosidad(hex) < 0.5 ? '#ffffff' : '#000000');

  return {
    stroke:      hex,
    strokeWidth: 2.5,
    ...(filter ? { style: { filter } } : {}),
    dot:       { fill: hex, r: 4, stroke: bordeDot, strokeWidth: 1.5 },
    activeDot: { r: 6,            stroke: bordeDot, strokeWidth: 1.5 },
  };
}
