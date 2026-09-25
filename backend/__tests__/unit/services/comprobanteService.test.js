import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
  getConnection: vi.fn(),
};

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
};

const connection = {
  beginTransaction: vi.fn(),
  query: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
};

const originalLoad = Module._load;

const servicePath = require.resolve(
  `${process.cwd()}/src/shared/services/comprobanteService.js`
);

delete require.cache[servicePath];

Module._load = function (request, parent, isMain) {
  if (request === '../../../config/database') {
    return db;
  }

  if (request === '../../../utils/logger') {
    return logger;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const {
  generarClaveAcceso,
  formatearNumeroFactura,
  obtenerPorcentajeIVA,
  obtenerSiguienteSecuencia,
  crearFacturaDesdePedido,
  obtenerFacturaPorId,
  anularFactura,
} = require(servicePath);

Module._load = originalLoad;

beforeEach(() => {
  vi.clearAllMocks();

  connection.beginTransaction.mockResolvedValue();
  connection.commit.mockResolvedValue();
  connection.rollback.mockResolvedValue();
  connection.release.mockImplementation(() => {});

  db.getConnection.mockResolvedValue(connection);

  delete process.env.SRI_AMBIENTE;
});

describe('comprobanteService', () => {
  describe('generarClaveAcceso', () => {
    it('debe generar una clave con los valores proporcionados', () => {
      const clave = generarClaveAcceso({
        fecha: '2026-09-24',
        tipoComprobante: '01',
        ruc: '1234567890001',
        ambiente: '2',
        serie: '002003',
        numeroComprobante: '123',
        codigoNumerico: '87654321',
        tipoEmision: '1',
      });

      expect(clave).toMatch(/^\d+$/);
      expect(clave).toHaveLength(49);
    });

    it('debe aplicar los valores predeterminados', () => {
      const clave = generarClaveAcceso({
        fecha: '2026-09-24',
        numeroComprobante: '1',
      });

      expect(clave).toMatch(/^\d+$/);
      expect(clave).toHaveLength(49);
    });

    it('debe producir dígito verificador 0 cuando el módulo es 11', () => {
      const clave = generarClaveAcceso({
        fecha: '2026-09-24',
        tipoComprobante: '01',
        ruc: '9999999999001',
        ambiente: '1',
        serie: '001001',
        numeroComprobante: '0',
        codigoNumerico: '00000004',
        tipoEmision: '1',
      });

      expect(clave.endsWith('0')).toBe(true);
    });

    it('debe producir dígito verificador 1 cuando el módulo es 10', () => {
      const clave = generarClaveAcceso({
        fecha: '2026-09-24',
        tipoComprobante: '01',
        ruc: '9999999999001',
        ambiente: '1',
        serie: '001001',
        numeroComprobante: '0',
        codigoNumerico: '00000000',
        tipoEmision: '1',
      });

      expect(clave.endsWith('1')).toBe(true);
    });
  });

  describe('formatearNumeroFactura', () => {
    it('debe completar establecimiento, punto de emisión y secuencia', () => {
      expect(
        formatearNumeroFactura('1', '2', 15)
      ).toBe('001-002-000000015');
    });

    it('debe conservar valores que ya tienen la longitud requerida', () => {
      expect(
        formatearNumeroFactura('001', '002', 123456789)
      ).toBe('001-002-123456789');
    });
  });

  describe('obtenerPorcentajeIVA', () => {
    it('debe retornar el IVA configurado', async () => {
      db.query.mockResolvedValueOnce([
        [{ valor: '0.15' }],
      ]);

      await expect(obtenerPorcentajeIVA()).resolves.toBe(0.15);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('debe retornar 0.15 cuando no existe configuración', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await expect(obtenerPorcentajeIVA()).resolves.toBe(0.15);
    });

    it('debe usar 0.15 como fallback cuando la consulta falla', async () => {
      db.query.mockRejectedValueOnce(new Error('DB caída'));

      await expect(obtenerPorcentajeIVA()).resolves.toBe(0.15);

      expect(logger.warn).toHaveBeenCalledWith(
        'IVA_CONFIG_FALLBACK',
        expect.objectContaining({
          event: 'facturacion.iva_fallback',
          message: 'DB caída',
        })
      );
    });
  });

  describe('obtenerSiguienteSecuencia', () => {
    it('debe incrementar y confirmar la secuencia', async () => {
      connection.query
        .mockResolvedValueOnce([
          [{ id: 10, secuencia_actual: 25 }],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await obtenerSiguienteSecuencia(
        'FACTURA',
        '001',
        '001',
        7
      );

      expect(result).toEqual({
        secuencia: 26,
        numeroFormateado: '001-001-000000026',
      });

      expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(connection.query).toHaveBeenCalledTimes(2);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it('debe usar los valores predeterminados', async () => {
      connection.query
        .mockResolvedValueOnce([
          [{ id: 1, secuencia_actual: 0 }],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await obtenerSiguienteSecuencia();

      expect(result.numeroFormateado).toBe('001-001-000000001');

      expect(connection.query.mock.calls[0][1]).toEqual([
        'FACTURA',
        '001',
        '001',
      ]);
    });

    it('debe hacer rollback si no existe una secuencia activa', async () => {
      connection.query.mockResolvedValueOnce([[]]);

      await expect(
        obtenerSiguienteSecuencia('FACTURA', '001', '001')
      ).rejects.toThrow(
        'No existe secuencia activa para FACTURA 001-001'
      );

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it('debe hacer rollback cuando falla la consulta', async () => {
      connection.query.mockRejectedValueOnce(new Error('Error SQL'));

      await expect(
        obtenerSiguienteSecuencia()
      ).rejects.toThrow('Error SQL');

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('obtenerFacturaPorId', () => {
    it('debe obtener factura sin filtro de empresa', async () => {
      db.query
        .mockResolvedValueOnce([
          [{ id: 20, numero_factura: '001-001-000000020' }],
        ])
        .mockResolvedValueOnce([
          [{ id: 1, factura_id: 20, descripcion: 'Ventana' }],
        ]);

      const result = await obtenerFacturaPorId(20);

      expect(result).toEqual({
        id: 20,
        numero_factura: '001-001-000000020',
        detalle: [
          { id: 1, factura_id: 20, descripcion: 'Ventana' },
        ],
      });

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query.mock.calls[0][1]).toEqual([20]);
      expect(db.query.mock.calls[1][1]).toEqual([20]);
    });

    it('debe aplicar filtro por empresa cuando se proporciona empresaId', async () => {
      db.query
        .mockResolvedValueOnce([
          [{ id: 21, empresa_id: 5 }],
        ])
        .mockResolvedValueOnce([[]]);

      const result = await obtenerFacturaPorId(21, 5);

      expect(result).toEqual({
        id: 21,
        empresa_id: 5,
        detalle: [],
      });

      expect(db.query.mock.calls[0][1]).toEqual([21, 5]);
    });

    it('debe rechazar cuando la factura no existe', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await expect(
        obtenerFacturaPorId(999)
      ).rejects.toThrow('Factura no encontrada');

      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('anularFactura', () => {
    it('debe anular una factura y confirmar la transacción', async () => {
      connection.query
        .mockResolvedValueOnce([
          [{ estado: 'EMITIDA' }],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await anularFactura(10, 4, 'Error de emisión');

      expect(result).toBe(true);
      expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(connection.query).toHaveBeenCalledTimes(2);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);

      expect(logger.info).toHaveBeenCalledWith(
        'FACTURA_ANULADA',
        expect.objectContaining({
          event: 'facturacion.anulada',
          facturaId: 10,
          motivo: 'Error de emisión',
          userId: 4,
        })
      );
    });

    it('debe rechazar si la factura no existe', async () => {
      connection.query.mockResolvedValueOnce([[]]);

      await expect(
        anularFactura(99, 4, 'Motivo')
      ).rejects.toThrow('Factura no encontrada');

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar si la factura ya está anulada', async () => {
      connection.query.mockResolvedValueOnce([
        [{ estado: 'ANULADA' }],
      ]);

      await expect(
        anularFactura(10, 4, 'Motivo')
      ).rejects.toThrow('La factura ya está anulada');

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it('debe hacer rollback si falla la actualización', async () => {
      connection.query
        .mockResolvedValueOnce([
          [{ estado: 'EMITIDA' }],
        ])
        .mockRejectedValueOnce(new Error('Error UPDATE'));

      await expect(
        anularFactura(10, 4, 'Motivo')
      ).rejects.toThrow('Error UPDATE');

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('crearFacturaDesdePedido', () => {
    const pedidoBase = {
      id: 30,
      estado: 'ENTREGADO',
      pedido_total: '100.00',
      proforma_id: 40,
      observaciones: 'Observación del pedido',
      cliente_nombre: 'Cliente Pedido',
      cliente_telefono: '0999999999',
    };

    const itemBase = {
      id: 1,
      trabajo_id: 10,
      color_id: 5,
      ancho: '1.20',
      alto: '2.00',
      cantidad: '2',
      detalle: 'Vidrio especial',
      precio_unitario: '50.00',
      subtotal: '100.00',
      trabajo_nombre: 'Ventana',
      color_nombre: 'Negro',
    };

    it('debe crear una factura completa desde un pedido', async () => {
      connection.query
        .mockResolvedValueOnce([[pedidoBase]])
        .mockResolvedValueOnce([[itemBase]])
        .mockResolvedValueOnce([
          [{ id: 1, secuencia_actual: 10 }],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ insertId: 500 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      db.query
        .mockResolvedValueOnce([[{ valor: '0.15' }]])
        .mockResolvedValueOnce([
          [{
            id: 500,
            numero_factura: '001-001-000000011',
          }],
        ])
        .mockResolvedValueOnce([
          [{ factura_id: 500, descripcion: 'Ventana' }],
        ]);

      const result = await crearFacturaDesdePedido(
        30,
        7,
        {},
        3
      );

      expect(result).toEqual({
        id: 500,
        numero_factura: '001-001-000000011',
        detalle: [
          { factura_id: 500, descripcion: 'Ventana' },
        ],
      });

      expect(connection.beginTransaction).toHaveBeenCalledTimes(2);
      expect(connection.commit).toHaveBeenCalledTimes(2);
      expect(connection.rollback).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(2);

      expect(logger.info).toHaveBeenCalledWith(
        'FACTURA_CREADA_DESDE_PEDIDO',
        expect.objectContaining({
          event: 'facturacion.creada_desde_pedido',
          facturaId: 500,
          numeroFactura: '001-001-000000011',
          pedidoId: 30,
          proformaId: 40,
          cliente: 'Cliente Pedido',
          userId: 7,
        })
      );
    });

    it('debe aplicar datos adicionales del cliente y observaciones', async () => {
      const pedido = {
        ...pedidoBase,
        observaciones: null,
        cliente_nombre: null,
        cliente_telefono: null,
      };

      const item = {
        ...itemBase,
        subtotal: '0',
        color_nombre: null,
        detalle: '   ',
      };

      connection.query
        .mockResolvedValueOnce([[pedido]])
        .mockResolvedValueOnce([[item]])
        .mockResolvedValueOnce([
          [{ id: 2, secuencia_actual: 20 }],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ insertId: 501 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      db.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([
          [{ id: 501 }],
        ])
        .mockResolvedValueOnce([[]]);

      const datos = {
        clienteNombre: 'Cliente Alternativo',
        clienteIdentificacion: '1300000000',
        clienteDireccion: 'Dirección',
        clienteTelefono: '0988888888',
        clienteEmail: 'cliente@example.com',
        tipoIdentificacion: '05',
        observaciones: 'Observación adicional',
      };

      const result = await crearFacturaDesdePedido(
        30,
        8,
        datos
      );

      expect(result).toEqual({
        id: 501,
        detalle: [],
      });

      const insertCall = connection.query.mock.calls.find(
        ([sql]) => sql.includes('INSERT INTO facturas')
      );

      expect(insertCall[1]).toEqual(
        expect.arrayContaining([
          '05',
          'Cliente Alternativo',
          '1300000000',
          'Dirección',
          '0988888888',
          'cliente@example.com',
          'Observación adicional',
        ])
      );
    });

    it('debe usar teléfono y observaciones del pedido cuando no llegan datos adicionales', async () => {
      const pedido = {
        ...pedidoBase,
        cliente_nombre: null,
        observaciones: 'Obs pedido',
      };

      const item = {
        ...itemBase,
        subtotal: '0',
        color_nombre: null,
        detalle: null,
      };

      connection.query
        .mockResolvedValueOnce([[pedido]])
        .mockResolvedValueOnce([[item]])
        .mockResolvedValueOnce([
          [{ id: 3, secuencia_actual: 30 }],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ insertId: 502 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      db.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ id: 502 }]])
        .mockResolvedValueOnce([[]]);

      await crearFacturaDesdePedido(30, 9, {});

      const insertCall = connection.query.mock.calls.find(
        ([sql]) => sql.includes('INSERT INTO facturas')
      );

      expect(insertCall[1]).toEqual(
        expect.arrayContaining([
          'CONSUMIDOR_FINAL',
          'CONSUMIDOR FINAL',
          '0999999999',
          'Obs pedido',
        ])
      );
    });

    it('debe usar null cuando no existen teléfono ni observaciones', async () => {
      const pedido = {
        ...pedidoBase,
        cliente_nombre: null,
        cliente_telefono: null,
        observaciones: null,
      };

      const item = {
        ...itemBase,
        subtotal: '0',
        color_nombre: null,
        detalle: null,
      };

      connection.query
        .mockResolvedValueOnce([[pedido]])
        .mockResolvedValueOnce([[item]])
        .mockResolvedValueOnce([
          [{ id: 4, secuencia_actual: 40 }],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ insertId: 503 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      db.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ id: 503 }]])
        .mockResolvedValueOnce([[]]);

      await crearFacturaDesdePedido(30, 10, {});

      const insertCall = connection.query.mock.calls.find(
        ([sql]) => sql.includes('INSERT INTO facturas')
      );

      expect(insertCall[1][8]).toBeNull();
      expect(insertCall[1][17]).toBeNull();
    });

    it('debe rechazar si el pedido no existe', async () => {
      connection.query.mockResolvedValueOnce([[]]);

      await expect(
        crearFacturaDesdePedido(999, 1)
      ).rejects.toThrow('Pedido no encontrado');

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar si el pedido no tiene proforma', async () => {
      connection.query.mockResolvedValueOnce([[
        {
          ...pedidoBase,
          proforma_id: null,
        },
      ]]);

      await expect(
        crearFacturaDesdePedido(30, 1)
      ).rejects.toThrow(
        'El pedido no tiene proforma asociada. Usa factura manual para este caso.'
      );

      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar si el pedido no está entregado', async () => {
      connection.query.mockResolvedValueOnce([[
        {
          ...pedidoBase,
          estado: 'PENDIENTE',
        },
      ]]);

      await expect(
        crearFacturaDesdePedido(30, 1)
      ).rejects.toThrow(
        'El pedido debe estar en estado ENTREGADO para facturar. Estado actual: PENDIENTE'
      );

      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar si la proforma no tiene trabajos', async () => {
      connection.query
        .mockResolvedValueOnce([[pedidoBase]])
        .mockResolvedValueOnce([[]]);

      await expect(
        crearFacturaDesdePedido(30, 1)
      ).rejects.toThrow(
        'La proforma asociada no tiene trabajos registrados'
      );

      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    it('debe hacer rollback si falla una operación posterior a la secuencia', async () => {
      connection.query
        .mockResolvedValueOnce([[pedidoBase]])
        .mockResolvedValueOnce([[itemBase]])
        .mockResolvedValueOnce([
          [{ id: 4, secuencia_actual: 40 }],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockRejectedValueOnce(new Error('Error INSERT factura'));

      db.query.mockResolvedValueOnce([[{ valor: '0.15' }]]);

      await expect(
        crearFacturaDesdePedido(30, 1)
      ).rejects.toThrow('Error INSERT factura');

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(2);
    });
  });
});
