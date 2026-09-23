/**
 * @fileoverview Servicio de Comprobantes Electrónicos
 * @module shared/services/comprobanteService
 * 📦 Sprint 20 — Movido de services/comprobanteService.js
 *                config/database → ../../../config/database
 *                utils/logger    → ../../../utils/logger
 */

const db     = require('../../../config/database');
const logger = require('../../../utils/logger');

const generarClaveAcceso = (datos) => {
  const {
    fecha, tipoComprobante = '01',
    ruc = '9999999999001', ambiente = '1',
    serie = '001001', numeroComprobante,
    codigoNumerico = '00000001', tipoEmision = '1'
  } = datos;

  const fechaFormato = fecha.replace(/[^0-9]/g, '').slice(0, 8);
  const claveSinVerificador =
    fechaFormato + tipoComprobante + ruc + ambiente +
    serie + numeroComprobante.padStart(9, '0') + codigoNumerico + tipoEmision;

  return claveSinVerificador + calcularModulo11(claveSinVerificador);
};

const calcularModulo11 = (cadena) => {
  let suma = 0, factor = 2;
  for (let i = cadena.length - 1; i >= 0; i--) {
    suma += parseInt(cadena[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const modulo = 11 - (suma % 11);
  if (modulo === 11) return '0';
  if (modulo === 10) return '1';
  return modulo.toString();
};

const formatearNumeroFactura = (establecimiento, puntoEmision, secuencia) =>
  `${establecimiento.padStart(3, '0')}-${puntoEmision.padStart(3, '0')}-${secuencia.toString().padStart(9, '0')}`;

const obtenerPorcentajeIVA = async () => {
  try {
    const [rows] = await db.query("SELECT valor FROM configuracion WHERE clave = 'IVA' LIMIT 1");
    return rows.length > 0 ? parseFloat(rows[0].valor) : 0.15;
  } catch (error) {
    logger.warn('IVA_CONFIG_FALLBACK', { event: 'facturacion.iva_fallback', message: error.message });
    return 0.15;
  }
};

const obtenerSiguienteSecuencia = async (
  tipoComprobante = 'FACTURA',
  establecimiento = '001',
  puntoEmision    = '001',
  empresaId       = null
) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, secuencia_actual
       FROM secuencias_comprobantes
       WHERE tipo_comprobante = ?
         AND establecimiento  = ?
         AND punto_emision    = ?
         AND activo = 1
       FOR UPDATE`,
      [tipoComprobante, establecimiento, puntoEmision]
    );

    if (rows.length === 0)
      throw new Error(`No existe secuencia activa para ${tipoComprobante} ${establecimiento}-${puntoEmision}`);

    const secuenciaActual = rows[0].secuencia_actual + 1;
    await connection.query(
      'UPDATE secuencias_comprobantes SET secuencia_actual = ? WHERE id = ?',
      [secuenciaActual, rows[0].id]
    );
    await connection.commit();

    return {
      secuencia:        secuenciaActual,
      numeroFormateado: formatearNumeroFactura(establecimiento, puntoEmision, secuenciaActual)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const crearFacturaDesdePedido = async (pedidoId, usuarioId, datosAdicionales = {}, empresaId = null) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [pedidos] = await connection.query(
      `SELECT p.id, p.estado, p.total AS pedido_total, p.proforma_id, p.observaciones,
              pr.cliente AS cliente_nombre, pr.telefono AS cliente_telefono
       FROM pedidos p
       INNER JOIN proformas pr ON pr.id = p.proforma_id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      [pedidoId]
    );

    if (pedidos.length === 0)         throw new Error('Pedido no encontrado');
    const pedido = pedidos[0];
    if (!pedido.proforma_id)          throw new Error('El pedido no tiene proforma asociada. Usa factura manual para este caso.');
    if (pedido.estado !== 'ENTREGADO') throw new Error(`El pedido debe estar en estado ENTREGADO para facturar. Estado actual: ${pedido.estado}`);

    const [items] = await connection.query(
      `SELECT pi.id, pi.trabajo_id, pi.color_id, pi.ancho, pi.alto, pi.cantidad,
              pi.detalle, pi.precio_unitario, pi.subtotal,
              t.nombre AS trabajo_nombre, c.nombre AS color_nombre
       FROM proforma_items pi
       INNER JOIN trabajos t ON t.id = pi.trabajo_id
       LEFT  JOIN colores  c ON c.id = pi.color_id
       WHERE pi.proforma_id = ? ORDER BY pi.id`,
      [pedido.proforma_id]
    );

    if (items.length === 0) throw new Error('La proforma asociada no tiene trabajos registrados');

    const { secuencia, numeroFormateado } = await obtenerSiguienteSecuencia('FACTURA', '001', '001', empresaId);
    const fechaEmision = new Date().toISOString().split('T')[0];
    const claveAcceso  = generarClaveAcceso({
      fecha: fechaEmision.replace(/-/g, ''), tipoComprobante: '01',
      serie: '001001', numeroComprobante: secuencia.toString(),
      ambiente: process.env.SRI_AMBIENTE || '1'
    });

    const porcentajeIVA = await obtenerPorcentajeIVA();
    let subtotalConIVA = 0, totalIVA = 0;

    const detalleCalculado = items.map(item => {
      const subtotalItem = parseFloat(item.subtotal) > 0
        ? parseFloat(item.subtotal)
        : parseFloat(pedido.pedido_total) / items.length;
      const ivaItem = parseFloat((subtotalItem * porcentajeIVA).toFixed(2));
      subtotalConIVA += subtotalItem;
      totalIVA       += ivaItem;

      const medidas    = `${parseFloat(item.ancho).toFixed(2)}×${parseFloat(item.alto).toFixed(2)}m`;
      let descripcion  = `${item.trabajo_nombre}`;
      if (item.color_nombre)  descripcion += ` — ${item.color_nombre}`;
      descripcion += ` (${medidas}) ×${item.cantidad}`;
      if (item.detalle?.trim()) descripcion += ` · ${item.detalle.trim()}`;

      return {
        descripcion: descripcion.slice(0, 300),
        cantidad: parseFloat(item.cantidad),
        precio_unitario: parseFloat(item.precio_unitario) || 0,
        subtotal: subtotalItem,
        porcentaje_iva: porcentajeIVA * 100,
        valor_iva: ivaItem,
      };
    });

    const total          = parseFloat((subtotalConIVA + totalIVA).toFixed(2));
    const clienteNombre  = datosAdicionales.clienteNombre || pedido.cliente_nombre || 'CONSUMIDOR FINAL';

    const [resultFactura] = await connection.query(
      `INSERT INTO facturas (
        numero_factura, clave_acceso, pedido_id, usuario_id,
        cliente_tipo_identificacion, cliente_nombre, cliente_identificacion,
        cliente_direccion, cliente_telefono, cliente_email,
        fecha_emision, subtotal_sin_iva, subtotal_con_iva,
        iva, descuento, propina, total, estado, estado_sri, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EMITIDA', 'SIN_ENVIAR', ?)`,
      [
        numeroFormateado, claveAcceso, pedidoId, usuarioId,
        datosAdicionales.tipoIdentificacion   || 'CONSUMIDOR_FINAL',
        clienteNombre,
        datosAdicionales.clienteIdentificacion || null,
        datosAdicionales.clienteDireccion      || null,
        datosAdicionales.clienteTelefono       || pedido.cliente_telefono || null,
        datosAdicionales.clienteEmail          || null,
        fechaEmision, '0.00', subtotalConIVA.toFixed(2),
        totalIVA.toFixed(2), '0.00', '0.00', total,
        datosAdicionales.observaciones || pedido.observaciones || null
      ]
    );

    const facturaId = resultFactura.insertId;

    for (const item of detalleCalculado) {
      await connection.query(
        `INSERT INTO factura_detalle (
          factura_id, material_id, descripcion, cantidad,
          precio_unitario, descuento, precio_total_sin_iva, porcentaje_iva, valor_iva
        ) VALUES (?, NULL, ?, ?, ?, 0.00, ?, ?, ?)`,
        [
          facturaId, item.descripcion, item.cantidad,
          item.precio_unitario.toFixed(4), item.subtotal.toFixed(2),
          item.porcentaje_iva.toFixed(2), item.valor_iva.toFixed(2)
        ]
      );
    }

    await connection.commit();

    logger.info('FACTURA_CREADA_DESDE_PEDIDO', {
      event: 'facturacion.creada_desde_pedido',
      facturaId, numeroFactura: numeroFormateado,
      pedidoId, proformaId: pedido.proforma_id,
      cliente: clienteNombre, total, userId: usuarioId
    });

    return await obtenerFacturaPorId(facturaId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const obtenerFacturaPorId = async (facturaId, empresaId = null) => {
  const whereExtra = empresaId ? 'AND f.empresa_id = ?' : '';
  const params     = empresaId ? [facturaId, empresaId] : [facturaId];

  const [facturas] = await db.query(
    `SELECT f.*, u.nombre AS vendedor_nombre
     FROM facturas f LEFT JOIN usuarios u ON u.id = f.usuario_id
     WHERE f.id = ? ${whereExtra}`,
    params
  );
  if (facturas.length === 0) throw new Error('Factura no encontrada');

  const [detalle] = await db.query(
    'SELECT * FROM factura_detalle WHERE factura_id = ? ORDER BY id',
    [facturaId]
  );
  return { ...facturas[0], detalle };
};

const anularFactura = async (facturaId, usuarioId, motivo) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [facturas] = await connection.query('SELECT estado FROM facturas WHERE id = ?', [facturaId]);
    if (facturas.length === 0)             throw new Error('Factura no encontrada');
    if (facturas[0].estado === 'ANULADA')  throw new Error('La factura ya está anulada');

    await connection.query(
      `UPDATE facturas SET estado = 'ANULADA', estado_sri = 'SIN_ENVIAR',
       anulada_at = NOW(), anulada_por = ?, motivo_anulacion = ? WHERE id = ?`,
      [usuarioId, motivo, facturaId]
    );
    await connection.commit();
    logger.info('FACTURA_ANULADA', { event: 'facturacion.anulada', facturaId, motivo, userId: usuarioId });
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  generarClaveAcceso, formatearNumeroFactura, obtenerPorcentajeIVA,
  obtenerSiguienteSecuencia, crearFacturaDesdePedido,
  obtenerFacturaPorId, anularFactura,
};