export const TIPO_ID = {
  RUC:              { label: 'RUC',              longitud: 13   },
  CEDULA:           { label: 'Cédula',           longitud: 10   },
  PASAPORTE:        { label: 'Pasaporte',        longitud: null },
  CONSUMIDOR_FINAL: { label: 'Consumidor Final', longitud: null },
};

export const NUEVO_CLIENTE_INICIAL = {
  nombre:              '',
  telefono:            '',
  identificacion:      '',
  tipo_identificacion: 'CONSUMIDOR_FINAL',
  direccion:           '',
  email:               '',
};