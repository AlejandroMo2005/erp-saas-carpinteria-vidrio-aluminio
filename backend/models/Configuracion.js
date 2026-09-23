// ═══════════════════════════════════════════════════════════════════════════
// MODEL: CONFIGURACIÓN
// Queries sobre la tabla `configuracion` (clave-valor)
// ═══════════════════════════════════════════════════════════════════════════

const pool = require('../config/database');

/**
 * Obtiene el valor de una clave de configuración
 * @param {string} clave
 * @returns {Promise<string|null>}
 */
async function obtenerValor(clave) {
  const [rows] = await pool.query(
    'SELECT valor FROM configuracion WHERE clave = ?',
    [clave]
  );
  return rows.length > 0 ? rows[0].valor : null;
}

/**
 * Obtiene todos los pares clave-valor
 * @returns {Promise<Array<{clave: string, valor: string}>>}
 */
async function obtenerTodos() {
  const [rows] = await pool.query(
    'SELECT clave, valor FROM configuracion ORDER BY clave'
  );
  return rows;
}

/**
 * Inserta o actualiza un valor
 * @param {string} clave
 * @param {string} valor
 */
async function guardarValor(clave, valor) {
  await pool.query(
    `INSERT INTO configuracion (clave, valor)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
    [clave, String(valor)]
  );
}

/**
 * Obtiene la tasa de IVA como número (ej: 0.15)
 * Si no existe en BD devuelve 0.15 como fallback
 * @returns {Promise<number>}
 */
async function obtenerTasaIva() {
  const valor = await obtenerValor('IVA');
  if (valor === null) return 0.15;
  const tasa = parseFloat(valor);
  return isNaN(tasa) ? 0.15 : tasa;
}

module.exports = {
  obtenerValor,
  obtenerTodos,
  guardarValor,
  obtenerTasaIva
};