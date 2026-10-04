import { describe, expect, it } from 'vitest';
import { validarCedula, validarRUC } from '../../../../../../presentation/components/Facturacion/Componentes/SelectorCliente/utils';

describe('validarCedula', () => {
  it('rechaza una cédula con formato incorrecto', () => {
    expect(validarCedula('123456789')).toBe(false);
    expect(validarCedula('1234567890A')).toBe(false);
    expect(validarCedula('')).toBe(false);
  });

  it('rechaza una provincia fuera del rango válido', () => {
    expect(validarCedula('0099999999')).toBe(false);
    expect(validarCedula('2599999999')).toBe(false);
  });

  it('valida una cédula ecuatoriana correcta', () => {
    expect(validarCedula('1710034065')).toBe(true);
  });

  it('rechaza una cédula con dígito verificador incorrecto', () => {
    expect(validarCedula('1710034066')).toBe(false);
  });

  it('cubre el caso de producto mayor o igual a 10', () => {
    expect(validarCedula('0912345678')).toBe(false);
  });

  it('cubre el cálculo con residuo cero', () => {
    expect(validarCedula('0102030400')).toBe(true);
  });
});

describe('validarRUC', () => {
  it('rechaza un RUC con formato incorrecto', () => {
    expect(validarRUC('123456789012')).toBe(false);
    expect(validarRUC('12345678901234')).toBe(false);
    expect(validarRUC('123456789012A')).toBe(false);
  });

  it('rechaza un RUC con tipo de contribuyente no soportado', () => {
    expect(validarRUC('1710034065000')).toBe(false);
  });

  it('rechaza un RUC cuyo tercer dígito no corresponde a un tipo soportado', () => {
    expect(validarRUC('1271234567890')).toBe(false);
  });

  it('valida el RUC de persona natural usando la cédula', () => {
    expect(validarRUC('1710034065001')).toBe(true);
  });

  it('rechaza un RUC de persona natural terminado en 000', () => {
    expect(validarRUC('1710034065000')).toBe(false);
  });

  it('rechaza un RUC de persona natural con cédula inválida', () => {
    expect(validarRUC('1710034066001')).toBe(false);
  });

  it('procesa el RUC de sociedad privada (tipo 9)', () => {
    expect(validarRUC('0990321183001')).toBe(true);
    expect(validarRUC('0990321184001')).toBe(false);
    expect(validarRUC('0990321183000')).toBe(false);
    expect(validarRUC('0990000050001')).toBe(true);
  });

  it('procesa el RUC de entidad pública (tipo 6)', () => {
    expect(validarRUC('1760001550001')).toBe(true);
    expect(validarRUC('1760001540001')).toBe(false);
    expect(validarRUC('1760001550000')).toBe(false);
    expect(validarRUC('1760000900001')).toBe(true);
  });
});
