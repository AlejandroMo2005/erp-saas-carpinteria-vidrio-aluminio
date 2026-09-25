'use strict';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const state = vi.hoisted(() => ({
  constructorError: null,
  emitError: null,
  addPageCalls: 0,
}));

class FakePDFDocument {
  constructor(options) {
    if (state.constructorError) {
      throw state.constructorError;
    }

    this.options = options;
    this.handlers = {};
    this.calls = [];

    state.doc = this;
  }

  on(event, callback) {
    this.handlers[event] = callback;
    return this;
  }

  emit(event, value) {
    if (this.handlers[event]) {
      this.handlers[event](value);
    }
  }

  end() {
    if (state.emitError) {
      this.emit('error', state.emitError);
      return;
    }

    this.emit('data', Buffer.from('PDF-DATA-1'));
    this.emit('data', Buffer.from('PDF-DATA-2'));
    this.emit('end');
  }

  addPage() {
    state.addPageCalls += 1;
    this.calls.push(['addPage']);
    return this;
  }

  rect(...args) {
    this.calls.push(['rect', ...args]);
    return this;
  }

  fillAndStroke(...args) {
    this.calls.push(['fillAndStroke', ...args]);
    return this;
  }

  font(...args) {
    this.calls.push(['font', ...args]);
    return this;
  }

  fontSize(...args) {
    this.calls.push(['fontSize', ...args]);
    return this;
  }

  fillColor(...args) {
    this.calls.push(['fillColor', ...args]);
    return this;
  }

  text(...args) {
    this.calls.push(['text', ...args]);
    return this;
  }

  moveTo(...args) {
    this.calls.push(['moveTo', ...args]);
    return this;
  }

  lineTo(...args) {
    this.calls.push(['lineTo', ...args]);
    return this;
  }

  strokeColor(...args) {
    this.calls.push(['strokeColor', ...args]);
    return this;
  }

  lineWidth(...args) {
    this.calls.push(['lineWidth', ...args]);
    return this;
  }

  stroke(...args) {
    this.calls.push(['stroke', ...args]);
    return this;
  }
}

let loadPatched = false;
let originalLoad;

function patchPdfKit() {
  if (loadPatched) return;

  originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === 'pdfkit') {
      return FakePDFDocument;
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  loadPatched = true;
}

patchPdfKit();

const pdfService = require('../../../src/shared/services/pdfService');

const { generarRIDE, obtenerDatosEmpresa } = pdfService;

function facturaBase(overrides = {}) {
  return {
    numero_factura: '001-001-000000123',
    fecha_emision: '2026-09-23',
    fecha_autorizacion: null,
    estado: 'EMITIDA',

    cliente_nombre: 'Cliente de Prueba',
    cliente_tipo_identificacion: 'CEDULA',
    cliente_identificacion: '1300000000',
    cliente_telefono: '0999999999',
    cliente_email: 'cliente@test.com',
    cliente_direccion: 'Flavio Alfaro, Manabí',

    detalle: [
      {
        codigo_principal: 'MAT-001',
        descripcion: 'Vidrio templado',
        cantidad: 2,
        precio_unitario: 25,
        descuento: 0,
        porcentaje_iva: 15,
        precio_total_sin_iva: 50,
        valor_iva: 7.5,
      },
    ],

    subtotal_sin_iva: 0,
    subtotal_con_iva: 50,
    iva: 7.5,
    descuento: 0,
    propina: 0,
    total: 57.5,

    clave_acceso: '12345678901234567890123456789012345678901234567890',
    numero_autorizacion: null,

    observaciones: null,

    ...overrides,
  };
}

function empresaBase(overrides = {}) {
  return {
    ruc: '1399999999001',
    razon_social: 'EMPRESA DE PRUEBA S.A.',
    nombre_comercial: 'Empresa Comercial',
    direccion_matriz: 'Flavio Alfaro',
    direccion_sucursal: 'Sucursal Centro',
    obligado_contabilidad: 'SI',
    ambiente: 'PRODUCCION',
    ...overrides,
  };
}

