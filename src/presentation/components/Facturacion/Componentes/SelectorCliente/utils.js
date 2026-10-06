export function validarCedula(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;

  const prov = Number.parseInt(cedula.substring(0, 2), 10);
  if (prov < 1 || prov > 24) return false;

  const d = cedula.split('').map(Number);
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let v = d[i] * coef[i];
    if (v >= 10) v -= 9;
    suma += v;
  }

  const calc = suma % 10 === 0 ? 0 : 10 - (suma % 10);
  return calc === d[9];
}

export function validarRUC(ruc) {
  if (!/^\d{13}$/.test(ruc)) return false;

  const tipo = Number.parseInt(ruc[2], 10);

  if (tipo >= 0 && tipo <= 5) {
    return (
      validarCedula(ruc.substring(0, 10)) &&
      ruc.substring(10) !== '000'
    );
  }

  if (tipo === 9) {
    const c = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    const d = ruc.split('').map(Number);
    const s = c.reduce((acc, v, i) => acc + v * d[i], 0);
    const calc = s % 11 === 0 ? 0 : 11 - (s % 11);

    return calc === d[9] && ruc.substring(10) !== '000';
  }

  if (tipo === 6) {
    const c = [3, 2, 7, 6, 5, 4, 3, 2];
    const d = ruc.split('').map(Number);
    const s = c.reduce((acc, v, i) => acc + v * d[i], 0);
    const calc = s % 11 === 0 ? 0 : 11 - (s % 11);

    return calc === d[8] && ruc.substring(10) !== '000';
  }

  return false;
}
