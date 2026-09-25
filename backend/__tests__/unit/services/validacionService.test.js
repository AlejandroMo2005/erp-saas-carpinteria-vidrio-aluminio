import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
  validarCedula,
  validarRUC,
  validarPasaporte,
  validarIdentificacion,
} = require('../../../src/shared/services/validacionService');

describe('validacionService', () => {
  describe('validarCedula', () => {
    it('debe rechazar cédula vacía', () => {
      expect(validarCedula('')).toEqual({
        valida: false,
        mensaje: 'Cédula requerida',
      });
    });

    it('debe rechazar cédula null', () => {
      expect(validarCedula(null)).toEqual({
        valida: false,
        mensaje: 'Cédula requerida',
      });
    });

    it('debe rechazar cédula no string', () => {
      expect(validarCedula(1234567890)).toEqual({
        valida: false,
        mensaje: 'Cédula requerida',
      });
    });

    it('debe rechazar cédula con cantidad incorrecta de dígitos', () => {
      expect(validarCedula('123456789')).toEqual({
        valida: false,
        mensaje: 'La cédula debe tener exactamente 10 dígitos',
      });
    });

    it('debe rechazar cédula con caracteres no numéricos', () => {
      expect(validarCedula('091234567A')).toEqual({
        valida: false,
        mensaje: 'La cédula debe tener exactamente 10 dígitos',
      });
    });

    it('debe rechazar código de provincia menor que 1', () => {
      expect(validarCedula('0012345678')).toEqual({
        valida: false,
        mensaje: 'Código de provincia inválido (primeros 2 dígitos)',
      });
    });

    it('debe rechazar código de provincia mayor que 24', () => {
      expect(validarCedula('2512345678')).toEqual({
        valida: false,
        mensaje: 'Código de provincia inválido (primeros 2 dígitos)',
      });
    });

    it('debe aceptar una cédula válida', () => {
      expect(validarCedula('0912345675')).toEqual({
        valida: true,
        mensaje: 'Cédula válida',
      });
    });

    it('debe aceptar una cédula válida con espacios externos', () => {
      expect(validarCedula(' 0912345675 ')).toEqual({
        valida: true,
        mensaje: 'Cédula válida',
      });
    });

    it('debe rechazar una cédula con dígito verificador incorrecto', () => {
      expect(validarCedula('0912345676')).toEqual({
        valida: false,
        mensaje: 'Cédula inválida: dígito verificador incorrecto',
      });
    });

    it('debe cubrir el caso donde el producto de un dígito y coeficiente es mayor o igual a 10', () => {
      expect(validarCedula('0912345675')).toEqual({
        valida: true,
        mensaje: 'Cédula válida',
      });
    });

    it('debe cubrir el cálculo cuyo residuo es cero', () => {
      expect(validarCedula('0102030405')).toEqual({
        valida: false,
        mensaje: 'Cédula inválida: dígito verificador incorrecto',
      });
    });
  });

  describe('validarRUC', () => {
    it('debe rechazar RUC vacío', () => {
      expect(validarRUC('')).toEqual({
        valida: false,
        mensaje: 'RUC requerido',
        tipo: null,
      });
    });

    it('debe rechazar RUC null', () => {
      expect(validarRUC(null)).toEqual({
        valida: false,
        mensaje: 'RUC requerido',
        tipo: null,
      });
    });

    it('debe rechazar RUC no string', () => {
      expect(validarRUC(1234567890123)).toEqual({
        valida: false,
        mensaje: 'RUC requerido',
        tipo: null,
      });
    });

    it('debe rechazar RUC con cantidad incorrecta de dígitos', () => {
      expect(validarRUC('179001234567')).toEqual({
        valida: false,
        mensaje: 'El RUC debe tener exactamente 13 dígitos',
        tipo: null,
      });
    });

    it('debe rechazar RUC con caracteres no numéricos', () => {
      expect(validarRUC('17900123456AB')).toEqual({
        valida: false,
        mensaje: 'El RUC debe tener exactamente 13 dígitos',
        tipo: null,
      });
    });

    it('debe rechazar RUC cuyo establecimiento sea 000', () => {
      expect(validarRUC('1790012345000')).toEqual({
        valida: false,
        mensaje: 'El establecimiento no puede ser 000',
        tipo: null,
      });
    });

    it('debe rechazar RUC de persona natural con cédula inválida', () => {
      expect(validarRUC('0912345676001')).toEqual({
        valida: false,
        mensaje: 'RUC persona natural inválido: Cédula inválida: dígito verificador incorrecto',
        tipo: null,
      });
    });

    it('debe aceptar RUC de persona natural', () => {
      expect(validarRUC('0912345675001')).toEqual({
        valida: true,
        mensaje: 'RUC persona natural válido',
        tipo: 'NATURAL',
      });
    });

    it('debe aceptar RUC de persona natural con tercer dígito entre 0 y 5', () => {
      expect(validarRUC('0102030405001')).toEqual({
        valida: false,
        mensaje: 'RUC persona natural inválido: Cédula inválida: dígito verificador incorrecto',
        tipo: null,
      });
    });

    it('debe rechazar RUC de sociedad privada con dígito verificador incorrecto', () => {
      expect(validarRUC('1790012346001')).toEqual({
        valida: false,
        mensaje: 'RUC sociedad privada inválido',
        tipo: null,
      });
    });

    it('debe aceptar RUC de sociedad privada válido', () => {
      expect(validarRUC('1790012344001')).toEqual({
        valida: true,
        mensaje: 'RUC sociedad privada válido',
        tipo: 'JURIDICA',
      });
    });

    it('debe rechazar RUC de entidad pública con dígito verificador incorrecto', () => {
      expect(validarRUC('1760001235001')).toEqual({
        valida: false,
        mensaje: 'RUC entidad pública inválido',
        tipo: null,
      });
    });

    it('debe aceptar RUC de entidad pública válido', () => {
      expect(validarRUC('1760001200001')).toEqual({
        valida: true,
        mensaje: 'RUC entidad pública válido',
        tipo: 'PUBLICA',
      });
    });

    it('debe cubrir el cálculo del RUC público cuyo residuo es cero', () => {
      expect(validarRUC('0160000000001')).toEqual({
        valida: true,
        mensaje: 'RUC entidad pública válido',
        tipo: 'PUBLICA',
      });
    });

    it('debe rechazar RUC con tercer dígito inválido', () => {
      expect(validarRUC('1780012345001')).toEqual({
        valida: false,
        mensaje: 'RUC con tercer dígito inválido',
        tipo: null,
      });
    });

    it('debe aceptar espacios externos en RUC', () => {
      expect(validarRUC(' 0912345675001 ')).toEqual({
        valida: true,
        mensaje: 'RUC persona natural válido',
        tipo: 'NATURAL',
      });
    });
  });

  describe('validarPasaporte', () => {
    it('debe rechazar pasaporte vacío', () => {
      expect(validarPasaporte('')).toEqual({
        valida: false,
        mensaje: 'Pasaporte requerido',
      });
    });

    it('debe rechazar pasaporte null', () => {
      expect(validarPasaporte(null)).toEqual({
        valida: false,
        mensaje: 'Pasaporte requerido',
      });
    });

    it('debe rechazar pasaporte no string', () => {
      expect(validarPasaporte(12345)).toEqual({
        valida: false,
        mensaje: 'Pasaporte requerido',
      });
    });

    it('debe rechazar pasaporte con menos de 5 caracteres', () => {
      expect(validarPasaporte('AB12')).toEqual({
        valida: false,
        mensaje: 'El pasaporte debe tener entre 5 y 20 caracteres',
      });
    });

    it('debe rechazar pasaporte con más de 20 caracteres', () => {
      expect(validarPasaporte('ABCDEFGHIJKLMNOPQRSTU')).toEqual({
        valida: false,
        mensaje: 'El pasaporte debe tener entre 5 y 20 caracteres',
      });
    });

    it('debe rechazar pasaporte con caracteres especiales', () => {
      expect(validarPasaporte('AB12-345')).toEqual({
        valida: false,
        mensaje: 'El pasaporte solo puede contener letras y números',
      });
    });

    it('debe aceptar pasaporte alfanumérico', () => {
      expect(validarPasaporte('AB12345')).toEqual({
        valida: true,
        mensaje: 'Pasaporte válido',
      });
    });

    it('debe aceptar pasaporte en minúsculas por la expresión regular case-insensitive', () => {
      expect(validarPasaporte('abc123')).toEqual({
        valida: true,
        mensaje: 'Pasaporte válido',
      });
    });

    it('debe aceptar pasaporte con espacios externos', () => {
      expect(validarPasaporte(' AB12345 ')).toEqual({
        valida: true,
        mensaje: 'Pasaporte válido',
      });
    });
  });

  describe('validarIdentificacion', () => {
    it('debe delegar en validarCedula para CEDULA', () => {
      expect(validarIdentificacion('0912345675', 'CEDULA')).toEqual({
        valida: true,
        mensaje: 'Cédula válida',
      });
    });

    it('debe delegar en validarRUC para RUC', () => {
      expect(validarIdentificacion('0912345675001', 'RUC')).toEqual({
        valida: true,
        mensaje: 'RUC persona natural válido',
        tipo: 'NATURAL',
      });
    });

    it('debe delegar en validarPasaporte para PASAPORTE', () => {
      expect(validarIdentificacion('AB12345', 'PASAPORTE')).toEqual({
        valida: true,
        mensaje: 'Pasaporte válido',
      });
    });

    it('debe aceptar CONSUMIDOR_FINAL sin identificación', () => {
      expect(validarIdentificacion(null, 'CONSUMIDOR_FINAL')).toEqual({
        valida: true,
        mensaje: 'Consumidor final — sin identificación requerida',
      });
    });

    it('debe rechazar un tipo de identificación desconocido', () => {
      expect(validarIdentificacion('0912345675', 'OTRO')).toEqual({
        valida: false,
        mensaje: 'Tipo de identificación desconocido: OTRO',
      });
    });

    it('debe rechazar tipo undefined', () => {
      expect(validarIdentificacion('0912345675', undefined)).toEqual({
        valida: false,
        mensaje: 'Tipo de identificación desconocido: undefined',
      });
    });
  });
});
