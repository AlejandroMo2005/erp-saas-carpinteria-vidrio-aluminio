// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO DE VALIDACIÓN — Identificaciones ecuatorianas
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Valida cédula ecuatoriana (módulo 10)
 * @param {string} cedula
 * @returns {{ valida: boolean, mensaje: string }}
 */
function validarCedula(cedula) {
  if (!cedula || typeof cedula !== 'string') {
    return { valida: false, mensaje: 'Cédula requerida' };
  }

  const c = cedula.trim();

  if (!/^\d{10}$/.test(c)) {
    return { valida: false, mensaje: 'La cédula debe tener exactamente 10 dígitos' };
  }

  const provincia = parseInt(c.substring(0, 2));
  if (provincia < 1 || provincia > 24) {
    return { valida: false, mensaje: 'Código de provincia inválido (primeros 2 dígitos)' };
  }

  const digitos      = c.split('').map(Number);
  const verificador  = digitos[9];
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];

  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let val = digitos[i] * coeficientes[i];
    if (val >= 10) val -= 9;
    suma += val;
  }

  const residuo          = suma % 10;
  const digitoCalculado  = residuo === 0 ? 0 : 10 - residuo;

  if (digitoCalculado !== verificador) {
    return { valida: false, mensaje: 'Cédula inválida: dígito verificador incorrecto' };
  }

  return { valida: true, mensaje: 'Cédula válida' };
}

/**
 * Valida RUC ecuatoriano
 * Soporta: persona natural (tipo 0-5), sociedad privada (tipo 9), entidad pública (tipo 6)
 * @param {string} ruc
 * @returns {{ valida: boolean, mensaje: string, tipo: string|null }}
 */
function validarRUC(ruc) {
  if (!ruc || typeof ruc !== 'string') {
    return { valida: false, mensaje: 'RUC requerido', tipo: null };
  }

  const r = ruc.trim();

  if (!/^\d{13}$/.test(r)) {
    return { valida: false, mensaje: 'El RUC debe tener exactamente 13 dígitos', tipo: null };
  }

  if (r.substring(10) === '000') {
    return { valida: false, mensaje: 'El establecimiento (últimos 3 dígitos) no puede ser 000', tipo: null };
  }

  const tercer = parseInt(r[2]);
  const digitos = r.split('').map(Number);

  // ── Persona natural: tercer dígito 0-5 ──
  if (tercer >= 0 && tercer <= 5) {
    const resultCedula = validarCedula(r.substring(0, 10));
    if (!resultCedula.valida) {
      return { valida: false, mensaje: `RUC persona natural inválido: ${resultCedula.mensaje}`, tipo: null };
    }
    return { valida: true, mensaje: 'RUC persona natural válido', tipo: 'NATURAL' };
  }

  // ── Sociedad privada: tercer dígito 9 ──
  if (tercer === 9) {
    const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) suma += digitos[i] * coeficientes[i];
    const residuo         = suma % 11;
    const digitoCalculado = residuo === 0 ? 0 : 11 - residuo;

    if (digitoCalculado !== digitos[9]) {
      return { valida: false, mensaje: 'RUC sociedad privada inválido: dígito verificador incorrecto', tipo: null };
    }
    return { valida: true, mensaje: 'RUC sociedad privada válido', tipo: 'JURIDICA' };
  }

  // ── Entidad pública: tercer dígito 6 ──
  if (tercer === 6) {
    const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 8; i++) suma += digitos[i] * coeficientes[i];
    const residuo         = suma % 11;
    const digitoCalculado = residuo === 0 ? 0 : 11 - residuo;

    if (digitoCalculado !== digitos[8]) {
      return { valida: false, mensaje: 'RUC entidad pública inválido: dígito verificador incorrecto', tipo: null };
    }
    return { valida: true, mensaje: 'RUC entidad pública válido', tipo: 'PUBLICA' };
  }

  return { valida: false, mensaje: 'RUC con tercer dígito inválido', tipo: null };
}

/**
 * Valida pasaporte — validación básica de formato
 * @param {string} pasaporte
 * @returns {{ valida: boolean, mensaje: string }}
 */
function validarPasaporte(pasaporte) {
  if (!pasaporte || typeof pasaporte !== 'string') {
    return { valida: false, mensaje: 'Pasaporte requerido' };
  }

  const p = pasaporte.trim();

  if (p.length < 5 || p.length > 20) {
    return { valida: false, mensaje: 'El pasaporte debe tener entre 5 y 20 caracteres' };
  }

  if (!/^[A-Z0-9]+$/i.test(p)) {
    return { valida: false, mensaje: 'El pasaporte solo puede contener letras y números' };
  }

  return { valida: true, mensaje: 'Pasaporte válido' };
}

/**
 * Valida cualquier identificación según su tipo
 * @param {string} identificacion
 * @param {'RUC'|'CEDULA'|'PASAPORTE'|'CONSUMIDOR_FINAL'} tipo
 * @returns {{ valida: boolean, mensaje: string }}
 */
function validarIdentificacion(identificacion, tipo) {
  switch (tipo) {
    case 'CEDULA':
      return validarCedula(identificacion);
    case 'RUC':
      return validarRUC(identificacion);
    case 'PASAPORTE':
      return validarPasaporte(identificacion);
    case 'CONSUMIDOR_FINAL':
      return { valida: true, mensaje: 'Consumidor final — sin identificación requerida' };
    default:
      return { valida: false, mensaje: `Tipo de identificación desconocido: ${tipo}` };
  }
}

module.exports = {
  validarCedula,
  validarRUC,
  validarPasaporte,
  validarIdentificacion
};