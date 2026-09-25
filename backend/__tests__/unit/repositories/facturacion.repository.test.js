import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const db = {
  query: vi.fn(),
  getConnection: vi.fn(),
};

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === '../../../../config/database') {
    return db;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const repository = require(
  `${process.cwd()}/src/modules/comercial/facturacion/facturacion.repository.js`
);

const {
  obtenerFacturas,
  contarFacturas,
  obtenerFacturaPorId,
  obtenerFacturaPorNumero,
  crearFactura,
  crearFacturaConDetalle,
  actualizarFactura,
  anularFactura,
  crearDetalleFactura,
  obtenerDetalleFactura,
  obtenerResumenFacturacion,
  obtenerResumenMesAnterior,
  obtenerFacturacionMensual,
  obtenerFacturasPorEstado,
  obtenerTopClientes,
} = repository;

describe('facturacion.repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('obtenerFacturas', () => {
    it('consulta con todos los filtros y paginación', async () => {
      db.query.mockResolvedValueOnce([{ id: 1 }]);

      const filtros = {
        fechaDesde: '2026-01-01',
        fechaHasta: '2026-01-31',
        estado: 'EMITIDA',
        estadoSRI: 'AUTORIZADO',
        clienteNombre: 'Juan',
        numeroFactura: '001-001',
        pedidoId: 25,
        empresaId: 7,
      };

      const resultado = await obtenerFacturas(filtros, {
        limite: 20,
        offset: 40,
      });

      expect(resultado).toEqual([{ id: 1 }]);
      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('f.empresa_id = ?');
      expect(sql).toContain('f.pedido_id = ?');
      expect(sql).toContain('f.fecha_emision >= ?');
      expect(sql).toContain('f.fecha_emision <= ?');
      expect(sql).toContain('f.estado = ?');
      expect(sql).toContain('f.estado_sri = ?');
      expect(sql).toContain('f.cliente_nombre LIKE ?');
      expect(sql).toContain('f.numero_factura LIKE ?');
      expect(sql).toContain('LIMIT ? OFFSET ?');

      expect(params).toEqual([
        7,
        25,
        '2026-01-01',
        '2026-01-31',
        'EMITIDA',
        'AUTORIZADO',
        '%Juan%',
        '%001-001%',
        20,
        40,
      ]);
    });

    it('usa valores por defecto cuando no se proporcionan filtros ni paginación', async () => {
      db.query.mockResolvedValueOnce([]);

      const resultado = await obtenerFacturas();

      expect(resultado).toEqual([]);
      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('WHERE 1=1');
      expect(sql).toContain('LIMIT ? OFFSET ?');
      expect(params).toEqual([50, 0]);
    });

    it('acepta filtros vacíos y paginación parcial', async () => {
      db.query.mockResolvedValueOnce([]);

      await obtenerFacturas({}, { limite: 15 });

      const [, params] = db.query.mock.calls[0];

      expect(params).toEqual([15, 0]);
    });
  });

  describe('contarFacturas', () => {
    it('aplica todos los filtros', async () => {
      db.query.mockResolvedValueOnce([[{ total: 5 }]]);

      const resultado = await contarFacturas({
        fechaDesde: '2026-02-01',
        fechaHasta: '2026-02-28',
        estado: 'ANULADA',
        estadoSRI: 'NO_AUTORIZADO',
        clienteNombre: 'María',
        numeroFactura: '002',
        pedidoId: 30,
        empresaId: 8,
      });

      expect(resultado).toEqual([[{ total: 5 }]]);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('empresa_id = ?');
      expect(sql).toContain('pedido_id = ?');
      expect(sql).toContain('fecha_emision >= ?');
      expect(sql).toContain('fecha_emision <= ?');
      expect(sql).toContain('estado = ?');
      expect(sql).toContain('estado_sri = ?');
      expect(sql).toContain('cliente_nombre LIKE ?');
      expect(sql).toContain('numero_factura LIKE ?');

      expect(params).toEqual([
        8,
        30,
        '2026-02-01',
        '2026-02-28',
        'ANULADA',
        'NO_AUTORIZADO',
        '%María%',
        '%002%',
      ]);
    });

    it('consulta sin filtros cuando se usa el valor por defecto', async () => {
      db.query.mockResolvedValueOnce([[{ total: 0 }]]);

      const resultado = await contarFacturas();

      expect(resultado).toEqual([[{ total: 0 }]]);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('WHERE 1=1');
      expect(params).toEqual([]);
    });
  });

  describe('obtenerFacturaPorId', () => {
    it('devuelve null cuando la factura no existe', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const resultado = await obtenerFacturaPorId(10);

      expect(resultado).toBeNull();
      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('WHERE f.id = ?');
      expect(params).toEqual([10]);
    });

    it('devuelve la factura y su detalle sin empresaId', async () => {
      const factura = {
        id: 10,
        numero_factura: '001-001-000000010',
      };

      const detalle = [
        {
          id: 1,
          factura_id: 10,
          descripcion: 'Ventana',
        },
      ];

      db.query
        .mockResolvedValueOnce([[factura]])
        .mockResolvedValueOnce([detalle]);

      const resultado = await obtenerFacturaPorId(10);

      expect(resultado).toEqual({
        ...factura,
        detalle,
      });

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query.mock.calls[0][1]).toEqual([10]);
      expect(db.query.mock.calls[1][1]).toEqual([10]);
    });

    it('filtra por empresaId y conserva detalle cuando existe', async () => {
      const factura = {
        id: 11,
        empresa_id: 7,
      };

      const detalle = [
        {
          id: 2,
          factura_id: 11,
        },
      ];

      db.query
        .mockResolvedValueOnce([[factura]])
        .mockResolvedValueOnce([detalle]);

      const resultado = await obtenerFacturaPorId(11, 7);

      expect(resultado).toEqual({
        ...factura,
        detalle,
      });

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('AND f.empresa_id = ?');
      expect(params).toEqual([11, 7]);
      expect(db.query.mock.calls[1][1]).toEqual([11]);
    });

    it('devuelve null cuando rows es undefined', async () => {
      db.query.mockResolvedValueOnce([undefined]);

      const resultado = await obtenerFacturaPorId(12);

      expect(resultado).toBeNull();
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('usa empresaId nulo como ausencia de filtro', async () => {
      const factura = {
        id: 13,
        numero_factura: '001-001-000000013',
      };

      db.query
        .mockResolvedValueOnce([[factura]])
        .mockResolvedValueOnce([undefined]);

      const resultado = await obtenerFacturaPorId(13, null);

      expect(resultado).toEqual({
        ...factura,
        detalle: [],
      });

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).not.toContain('f.empresa_id = ?');
      expect(params).toEqual([13]);
    });
  });

  describe('obtenerFacturaPorNumero', () => {
    it('busca por número de factura', async () => {
      db.query.mockResolvedValueOnce([
        [{ id: 20, numero_factura: '001-001-000000020' }],
      ]);

      const resultado = await obtenerFacturaPorNumero(
        '001-001-000000020'
      );

      expect(resultado).toEqual([
        [{ id: 20, numero_factura: '001-001-000000020' }],
      ]);

      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM facturas WHERE numero_factura = ?',
        ['001-001-000000020']
      );
    });
  });

  describe('crearFactura', () => {
    it('crea una factura con todos los datos y serializa datos_adicionales', async () => {
      db.query.mockResolvedValueOnce([{ insertId: 10 }]);

      const datos = {
        empresa_id: 1,
        numero_factura: '001-001-000000010',
        clave_acceso: '123456',
        pedido_id: 20,
        cliente_id: 30,
        usuario_id: 40,
        cliente_identificacion: '1300000000',
        cliente_tipo_identificacion: 'CEDULA',
        cliente_nombre: 'Juan Pérez',
        cliente_direccion: 'Centro',
        cliente_telefono: '0999999999',
        cliente_email: 'juan@example.com',
        fecha_emision: '2026-09-23',
        subtotal_sin_iva: 100,
        subtotal_con_iva: 115,
        iva: 15,
        descuento: 5,
        propina: 2,
        total: 112,
        estado: 'EMITIDA',
        estado_sri: 'AUTORIZADO',
        observaciones: 'Observación',
        datos_adicionales: {
          origen: 'prueba',
          referencia: 'ABC',
        },
      };

      const resultado = await crearFactura(datos);

      expect(resultado).toEqual([{ insertId: 10 }]);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('INSERT INTO facturas');
      expect(sql).toContain('empresa_id');
      expect(sql).toContain('datos_adicionales');

      expect(params).toEqual([
        1,
        '001-001-000000010',
        '123456',
        20,
        30,
        40,
        '1300000000',
        'CEDULA',
        'Juan Pérez',
        'Centro',
        '0999999999',
        'juan@example.com',
        '2026-09-23',
        100,
        115,
        15,
        5,
        2,
        112,
        'EMITIDA',
        'AUTORIZADO',
        'Observación',
        JSON.stringify({
          origen: 'prueba',
          referencia: 'ABC',
        }),
      ]);
    });

    it('aplica valores por defecto y null para datos_adicionales ausentes', async () => {
      db.query.mockResolvedValueOnce([{ insertId: 11 }]);

      const datos = {
        empresa_id: 1,
        numero_factura: '001-001-000000011',
        clave_acceso: 'ABC',
        pedido_id: 2,
        cliente_id: 3,
        usuario_id: 4,
        cliente_identificacion: '123',
        cliente_tipo_identificacion: 'CEDULA',
        cliente_nombre: 'Cliente',
        cliente_direccion: 'Dirección',
        cliente_telefono: '099',
        cliente_email: 'cliente@example.com',
        fecha_emision: '2026-09-23',
        subtotal_sin_iva: 10,
        subtotal_con_iva: 11.5,
        iva: 1.5,
        total: 11.5,
      };

      await crearFactura(datos);

      const [, params] = db.query.mock.calls[0];

      expect(params).toEqual([
        1,
        '001-001-000000011',
        'ABC',
        2,
        3,
        4,
        '123',
        'CEDULA',
        'Cliente',
        'Dirección',
        '099',
        'cliente@example.com',
        '2026-09-23',
        10,
        11.5,
        1.5,
        0,
        0,
        11.5,
        'BORRADOR',
        'SIN_ENVIAR',
        undefined,
        null,
      ]);
    });

    it('convierte datos_adicionales null en null', async () => {
      db.query.mockResolvedValueOnce([{ insertId: 12 }]);

      const datos = {
        empresa_id: 1,
        numero_factura: '001-001-000000012',
        usuario_id: 4,
        cliente_nombre: 'Cliente',
        fecha_emision: '2026-09-23',
        subtotal_sin_iva: 10,
        subtotal_con_iva: 11.5,
        iva: 1.5,
        total: 11.5,
        datos_adicionales: null,
      };

      await crearFactura(datos);

      const [, params] = db.query.mock.calls[0];

      expect(params.at(-1)).toBeNull();
    });
  });

  describe('crearFacturaConDetalle', () => {
    const crearConexionMock = () => {
      const conn = {
        beginTransaction: vi.fn(),
        query: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
      };

      db.getConnection.mockResolvedValue(conn);

      return conn;
    };

    it('crea factura y múltiples detalles dentro de una transacción', async () => {
      const conn = crearConexionMock();

      conn.query
        .mockResolvedValueOnce([{ insertId: 501 }, []])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const datosFact = {
        empresa_id: 1,
        numero_factura: '001-001-000000501',
        clave_acceso: 'CLAVE',
        pedido_id: 20,
        cliente_id: 30,
        usuario_id: 40,
        cliente_identificacion: '1300000000',
        cliente_tipo_identificacion: 'CEDULA',
        cliente_nombre: 'Cliente',
        cliente_direccion: 'Dirección',
        cliente_telefono: '099',
        cliente_email: 'cliente@example.com',
        fecha_emision: '2026-09-23',
        subtotal_sin_iva: 100,
        subtotal_con_iva: 115,
        iva: 15,
        descuento: 5,
        propina: 2,
        total: 112,
        estado: 'EMITIDA',
        estado_sri: 'AUTORIZADO',
        observaciones: 'Obs',
      };

      const items = [
        {
          material_id: 1,
          codigo_principal: 'MAT-001',
          codigo_auxiliar: 'AUX-001',
          descripcion: 'Vidrio',
          cantidad: 2,
          precio_unitario: 20,
          descuento: 1,
          precio_total_sin_iva: 39,
          porcentaje_iva: 15,
          valor_iva: 5.85,
          detalles_adicionales: {
            color: 'Claro',
          },
        },
        {
          material_id: 2,
          codigo_principal: 'MAT-002',
          codigo_auxiliar: 'AUX-002',
          descripcion: 'Aluminio',
          cantidad: 3,
          precio_unitario: 30,
          descuento: 0,
          precio_total_sin_iva: 90,
          porcentaje_iva: 15,
          valor_iva: 13.5,
        },
      ];

      const resultado = await crearFacturaConDetalle(
        datosFact,
        items
      );

      expect(resultado).toBe(501);
      expect(conn.beginTransaction).toHaveBeenCalledTimes(1);
      expect(conn.commit).toHaveBeenCalledTimes(1);
      expect(conn.rollback).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
      expect(conn.query).toHaveBeenCalledTimes(3);

      const [, facturaParams] = conn.query.mock.calls[0];

      expect(facturaParams).toEqual([
        1,
        '001-001-000000501',
        'CLAVE',
        20,
        30,
        40,
        '1300000000',
        'CEDULA',
        'Cliente',
        'Dirección',
        '099',
        'cliente@example.com',
        '2026-09-23',
        100,
        115,
        15,
        5,
        2,
        112,
        'EMITIDA',
        'AUTORIZADO',
        'Obs',
      ]);

      const [, firstItemParams] = conn.query.mock.calls[1];

      expect(firstItemParams).toEqual([
        501,
        1,
        'MAT-001',
        'AUX-001',
        'Vidrio',
        2,
        20,
        1,
        39,
        15,
        5.85,
        JSON.stringify({
          color: 'Claro',
        }),
      ]);

      const [, secondItemParams] = conn.query.mock.calls[2];

      expect(secondItemParams).toEqual([
        501,
        2,
        'MAT-002',
        'AUX-002',
        'Aluminio',
        3,
        30,
        0,
        90,
        15,
        13.5,
        null,
      ]);
    });

    it('aplica todos los valores por defecto de datos de factura', async () => {
      const conn = crearConexionMock();

      conn.query.mockResolvedValueOnce([{ insertId: 502 }]);

      const datosFact = {
        empresa_id: 1,
        numero_factura: '001-001-000000502',
        usuario_id: 4,
        cliente_nombre: 'Cliente',
        fecha_emision: '2026-09-23',
        subtotal_sin_iva: 10,
        subtotal_con_iva: 11.5,
        iva: 1.5,
        total: 11.5,
      };

      const resultado = await crearFacturaConDetalle(
        datosFact,
        []
      );

      expect(resultado).toBe(502);

      const [, params] = conn.query.mock.calls[0];

      expect(params).toEqual([
        1,
        '001-001-000000502',
        null,
        null,
        null,
        4,
        null,
        'CONSUMIDOR_FINAL',
        'Cliente',
        null,
        null,
        null,
        '2026-09-23',
        10,
        11.5,
        1.5,
        0,
        0,
        11.5,
        'EMITIDA',
        'SIN_ENVIAR',
        null,
      ]);

      expect(conn.commit).toHaveBeenCalledTimes(1);
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    it('hace rollback, libera la conexión y relanza el error si falla la transacción', async () => {
      const conn = crearConexionMock();
      const error = new Error('fallo en transacción');

      conn.beginTransaction.mockRejectedValueOnce(error);

      await expect(
        crearFacturaConDetalle(
          {
            empresa_id: 1,
            numero_factura: '001-001-000000503',
            usuario_id: 4,
            cliente_nombre: 'Cliente',
            fecha_emision: '2026-09-23',
            subtotal_sin_iva: 10,
            subtotal_con_iva: 11.5,
            iva: 1.5,
            total: 11.5,
          },
          []
        )
      ).rejects.toThrow('fallo en transacción');

      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    it('hace rollback cuando falla un detalle', async () => {
      const conn = crearConexionMock();
      const error = new Error('fallo en detalle');

      conn.query
        .mockResolvedValueOnce([{ insertId: 504 }])
        .mockRejectedValueOnce(error);

      const item = {
        descripcion: 'Vidrio',
        cantidad: 1,
        precio_unitario: 10,
        precio_total_sin_iva: 10,
      };

      await expect(
        crearFacturaConDetalle(
          {
            empresa_id: 1,
            numero_factura: '001-001-000000504',
            usuario_id: 4,
            cliente_nombre: 'Cliente',
            fecha_emision: '2026-09-23',
            subtotal_sin_iva: 10,
            subtotal_con_iva: 11.5,
            iva: 1.5,
            total: 11.5,
          },
          [item]
        )
      ).rejects.toThrow('fallo en detalle');

      expect(conn.rollback).toHaveBeenCalledTimes(1);
      expect(conn.commit).not.toHaveBeenCalled();
      expect(conn.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('actualizarFactura', () => {
    it('rechaza cuando no hay campos actualizables', async () => {
      await expect(
        actualizarFactura(10, {})
      ).rejects.toThrow('No hay campos para actualizar');

      expect(db.query).not.toHaveBeenCalled();
    });

    it('actualiza todos los campos mapeables sin empresaId', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const datos = {
        estado: 'AUTORIZADA',
        estado_sri: 'AUTORIZADO',
        fecha_autorizacion: '2026-09-23 10:00:00',
        xml_firmado: '<xml>firmado</xml>',
        xml_autorizado: '<xml>autorizado</xml>',
        mensaje_sri: 'OK',
        observaciones: 'Actualizado',
        campo_extra: 'ignorado',
      };

      const resultado = await actualizarFactura(10, datos);

      expect(resultado).toEqual([{ affectedRows: 1 }]);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('estado = ?');
      expect(sql).toContain('estado_sri = ?');
      expect(sql).toContain('fecha_autorizacion = ?');
      expect(sql).toContain('xml_firmado = ?');
      expect(sql).toContain('xml_autorizado = ?');
      expect(sql).toContain('mensaje_sri = ?');
      expect(sql).toContain('observaciones = ?');
      expect(sql).not.toContain('campo_extra');

      expect(params).toEqual([
        'AUTORIZADA',
        'AUTORIZADO',
        '2026-09-23 10:00:00',
        '<xml>firmado</xml>',
        '<xml>autorizado</xml>',
        'OK',
        'Actualizado',
        10,
      ]);
    });

    it('ignora campos no definidos y filtra por empresaId', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await actualizarFactura(
        11,
        {
          estado: 'ANULADA',
          estado_sri: undefined,
          observaciones: undefined,
        },
        7
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('estado = ?');
      expect(sql).toContain('WHERE id = ? AND empresa_id = ?');
      expect(params).toEqual([
        'ANULADA',
        11,
        7,
      ]);
    });

    it('usa el camino sin empresaId cuando se proporciona null', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await actualizarFactura(
        12,
        {
          estado: 'EMITIDA',
        },
        null
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('WHERE id = ?');
      expect(sql).not.toContain('empresa_id = ?');
      expect(params).toEqual([
        'EMITIDA',
        12,
      ]);
    });

    it('actualiza sin filtro de empresa cuando empresaId es 0', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await actualizarFactura(
        13,
        {
          estado: 'EMITIDA',
        },
        0
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('WHERE id = ?');
      expect(sql).not.toContain('empresa_id = ?');

      expect(params).toEqual([
        'EMITIDA',
        13,
      ]);
    });

    it('actualiza sin filtro de empresa cuando empresaId es undefined', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await actualizarFactura(
        14,
        {
          estado: 'EMITIDA',
        }
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('WHERE id = ?');
      expect(sql).not.toContain('empresa_id = ?');

      expect(params).toEqual([
        'EMITIDA',
        14,
      ]);
    });
  });

  describe('anularFactura', () => {
    it('anula sin empresaId', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const resultado = await anularFactura(
        20,
        30,
        'Solicitud del cliente'
      );

      expect(resultado).toEqual([{ affectedRows: 1 }]);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toMatch(/estado\s*=\s*'ANULADA'/);
      expect(sql).toMatch(/estado_sri\s*=\s*'SIN_ENVIAR'/);
      expect(sql).toMatch(/anulada_at\s*=\s*NOW\(\)/);
      expect(sql).toMatch(/anulada_por\s*=\s*\?/);
      expect(sql).toMatch(/motivo_anulacion\s*=\s*\?/);
      expect(sql).toContain('WHERE id = ?');

      expect(params).toEqual([
        30,
        'Solicitud del cliente',
        20,
      ]);
    });

    it('anula filtrando por empresaId', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await anularFactura(
        21,
        31,
        'Error de emisión',
        8
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('WHERE id = ? AND empresa_id = ?');

      expect(params).toEqual([
        31,
        'Error de emisión',
        21,
        8,
      ]);
    });

    it('acepta empresaId null como ausencia de filtro', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await anularFactura(
        22,
        32,
        'Prueba',
        null
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).not.toContain('AND empresa_id = ?');

      expect(params).toEqual([
        32,
        'Prueba',
        22,
      ]);
    });
  });

  describe('crearDetalleFactura', () => {
    it('crea el detalle con todos los datos', async () => {
      db.query.mockResolvedValueOnce([{ insertId: 100 }]);

      const datos = {
        factura_id: 10,
        material_id: 20,
        codigo_principal: 'MAT-001',
        codigo_auxiliar: 'AUX-001',
        descripcion: 'Vidrio templado',
        cantidad: 2,
        precio_unitario: 50,
        descuento: 5,
        precio_total_sin_iva: 95,
        porcentaje_iva: 15,
        valor_iva: 14.25,
        detalles_adicionales: {
          espesor: '6mm',
        },
      };

      const resultado = await crearDetalleFactura(datos);

      expect(resultado).toEqual([{ insertId: 100 }]);

      const [, params] = db.query.mock.calls[0];

      expect(params).toEqual([
        10,
        20,
        'MAT-001',
        'AUX-001',
        'Vidrio templado',
        2,
        50,
        5,
        95,
        15,
        14.25,
        JSON.stringify({
          espesor: '6mm',
        }),
      ]);
    });

    it('aplica defaults cuando los campos opcionales no existen', async () => {
      db.query.mockResolvedValueOnce([{ insertId: 101 }]);

      await crearDetalleFactura({
        factura_id: 11,
        descripcion: 'Aluminio',
        cantidad: 3,
        precio_unitario: 20,
        precio_total_sin_iva: 60,
        porcentaje_iva: undefined,
        valor_iva: undefined,
      });

      const [, params] = db.query.mock.calls[0];

      expect(params).toEqual([
        11,
        null,
        null,
        null,
        'Aluminio',
        3,
        20,
        0,
        60,
        undefined,
        undefined,
        null,
      ]);
    });

    it('convierte detalles_adicionales null en null', async () => {
      db.query.mockResolvedValueOnce([{ insertId: 102 }]);

      await crearDetalleFactura({
        factura_id: 12,
        descripcion: 'Material',
        cantidad: 1,
        precio_unitario: 10,
        precio_total_sin_iva: 10,
        porcentaje_iva: 15,
        valor_iva: 1.5,
        detalles_adicionales: null,
      });

      const [, params] = db.query.mock.calls[0];

      expect(params.at(-1)).toBeNull();
    });
  });

  describe('obtenerDetalleFactura', () => {
    it('consulta el detalle por factura', async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            factura_id: 10,
            descripcion: 'Ventana',
          },
        ],
      ]);

      const resultado = await obtenerDetalleFactura(10);

      expect(resultado).toEqual([
        [
          {
            id: 1,
            factura_id: 10,
            descripcion: 'Ventana',
          },
        ],
      ]);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('FROM factura_detalle fd');
      expect(sql).toContain('LEFT JOIN materiales m');
      expect(sql).toContain('WHERE fd.factura_id = ?');
      expect(params).toEqual([10]);
    });
  });

  describe('obtenerResumenFacturacion', () => {
    it('consulta con empresaId', async () => {
      db.query.mockResolvedValueOnce([[{ total_facturas: 5 }]]);

      const resultado = await obtenerResumenFacturacion(
        '2026-01-01',
        '2026-01-31',
        7
      );

      expect(resultado).toEqual([[{ total_facturas: 5 }]]);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('WHERE fecha_emision BETWEEN ? AND ?');
      expect(sql).toContain('AND empresa_id = ?');
      expect(params).toEqual([
        '2026-01-01',
        '2026-01-31',
        7,
      ]);
    });

    it('consulta sin empresaId', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await obtenerResumenFacturacion(
        '2026-02-01',
        '2026-02-28'
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain(
        'WHERE fecha_emision BETWEEN ? AND ?'
      );
      expect(params).toEqual([
        '2026-02-01',
        '2026-02-28',
      ]);
    });

    it('acepta empresaId null', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await obtenerResumenFacturacion(
        '2026-03-01',
        '2026-03-31',
        null
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).not.toContain('AND empresa_id = ?');
      expect(params).toEqual([
        '2026-03-01',
        '2026-03-31',
      ]);
    });
  });

  describe('obtenerResumenMesAnterior', () => {
    it('consulta con empresaId', async () => {
      db.query.mockResolvedValueOnce([[{ total_facturas: 4 }]]);

      await obtenerResumenMesAnterior(7);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain(
        'DATE_SUB(NOW(), INTERVAL 1 MONTH)'
      );
      expect(sql).toContain('AND empresa_id = ?');
      expect(params).toEqual([7]);
    });

    it('consulta sin empresaId', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await obtenerResumenMesAnterior();

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain(
        "DATE_FORMAT(NOW(), '%Y-%m-01')"
      );
      expect(sql).not.toContain('AND empresa_id = ?');
      expect(params).toEqual([]);
    });

    it('acepta empresaId null', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await obtenerResumenMesAnterior(null);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).not.toContain('AND empresa_id = ?');
      expect(params).toEqual([]);
    });
  });

  describe('obtenerFacturacionMensual', () => {
    it('consulta con empresaId', async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            mes: '2026-01',
            total: 100,
            cantidad: 2,
          },
        ],
      ]);

      const resultado = await obtenerFacturacionMensual(
        '2026-01-01',
        '2026-03-31',
        7
      );

      expect(resultado).toEqual([
        [
          {
            mes: '2026-01',
            total: 100,
            cantidad: 2,
          },
        ],
      ]);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain(
        "DATE_FORMAT(fecha_emision, '%Y-%m') AS mes"
      );
      expect(sql).toContain('AND empresa_id = ?');
      expect(sql).toContain('GROUP BY');
      expect(sql).toContain('ORDER BY mes ASC');

      expect(params).toEqual([
        '2026-01-01',
        '2026-03-31',
        7,
      ]);
    });

    it('consulta sin empresaId', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await obtenerFacturacionMensual(
        '2026-01-01',
        '2026-03-31'
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).not.toContain('AND empresa_id = ?');
      expect(params).toEqual([
        '2026-01-01',
        '2026-03-31',
      ]);
    });
  });

  describe('obtenerFacturasPorEstado', () => {
    it('consulta con empresaId', async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            estado: 'EMITIDA',
            cantidad: 5,
            total: 500,
          },
        ],
      ]);

      const resultado = await obtenerFacturasPorEstado(
        '2026-01-01',
        '2026-01-31',
        7
      );

      expect(resultado).toEqual([
        [
          {
            estado: 'EMITIDA',
            cantidad: 5,
            total: 500,
          },
        ],
      ]);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('AND empresa_id = ?');
      expect(sql).toContain('GROUP BY estado');
      expect(sql).toContain('ORDER BY cantidad DESC');

      expect(params).toEqual([
        '2026-01-01',
        '2026-01-31',
        7,
      ]);
    });

    it('consulta sin empresaId', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await obtenerFacturasPorEstado(
        '2026-02-01',
        '2026-02-28'
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).not.toContain('AND empresa_id = ?');

      expect(params).toEqual([
        '2026-02-01',
        '2026-02-28',
      ]);
    });

    it('acepta empresaId null', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await obtenerFacturasPorEstado(
        '2026-03-01',
        '2026-03-31',
        null
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).not.toContain('AND empresa_id = ?');

      expect(params).toEqual([
        '2026-03-01',
        '2026-03-31',
      ]);
    });
  });

  describe('obtenerTopClientes', () => {
    it('consulta con empresaId y límite personalizado', async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            cliente_nombre: 'Juan',
            cliente_identificacion: '1300000000',
            total_facturas: 5,
            total: 500,
          },
        ],
      ]);

      const resultado = await obtenerTopClientes(
        '2026-01-01',
        '2026-01-31',
        5,
        7
      );

      expect(resultado).toEqual([
        [
          {
            cliente_nombre: 'Juan',
            cliente_identificacion: '1300000000',
            total_facturas: 5,
            total: 500,
          },
        ],
      ]);

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).toContain('AND empresa_id = ?');
      expect(sql).toContain(
        'GROUP BY cliente_nombre, cliente_identificacion'
      );
      expect(sql).toContain('ORDER BY total DESC');
      expect(sql).toContain('LIMIT ?');

      expect(params).toEqual([
        '2026-01-01',
        '2026-01-31',
        7,
        5,
      ]);
    });

    it('consulta sin empresaId y usa límite por defecto', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await obtenerTopClientes(
        '2026-02-01',
        '2026-02-28'
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).not.toContain('AND empresa_id = ?');

      expect(params).toEqual([
        '2026-02-01',
        '2026-02-28',
        10,
      ]);
    });

    it('acepta empresaId null', async () => {
      db.query.mockResolvedValueOnce([[]]);

      await obtenerTopClientes(
        '2026-03-01',
        '2026-03-31',
        8,
        null
      );

      const [sql, params] = db.query.mock.calls[0];

      expect(sql).not.toContain('AND empresa_id = ?');

      expect(params).toEqual([
        '2026-03-01',
        '2026-03-31',
        8,
      ]);
    });
  });
});