export const IVA_DEFAULT = 0.15;

export const ITEM_VACIO = () => ({
  _id:             Date.now() + Math.random(),
  descripcion:     '',
  cantidad:        1,
  precio_unitario: 0,
  descuento:       0,
  aplica_iva:      true,
});

export const PASOS = [
  { n: 1, label: 'Cliente'   },
  { n: 2, label: 'Productos' },
  { n: 3, label: 'Revisión'  },
];