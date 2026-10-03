/**
 * Identificador de luminosidad de colores
 * Determina si un color hex es oscuro o claro para asignar bordes contrastantes
 * en dots Y en el trazo de la línea completa mediante CSS filter drop-shadow.
 */

/**
 * Calcula la luminosidad relativa de un color hex según W3C WCAG
 * @param {string} hex - Color en formato hex (#RRGGBB o #RGB)
 * @returns {number} - Luminosidad entre 0 (negro) y 1 (blanco)
 */
export const calcularLuminosidad = (hex) => {
  if (!hex || !hex.startsWith('#')) return 0.5;

  let color = hex.replace('#', '');
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }

  const r = parseInt(color.substring(0, 2), 16) / 255;
  const g = parseInt(color.substring(2, 4), 16) / 255;
  const b = parseInt(color.substring(4, 6), 16) / 255;

  const gammaCorregir = (c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const rL = gammaCorregir(r);
  const gL = gammaCorregir(g);
  const bL = gammaCorregir(b);

  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
};

/**
 * Determina si un color es oscuro basándose en su luminosidad
 * @param {string} hex - Color en formato hex
 * @param {number} umbral - Umbral de luminosidad (default: 0.5)
 * @returns {boolean} - true si el color es oscuro
 */
export const esColorOscuro = (hex, umbral = 0.5) =>
  calcularLuminosidad(hex) < umbral;

/**
 * Obtiene el color de borde óptimo para un color dado
 * @param {string} hex - Color en formato hex
 * @returns {string} - Color del borde en hex
 */
export const obtenerBordeOptimo = (hex) =>
  esColorOscuro(hex, 0.5) ? '#ffffff' : '#000000';

/**
 * Calcula el filter CSS drop-shadow para que la línea sea visible en cualquier modo.
 *
 * Lógica:
 *  - Alto contraste → halo amarillo (#ffff00) siempre
 *  - Modo claro + color claro (luminosidad > 0.5) → contorno negro
 *  - Modo oscuro + color oscuro (luminosidad < 0.15) → contorno blanco
 *  - Resto de combinaciones → sin filtro (el color ya contrasta suficiente)
 *
 * Se aplica doble drop-shadow para reforzar el halo sin ensanchar demasiado.
 *
 * @param {string} hex
 * @param {boolean} darkMode
 * @param {boolean} highContrast
 * @returns {string|undefined}
 */
const calcularFilterLinea = (hex, darkMode, highContrast) => {
  if (highContrast) {
    return 'drop-shadow(0 0 2px #ffff00) drop-shadow(0 0 1.5px #ffff00)';
  }

  const lum = calcularLuminosidad(hex);

  if (!darkMode && lum > 0.5) {
    // Color claro sobre fondo claro → halo negro
    return 'drop-shadow(0 0 1.5px #000000) drop-shadow(0 0 1px #000000)';
  }

  if (darkMode && lum < 0.15) {
    // Color muy oscuro sobre fondo oscuro → halo blanco
    return 'drop-shadow(0 0 1.5px #ffffff) drop-shadow(0 0 1px #ffffff)';
  }

  return undefined; // Sin filtro: el color ya tiene contraste natural
};

/**
 * Obtiene configuración completa de estilo para líneas de gráficas Recharts.
 *
 * - stroke / strokeWidth: color y grosor de la línea
 * - style.filter: drop-shadow aplicado al <path> SVG → borde visible en la línea completa
 * - dot / activeDot: borde contrastante en los puntos
 *
 * @param {string} hex - Color en formato hex
 * @param {boolean} darkMode - true = tema oscuro activo
 * @param {boolean} highContrast - true = modo alto contraste activo
 * @returns {object} - Props para el componente <Line> de Recharts
 */
export const obtenerEstiloLinea = (hex, darkMode = true, highContrast = false) => {
  const luminosidad = calcularLuminosidad(hex);
  const grosor      = luminosidad < 0.2 || luminosidad > 0.8 ? 2.5 : 2;

  // Borde del dot: en HC siempre negro (sobre amarillo), sino contraste natural
  const bordeDot = highContrast
    ? '#000000'
    : obtenerBordeOptimo(hex);

  const filterLinea = calcularFilterLinea(hex, darkMode, highContrast);

  return {
    stroke:      hex,
    strokeWidth: 3.5,
    // style se aplica al <path> SVG que Recharts genera para la línea
    ...(filterLinea ? { style: { filter: filterLinea } } : {}),
    dot: {
      fill:        hex,
      r:           4,
      stroke:      bordeDot,
      strokeWidth: grosor,
    },
    activeDot: {
      r:           6,
      stroke:      bordeDot,
      strokeWidth: grosor,
    },
  };
};

const ColorUtils = {
  calcularLuminosidad,
  esColorOscuro,
  obtenerBordeOptimo,
  obtenerEstiloLinea,
};

export default ColorUtils;