beforeEach(() => {
  state.constructorError = null;
  state.emitError = null;
  state.addPageCalls = 0;
  state.doc = null;

  process.env.EMPRESA_RUC = '1399999999001';
  process.env.EMPRESA_RAZON_SOCIAL = 'EMPRESA TEST S.A.';
  process.env.EMPRESA_NOMBRE_COMERCIAL = 'Empresa Test';
  process.env.EMPRESA_DIRECCION = 'Guayaquil';
  process.env.EMPRESA_SUCURSAL = 'Sucursal';
  process.env.EMPRESA_TELEFONO = '0999999999';
  process.env.EMPRESA_EMAIL = 'test@example.com';
  process.env.EMPRESA_OBLIGADO = 'SI';
  process.env.SRI_AMBIENTE = 'PRODUCCION';
});

describe('pdfService', () => {
  describe('obtenerDatosEmpresa', () => {
    it('obtiene todos los datos desde variables de entorno', () => {
      const result = obtenerDatosEmpresa();

      expect(result).toEqual({
        ruc: '1399999999001',
        razon_social: 'EMPRESA TEST S.A.',
        nombre_comercial: 'Empresa Test',
        direccion_matriz: 'Guayaquil',
        direccion_sucursal: 'Sucursal',
        telefono: '0999999999',
        email: 'test@example.com',
        obligado_contabilidad: 'SI',
        ambiente: 'PRODUCCION',
      });
    });

    it('utiliza los valores predeterminados cuando las variables no existen', () => {
      delete process.env.EMPRESA_RUC;
      delete process.env.EMPRESA_RAZON_SOCIAL;
      delete process.env.EMPRESA_NOMBRE_COMERCIAL;
      delete process.env.EMPRESA_DIRECCION;
      delete process.env.EMPRESA_SUCURSAL;
      delete process.env.EMPRESA_TELEFONO;
      delete process.env.EMPRESA_EMAIL;
      delete process.env.EMPRESA_OBLIGADO;
      delete process.env.SRI_AMBIENTE;

      expect(obtenerDatosEmpresa()).toEqual({
        ruc: '9999999999001',
        razon_social: 'MI EMPRESA S.A.',
        nombre_comercial: null,
        direccion_matriz: 'Guayaquil, Ecuador',
        direccion_sucursal: null,
        telefono: null,
        email: null,
        obligado_contabilidad: 'NO',
        ambiente: 'PRUEBAS',
      });
    });

    it('conserva valores vacíos como fallback mediante nullish coalescing', () => {
      process.env.EMPRESA_RUC = '';
      process.env.EMPRESA_RAZON_SOCIAL = '';
      process.env.EMPRESA_NOMBRE_COMERCIAL = '';
      process.env.EMPRESA_DIRECCION = '';
      process.env.EMPRESA_SUCURSAL = '';
      process.env.EMPRESA_TELEFONO = '';
      process.env.EMPRESA_EMAIL = '';
      process.env.EMPRESA_OBLIGADO = '';
      process.env.SRI_AMBIENTE = '';

      const result = obtenerDatosEmpresa();

      expect(result.ruc).toBe('');
      expect(result.razon_social).toBe('');
      expect(result.nombre_comercial).toBe('');
      expect(result.direccion_matriz).toBe('');
      expect(result.direccion_sucursal).toBe('');
      expect(result.telefono).toBe('');
      expect(result.email).toBe('');
      expect(result.obligado_contabilidad).toBe('');
      expect(result.ambiente).toBe('');
    });
  });

  describe('generarRIDE', () => {
    it('genera correctamente un RIDE con todos los datos opcionales', async () => {
      const factura = facturaBase({
        fecha_autorizacion: '2026-09-24',
        estado: 'AUTORIZADA',
        cliente_tipo_identificacion: 'RUC',
        descuento: 5,
        propina: 2,
        numero_autorizacion: 'AUTH-123456',
        observaciones: 'Entrega coordinada con el cliente.',
        detalle: [
          {
            codigo_principal: 'MAT-001',
            descripcion: 'Vidrio templado',
            cantidad: 2,
            precio_unitario: 25,
            descuento: 5,
            porcentaje_iva: 15,
            precio_total_sin_iva: 50,
            valor_iva: 7.5,
          },
          {
            codigo_principal: null,
            descripcion: 'Aluminio blanco',
            cantidad: 3,
            precio_unitario: 10,
            descuento: null,
            porcentaje_iva: 0,
            precio_total_sin_iva: 30,
            valor_iva: 0,
          },
        ],
      });

      const empresa = empresaBase();

      const result = await generarRIDE(factura, empresa);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe('PDF-DATA-1PDF-DATA-2');

      expect(state.doc.options).toMatchObject({
        size: 'A4',
        margins: {
          top: 40,
          bottom: 40,
          left: 40,
          right: 40,
        },
        info: {
          Title: 'Factura 001-001-000000123',
          Author: 'EMPRESA DE PRUEBA S.A.',
          Subject: 'RIDE',
          Keywords: 'factura,SRI,Ecuador',
        },
      });

      expect(state.doc.calls.some(([name]) => name === 'rect')).toBe(true);
      expect(state.doc.calls.some(([name]) => name === 'text')).toBe(true);
      expect(state.doc.calls.some(([name]) => name === 'stroke')).toBe(true);
    });

    it('conserva la clave de acceso cuando no puede dividirse en grupos', async () => {
      const claveSinCoincidencias = {
        toString: () => 'CLAVE',
        match: () => null,
      };

      await generarRIDE(
        facturaBase({
          clave_acceso: claveSinCoincidencias,
        })
      );

      expect(
        state.doc.calls.some(
          ([name, text]) =>
            name === 'text' && text === claveSinCoincidencias
        )
      ).toBe(true);
    });

    it('utiliza los valores predeterminados cuando faltan datos de empresa y factura', async () => {
      const factura = facturaBase({
        numero_factura: undefined,
        fecha_emision: undefined,
        fecha_autorizacion: undefined,
        estado: undefined,
        cliente_nombre: undefined,
        cliente_tipo_identificacion: undefined,
        cliente_identificacion: undefined,
        cliente_telefono: undefined,
        cliente_email: undefined,
        cliente_direccion: undefined,
        clave_acceso: undefined,
        numero_autorizacion: undefined,
        subtotal_sin_iva: undefined,
        subtotal_con_iva: undefined,
        iva: undefined,
        descuento: undefined,
        propina: undefined,
        total: undefined,
        detalle: undefined,
        items: [],
      });

      const result = await generarRIDE(factura);

      expect(Buffer.isBuffer(result)).toBe(true);

      const textCalls = state.doc.calls.filter(([name]) => name === 'text');

      expect(
        textCalls.some(([, text]) => text === 'EMPRESA EMISORA')
      ).toBe(true);

      expect(
        textCalls.some(([, text]) => text === 'FACTURA')
      ).toBe(true);

      expect(
        textCalls.some(([, text]) => text === 'PENDIENTE')
      ).toBe(true);
    });

    it('utiliza items cuando detalle no está definido', async () => {
      const factura = facturaBase({
        detalle: undefined,
        items: [
          {
            codigo_principal: 'ITEM-001',
            descripcion: 'Producto desde items',
            cantidad: 1,
            precio_unitario: 10,
            descuento: 0,
            porcentaje_iva: 15,
            precio_total_sin_iva: 10,
            valor_iva: 1.5,
          },
        ],
      });

      await generarRIDE(factura);

      const textCalls = state.doc.calls.filter(([name]) => name === 'text');

      expect(
        textCalls.some(([, value]) => value === 'Producto desde items')
      ).toBe(true);
    });

    it('maneja una factura sin detalle ni items', async () => {
      const factura = facturaBase({
        detalle: undefined,
        items: undefined,
      });

      const result = await generarRIDE(factura);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('cubre estados EMITIDA, ANULADA y otros estados', async () => {
      for (const estado of ['EMITIDA', 'ANULADA', 'DEVUELTA']) {
        await generarRIDE(
          facturaBase({
            estado,
          }),
          empresaBase()
        );
      }

      expect(state.doc.calls.length).toBeGreaterThan(0);
    });

    it('cubre diferentes porcentajes de IVA y ausencia de IVA positivo', async () => {
      await generarRIDE(
        facturaBase({
          detalle: [
            {
              descripcion: 'Sin IVA',
              cantidad: 1,
              precio_unitario: 10,
              descuento: 0,
              porcentaje_iva: 0,
              precio_total_sin_iva: 10,
              valor_iva: 0,
            },
          ],
        })
      );

      await generarRIDE(
        facturaBase({
          detalle: [
            {
              descripcion: 'IVA 12',
              cantidad: 1,
              precio_unitario: 10,
              descuento: 0,
              porcentaje_iva: 12,
              precio_total_sin_iva: 10,
              valor_iva: 1.2,
            },
          ],
        })
      );

      expect(state.doc.calls.length).toBeGreaterThan(0);
    });

    it('cubre las variantes de empresa del encabezado', async () => {
      await generarRIDE(
        facturaBase(),
        empresaBase({
          nombre_comercial: null,
          direccion_sucursal: null,
          obligado_contabilidad: 'NO',
          ambiente: 'PRUEBAS',
        })
      );

      await generarRIDE(
        facturaBase(),
        empresaBase({
          nombre_comercial: 'Comercial Test',
          direccion_sucursal: 'Sucursal Test',
          obligado_contabilidad: 'SI',
          ambiente: 'PRODUCCION',
        })
      );

      expect(state.doc.calls.length).toBeGreaterThan(0);
    });

    it('cubre una descripción suficientemente larga para aumentar la altura de fila', async () => {
      const descripcion =
        'Descripción extensa de un producto de vidrio y aluminio para cubrir varias líneas dentro de la tabla del comprobante electrónico';

      await generarRIDE(
        facturaBase({
          detalle: [
            {
              codigo_principal: 'LONG-001',
              descripcion,
              cantidad: 1,
              precio_unitario: 100,
              descuento: 0,
              porcentaje_iva: 15,
              precio_total_sin_iva: 100,
              valor_iva: 15,
            },
          ],
        })
      );

      expect(
        state.doc.calls.some(
          ([name, , , , options]) =>
            name === 'text' &&
            options &&
            options.lineBreak === true
        )
      ).toBe(true);
    });

    it('crea una nueva página cuando la tabla supera el límite vertical', async () => {
      const items = Array.from({ length: 40 }, (_, index) => ({
        codigo_principal: `ITEM-${index + 1}`,
        descripcion:
          index % 2 === 0
            ? 'Descripción corta'
            : 'Descripción de fila alternativa',
        cantidad: 1,
        precio_unitario: 10,
        descuento: 0,
        porcentaje_iva: 15,
        precio_total_sin_iva: 10,
        valor_iva: 1.5,
      }));

      await generarRIDE(
        facturaBase({
          detalle: items,
        })
      );

      expect(state.addPageCalls).toBeGreaterThan(0);
    });

    it('cubre valores nulos o ausentes dentro de los items', async () => {
      await generarRIDE(
        facturaBase({
          detalle: [
            {
              codigo_principal: undefined,
              descripcion: undefined,
              cantidad: undefined,
              precio_unitario: undefined,
              descuento: undefined,
              porcentaje_iva: undefined,
              precio_total_sin_iva: undefined,
              valor_iva: undefined,
            },
            {
              codigo_principal: null,
              descripcion: null,
              cantidad: null,
              precio_unitario: null,
              descuento: null,
              porcentaje_iva: null,
              precio_total_sin_iva: null,
              valor_iva: null,
            },
          ],
        })
      );

      expect(Buffer.isBuffer(await generarRIDE(facturaBase()))).toBe(true);
    });

    it('rechaza cuando PDFDocument genera un error', async () => {
      state.emitError = new Error('Error de PDF');

      await expect(
        generarRIDE(facturaBase())
      ).rejects.toThrow('Error de PDF');
    });

    it('rechaza cuando el constructor de PDFDocument lanza una excepción', async () => {
      state.constructorError = new Error('No se pudo crear PDF');

      await expect(
        generarRIDE(facturaBase())
      ).rejects.toThrow('No se pudo crear PDF');
    });

    it('acepta una empresa sin razón social y usa el autor predeterminado', async () => {
      const empresa = empresaBase({
        razon_social: undefined,
      });

      await generarRIDE(facturaBase(), empresa);

      expect(state.doc.options.info.Author).toBe('Sistema de Facturación');
    });
  });
});