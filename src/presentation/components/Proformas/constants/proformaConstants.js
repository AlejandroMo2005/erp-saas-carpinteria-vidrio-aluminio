// constants/proformaConstants.js

export const MEDIDA_MAX = 99999;
export const CANT_MAX   = 9999;
export const TEXTO_MAX  = 200;

export const ITEM_VACIO = () => ({
  id:             globalThis.crypto.randomUUID(),
  trabajo_id:     '',
  nombre_trabajo: '',
  ancho:          1,
  alto:           1,
  cantidad:       1,
  color_id:       '',
  nombre_color:   '',
  color_hex:      '',
  detalle:        '',
  subtotal:       0,
});
