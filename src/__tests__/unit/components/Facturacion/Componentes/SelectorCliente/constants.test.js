import { describe, expect, it } from 'vitest';
import {
  TIPO_ID,
  NUEVO_CLIENTE_INICIAL,
} from '../../../../../../presentation/components/Facturacion/Componentes/SelectorCliente/constants';

describe('TIPO_ID', () => {
  it('define los tipos de identificación soportados', () => {
    expect(Object.keys(TIPO_ID)).toEqual([
      'RUC',
      'CEDULA',
      'PASAPORTE',
      'CONSUMIDOR_FINAL',
    ]);
  });

  it('define etiqueta y longitud para cada tipo', () => {
    expect(TIPO_ID.RUC).toEqual({ label: 'RUC', longitud: 13 });
    expect(TIPO_ID.CEDULA).toEqual({ label: 'Cédula', longitud: 10 });
    expect(TIPO_ID.PASAPORTE).toEqual({ label: 'Pasaporte', longitud: null });
    expect(TIPO_ID.CONSUMIDOR_FINAL).toEqual({
      label: 'Consumidor Final',
      longitud: null,
    });
  });
});

describe('NUEVO_CLIENTE_INICIAL', () => {
  it('define el estado inicial del formulario', () => {
    expect(NUEVO_CLIENTE_INICIAL).toEqual({
      nombre: '',
      telefono: '',
      identificacion: '',
      tipo_identificacion: 'CONSUMIDOR_FINAL',
      direccion: '',
      email: '',
    });
  });
});
